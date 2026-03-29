# BusGo – AI Design Decisions & Architecture Notes

**Author: Tanu Namdeo**
**Project: BusGo – Smart Bus Booking & AI Route Recommendation System**

This document explains the reasoning behind every major AI and system architecture
decision made in BusGo. It is intended to demonstrate not just *what* was built,
but *why* each approach was chosen over alternatives.

---

## 1. Why a Multi-Layer AI System Instead of a Single Model?

Most booking platforms use a single sorting algorithm (cheapest first, or newest
first). I chose to architect a multi-layer system because a single model cannot
simultaneously handle structured scoring, natural language reasoning, semantic
retrieval, and predictive analytics — these are fundamentally different problem
types requiring different approaches.

The four layers are intentionally separated:

| Layer | Problem Type | Approach |
|-------|-------------|----------|
| Recommendation | Structured scoring | Weighted math + normalization |
| Reasoning | Natural language generation | Local LLM (Ollama) |
| Chatbot | Knowledge retrieval | RAG (LangChain + FAISS) |
| Price prediction | Regression | RandomForest (scikit-learn) |

Keeping them separate means each layer can fail, update, or be replaced
independently — a core principle of resilient AI system design.

---

## 2. Why Min-Max Normalization for Scoring?

The five scoring dimensions (price, speed, comfort, seats, rating) exist on
completely different scales:
- Price: ₹200 to ₹900
- Travel time: 120 to 600 minutes
- Comfort: categorical (AC Sleeper, Volvo, etc.)
- Seats: 0 to 48
- Rating: 0.0 to 5.0

Without normalization, price dominates the score purely because its numerical
range is larger. Min-max normalization compresses every dimension to [0, 1]
relative to the current result set — so the scoring is always fair within the
context of available options, not against a global average.

**Why not Z-score normalization?**
Z-score assumes a normal distribution. Bus prices and seat availability are
skewed distributions. Min-max is more appropriate and more interpretable
— a score of 0.85 means "85% of the way from worst to best in this search."

---

## 3. Why Four Preference Modes with Weight Profiles?

Different users have genuinely different priorities. A student travelling on
a budget and a business traveller on a deadline should not see the same ranking.

Rather than building four separate scoring functions, I used a single scoring
engine with swappable weight profiles:

```python
WEIGHT_PROFILES = {
    "cheap":    {"price": 0.50, "time": 0.15, "comfort": 0.10, "seats": 0.10, "rating": 0.15},
    "fast":     {"price": 0.10, "time": 0.55, "comfort": 0.10, "seats": 0.10, "rating": 0.15},
    "comfort":  {"price": 0.10, "time": 0.10, "comfort": 0.45, "seats": 0.10, "rating": 0.25},
    "balanced": {"price": 0.20, "time": 0.25, "comfort": 0.25, "seats": 0.10, "rating": 0.20},
}
```

This is extensible — adding a new preference mode requires only a new dictionary
entry, not new code. The same pattern applies to any multi-criteria decision
system, including scientific instrument recommendation where a researcher might
prioritise resolution vs throughput vs cost.

---

## 4. Why Confidence Scoring?

A recommendation without uncertainty quantification is not trustworthy.
If the system does not know how reliable a result is, it cannot communicate
that to the user — and the user may act on a poorly-supported recommendation.

The confidence score is computed by penalizing three conditions:

```python
base = 0.85
if bus.get("available_seats") is None: base -= 0.15  # missing data
if bus.get("bus_type") not in COMFORT_TIER: base -= 0.10  # unknown type
if spread < 0.15: base -= 0.10  # scores too similar to rank confidently
```

**Why this matters beyond booking:**
In scientific instrumentation, false confidence is dangerous. A system that
says "use this instrument" with 95% confidence when it actually has poor
retrieval coverage is worse than one that says "I'm 45% confident — verify
this recommendation." Explicit uncertainty is a feature, not a weakness.

---

## 5. Why Local LLM (Ollama) Instead of OpenAI API?

Three reasons:

**Offline operation.** The entire AI system runs without internet. This was
a deliberate design constraint — the same constraint that applies to lab
deployments where data sovereignty matters.

**Cost.** OpenAI API charges per token. For a system generating reasoning
for every bus in every search, costs scale quickly. Local inference has
zero marginal cost after setup.

**Control.** With a local model, the prompt, temperature, and output format
are fully controlled. There is no rate limiting, no API changes, and no
dependency on an external service's uptime.

**Tradeoff acknowledged:** Local models (especially smaller ones like
tinyllama) are less capable than GPT-4. The system compensates with
structured prompts, explicit output format instructions, and deterministic
fallbacks when LLM output quality is insufficient.

---

## 6. Why RAG Instead of Fine-Tuning for the Chatbot?

**Fine-tuning** would require:
- A large labelled question-answer dataset about bus policies
- GPU compute for training
- Retraining every time a policy changes
- Risk of the model "forgetting" general reasoning ability

