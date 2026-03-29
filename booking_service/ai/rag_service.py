# booking_service/ai/rag_service.py

from pathlib import Path
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaEmbeddings, OllamaLLM as Ollama
from langchain_core.prompts import PromptTemplate

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR      = Path(__file__).resolve().parent
KNOWLEDGE_DIR = BASE_DIR / "knowledge"
FAISS_INDEX   = BASE_DIR / "faiss_index"

# ─── Ollama config ─────────────────────────────────────────────────────────────
OLLAMA_MODEL    = "tinyllama"
OLLAMA_EMBED    = "nomic-embed-text"
OLLAMA_BASE_URL = "http://localhost:11434"

# ─── Prompt ───────────────────────────────────────────────────────────────────
PROMPT_TEMPLATE = """
You are BusGo's customer support assistant.
Answer ONLY the question asked. Do not repeat the question.
Use ONLY the context below. Keep your answer under 4 sentences.
If not in context, say: "Please contact BusGo support for this."

Context:
{context}

Question: {question}

Answer in 1-4 sentences only:
""".strip()


# ─── Load documents ───────────────────────────────────────────────────────────
def _load_documents():
    docs = []
    for txt_file in KNOWLEDGE_DIR.glob("*.txt"):
        loader = TextLoader(str(txt_file), encoding="utf-8")
        docs.extend(loader.load())
    print(f"[RAG] Loaded {len(docs)} documents from knowledge/")
    return docs


# ─── Split into chunks ────────────────────────────────────────────────────────
def _split_documents(docs):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size    = 500,
        chunk_overlap = 50,
    )
    chunks = splitter.split_documents(docs)
    print(f"[RAG] Split into {len(chunks)} chunks")
    return chunks


# ─── Build or load FAISS index ────────────────────────────────────────────────
def _build_vectorstore(chunks):
    embeddings = OllamaEmbeddings(
        model    = OLLAMA_EMBED,
        base_url = OLLAMA_BASE_URL,
    )
    if FAISS_INDEX.exists():
        print("[RAG] Loading existing FAISS index...")
        return FAISS.load_local(
            str(FAISS_INDEX),
            embeddings,
            allow_dangerous_deserialization=True,
        )
    else:
        print("[RAG] Building new FAISS index...")
        vectorstore = FAISS.from_documents(chunks, embeddings)
        vectorstore.save_local(str(FAISS_INDEX))
        print("[RAG] FAISS index saved.")
        return vectorstore


# ─── RAGService ───────────────────────────────────────────────────────────────
class RAGService:
    _instance = None

    def __init__(self):
        print("[RAG] Initialising RAGService...")
        docs        = _load_documents()
        chunks      = _split_documents(docs)
        self.vectorstore = _build_vectorstore(chunks)
        self.llm    = Ollama(
            model    = OLLAMA_MODEL,
            base_url = OLLAMA_BASE_URL,
        )
        print("[RAG] RAGService ready.")

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def answer(self, question: str, context: dict = None) -> str:
        # Enrich question with live context if provided
        enriched = self._enrich_with_context(question, context) if context else question

        try:
            # Step 1: find top 3 relevant chunks from FAISS
            docs = self.vectorstore.similarity_search(enriched, k=3)
            context_text = "\n\n".join([d.page_content for d in docs])

            # Step 2: build prompt
            prompt = PROMPT_TEMPLATE.format(
                context  = context_text,
                question = enriched,
            )

            # Step 3: send to Llama3
            response = self.llm.invoke(prompt)
            return response.strip()

        except Exception as e:
            return f"Sorry, I couldn't process that right now. ({str(e)})"

    def _enrich_with_context(self, question: str, context: dict) -> str:
        parts = [question]
        if context.get("source") and context.get("destination"):
            parts.append(
                f"[Context: passenger travelling from "
                f"{context['source']} to {context['destination']}.]"
            )
        if context.get("fare"):
            parts.append(f"[Fare: ₹{context['fare']}]")
        return " ".join(parts)


# ─── Rebuild index utility ────────────────────────────────────────────────────
def rebuild_index():
    import shutil
    if FAISS_INDEX.exists():
        shutil.rmtree(str(FAISS_INDEX))
        print("[RAG] Old index deleted.")
    docs   = _load_documents()
    chunks = _split_documents(docs)
    _build_vectorstore(chunks)
    print("[RAG] Index rebuilt successfully.")