# booking_service/ai/rag_service.py

import os
from pathlib import Path

from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.llms import Ollama
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR       = Path(__file__).resolve().parent
KNOWLEDGE_DIR  = BASE_DIR / "knowledge"
FAISS_INDEX    = BASE_DIR / "faiss_index"

# ─── Ollama config ────────────────────────────────────────────────────────────
OLLAMA_MODEL      = "llama3"
OLLAMA_EMBED      = "nomic-embed-text"   # best embedding model for Ollama
OLLAMA_BASE_URL   = "http://localhost:11434"


# ─── Step 1: Load all .txt files from knowledge/ ─────────────────────────────
def _load_documents():
    docs = []
    for txt_file in KNOWLEDGE_DIR.glob("*.txt"):
        loader = TextLoader(str(txt_file), encoding="utf-8")
        docs.extend(loader.load())
    print(f"[RAG] Loaded {len(docs)} documents from knowledge/")
    return docs


# ─── Step 2: Split into chunks ────────────────────────────────────────────────
def _split_documents(docs):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size    = 500,   # each chunk ~500 characters
        chunk_overlap = 50,    # 50 char overlap so context isn't lost
    )
    chunks = splitter.split_documents(docs)
    print(f"[RAG] Split into {len(chunks)} chunks")
    return chunks


# ─── Step 3: Build or load FAISS index ───────────────────────────────────────
def _build_vectorstore(chunks):
    embeddings = OllamaEmbeddings(
        model    = OLLAMA_EMBED,
        base_url = OLLAMA_BASE_URL,
    )

    if FAISS_INDEX.exists():
        # Load existing index — no need to re-embed every time
        print("[RAG] Loading existing FAISS index...")
        vectorstore = FAISS.load_local(
            str(FAISS_INDEX),
            embeddings,
            allow_dangerous_deserialization=True,
        )
    else:
        # Build fresh index from chunks
        print("[RAG] Building new FAISS index...")
        vectorstore = FAISS.from_documents(chunks, embeddings)
        vectorstore.save_local(str(FAISS_INDEX))
        print("[RAG] FAISS index saved.")

    return vectorstore


# ─── Step 4: Build the RAG chain ─────────────────────────────────────────────
def _build_chain(vectorstore):
    llm = Ollama(
        model    = OLLAMA_MODEL,
        base_url = OLLAMA_BASE_URL,
    )

    # Custom prompt — forces grounded answers
    prompt_template = """
You are BusGo's helpful customer support assistant.
Answer the passenger's question using ONLY the context provided below.
If the answer is not in the context, say:
"I don't have that information. Please contact BusGo support."

Be concise, friendly, and specific. Use bullet points when listing multiple items.

Context:
{context}

Passenger question: {question}

Answer:
""".strip()

    prompt = PromptTemplate(
        template      = prompt_template,
        input_variables = ["context", "question"],
    )

    chain = RetrievalQA.from_chain_type(
        llm            = llm,
        chain_type     = "stuff",
        retriever      = vectorstore.as_retriever(
            search_kwargs = {"k": 3}   # fetch top 3 relevant chunks
        ),
        chain_type_kwargs = {"prompt": prompt},
        return_source_documents = False,
    )

    return chain


# ─── RAGService class — used by Django views ──────────────────────────────────
class RAGService:
    _instance = None   # singleton — build index once, reuse forever

    def __init__(self):
        print("[RAG] Initialising RAGService...")
        docs        = _load_documents()
        chunks      = _split_documents(docs)
        vectorstore = _build_vectorstore(chunks)
        self.chain  = _build_chain(vectorstore)
        print("[RAG] RAGService ready.")

    @classmethod
    def get_instance(cls):
        """Singleton — only builds FAISS index once per server start."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def answer(self, question: str, context: dict = None) -> str:
        """
        Main method called by Django view.
        Optionally accepts live context (e.g. user's current route search).
        """
        # If user is asking about a specific route, inject live DB data
        if context:
            enriched = self._enrich_with_context(question, context)
        else:
            enriched = question

        try:
            result = self.chain.invoke({"query": enriched})
            return result.get("result", "").strip()
        except Exception as e:
            return f"Sorry, I couldn't process your question right now. Error: {str(e)}"

    def _enrich_with_context(self, question: str, context: dict) -> str:
        """
        Adds live data to the question so Llama3 has real numbers.
        Example: user asks 'how long is the journey?'
        We add 'The user is travelling from Bhopal to Indore departing 09:20'
        """
        parts = [question]

        if context.get("source") and context.get("destination"):
            parts.append(
                f"[Context: The passenger is travelling from "
                f"{context['source']} to {context['destination']}.]"
            )
        if context.get("departure"):
            parts.append(f"[Departure time: {context['departure']}]")
        if context.get("fare"):
            parts.append(f"[Fare paid: ₹{context['fare']}]")

        return " ".join(parts)


# ─── Utility: force rebuild index (call this after updating knowledge files) ──
def rebuild_index():
    """
    Run this from Django shell whenever you update knowledge .txt files:
    >>> from ai.rag_service import rebuild_index
    >>> rebuild_index()
    """
    import shutil
    if FAISS_INDEX.exists():
        shutil.rmtree(str(FAISS_INDEX))
        print("[RAG] Old index deleted.")
    docs   = _load_documents()
    chunks = _split_documents(docs)
    _build_vectorstore(chunks)
    print("[RAG] Index rebuilt successfully.")