**RAG** requires:
- Plain text knowledge files (editable by anyone)
- One-time FAISS index build (under 30 seconds)
- No retraining — update knowledge by editing a .txt file
- Retrieval confidence as a natural hallucination control

When I update `cancellation_policy.txt`, I run `rebuild_index()` and the
chatbot immediately reflects the new information. Fine-tuning would require
a full retraining cycle.

**The hallucination control mechanism:**
Every chatbot response is conditioned strictly on retrieved chunks. The prompt
explicitly instructs the model: "If the answer is not in the context, say
I don't have that information." This is retrieval-grounded generation —
the model cannot answer from prior training alone.

---

## 7. Why FAISS for Vector Storage?

Alternatives considered: ChromaDB, Pinecone, Weaviate.

**Pinecone / Weaviate** are cloud-hosted — eliminated immediately for
offline operation requirements.

**ChromaDB** is excellent for development but adds a server process dependency.

**FAISS** runs as a pure Python library, stores indices as local files,
requires no server, and handles similarity search for small-to-medium knowledge
bases (under 100k chunks) with sub-millisecond latency. For a knowledge base
of 4 documents (~18 chunks), FAISS is the correct tool — no overhead, no
external dependency, fully offline.

---

## 8. Why RandomForest for Price Prediction?

Alternatives considered: Linear Regression, XGBoost, Neural Network.

**Linear Regression** cannot capture non-linear feature interactions. The
relationship between day-of-week and price is not linear — Friday is expensive
not because it is "day 4" but because of demand patterns. Linear regression
would miss this entirely.

**XGBoost** would perform marginally better but adds complexity and a heavier
dependency. For a dataset of ~1000 synthetic samples, XGBoost provides no
meaningful accuracy advantage over RandomForest.

**Neural Network** is heavily overengineered for this feature set (7 input
dimensions). It would also require more training data and GPU compute to
outperform tree-based methods on tabular data — where RandomForest consistently
performs well with minimal tuning.

**RandomForest** handles feature interactions natively, is interpretable via
feature importance scores, trains in under 5 seconds on CPU, and achieves
MAE ₹37 on this dataset — acceptable for a price trend indicator.

---

## 9. Why Synthetic Training Data?

The system had no historical pricing data — only current schedules.

Rather than abandoning the ML layer, I generated synthetic training data
by applying known pricing patterns to real schedule data:

- Day-of-week multipliers (Friday +20%, Monday -10%)
- Month multipliers (November Diwali peak +25%, February off-season -12%)
- Last-minute surge (<3 days +20%, <1 day +35%)
- Low availability surge (<20% seats +15%)
- Random noise (±5%) to prevent overfitting to exact multipliers

This is standard practice in ML systems where ground truth data does not yet
exist. The model learns the pattern structure, not exact values. As real
booking data accumulates, the model can be retrained on actual observations.

---

## 10. Why Deterministic Fallbacks Throughout?

Every AI component has a fallback:

| Component | Failure scenario | Fallback |
|-----------|-----------------|----------|
| Ollama LLM | Model offline / OOM | Score-based sentence generated in Python |
| RAG chatbot | FAISS index missing | Error message with rebuild instruction |
| Price predictor | Model .pkl missing | Endpoint returns clear error, UI hides widget |
| Scoring engine | Single bus in results | Neutral 0.5 scores, confidence penalized |

**The principle:** AI components should degrade gracefully, not crash the
system. A user who cannot get an AI-generated reason should still see the
ranked result. A user who cannot get a price prediction should still be able
to book. The AI layer enhances the core system — it does not replace it.

This fallback-first design is especially important in scientific instrumentation
systems where a researcher mid-experiment cannot afford a system crash because
an LLM ran out of memory.

---

## 11. Applying These Decisions to Scientific Instrumentation

The architectural patterns in BusGo map directly to the I-STEM use case:

| BusGo | I-STEM equivalent |
|-------|------------------|
| Bus scoring across 5 dimensions | Instrument ranking across resolution, cost, throughput, compatibility |
| Preference modes (cheap/fast/comfort) | Research modes (high-resolution / high-throughput / cost-constrained) |
| Confidence scoring | Instrument recommendation confidence with retrieval coverage penalty |
| RAG over policy documents | RAG over instrument SOPs, calibration manuals, domain ontologies |
| LLM reasoning per result | Scientific reasoning explanation per instrument recommendation |
| Deterministic fallbacks | Validation logic ensuring parameter outputs are within safe ranges |
| Offline Ollama deployment | Secure offline lab LLM deployment via quantized models |

The domain changes. The architecture does not.

---

*This document was written to demonstrate system-level thinking, not just
implementation. Every decision above was made consciously during development
and reflects the same reasoning required to build reliable AI systems for
high-stakes scientific environments.*
