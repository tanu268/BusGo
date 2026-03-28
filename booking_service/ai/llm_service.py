# booking_service/ai/llm_service.py

import httpx
import asyncio
from typing import List

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL      = "llama3"

# ─── New detailed bullet-point prompt ────────────────────────────────────────
REASON_PROMPT = """
You are an expert bus booking assistant helping a traveller choose the best bus.

The traveller's priority is: {preference}

Bus details:
- Operator: {operator}
- Bus type: {bus_type}
- Fare: ₹{fare}
- Travel duration: {duration} minutes
- Available seats: {seats}
- Operator rating: {rating}/5.0
- Price score (0-1, higher = cheaper relative to others): {price_score}
- Speed score (0-1, higher = faster relative to others): {time_score}
- Comfort score (0-1, higher = more comfortable): {comfort_score}
- Rating score (0-1, higher = better rated): {rating_score}
- Overall score: {total_score}

Write EXACTLY 3 bullet points explaining this bus recommendation.
Each bullet must start with one of these bold labels:
- **Price:** explain value for money in one sentence
- **Time:** explain journey duration in one sentence  
- **Comfort & Rating:** explain bus quality and rating in one sentence

Rules:
- Be specific, mention actual numbers (fare, duration, rating)
- Compare to other options naturally (e.g. "one of the cheaper options")
- Do NOT add any intro or closing sentence
- Reply with ONLY the 3 bullet points, nothing else
""".strip()


async def generate_reason(bus: dict, score, preference: str) -> str:
    # Calculate readable duration
    try:
        from datetime import datetime
        dep = datetime.strptime(str(bus["departure_time"]), "%H:%M:%S")
        arr = datetime.strptime(str(bus["arrival_time"]),   "%H:%M:%S")
        diff = int((arr - dep).total_seconds() / 60)
        duration = diff if diff > 0 else diff + 1440
    except Exception:
        duration = "?"

    prompt = REASON_PROMPT.format(
        preference   = preference,
        operator     = bus.get("operator_name", "Unknown"),
        bus_type     = bus.get("bus_type",      "Standard"),
        fare         = bus.get("fare",          "?"),
        duration     = duration,
        seats        = bus.get("available_seats","?"),
        rating       = bus.get("rating",         0.0),
        price_score  = score.price_score,
        time_score   = score.time_score,
        comfort_score= score.comfort_score,
        rating_score = score.rating_score,
        total_score  = score.total_score,
    )

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(OLLAMA_URL, json={
                "model":  MODEL,
                "prompt": prompt,
                "stream": False,
            })
            result = response.json().get("response", "").strip()
            if not result:
                return _fallback_reason(score, preference, bus)
            return result

    except Exception:
        return _fallback_reason(score, preference, bus)


def _fallback_reason(score, preference: str, bus: dict) -> str:
    """Bullet-point fallback when Ollama is unreachable."""
    fare    = bus.get("fare", "?")
    rating  = bus.get("rating", 0.0)
    bus_type= bus.get("bus_type", "Standard")

    price_line   = f"• **Price:** Fare of ₹{fare} gives a price score of {score.price_score:.0%} relative to other options."
    time_line    = f"• **Time:** Journey speed scores {score.time_score:.0%} — {'one of the faster options' if score.time_score > 0.6 else 'moderate travel time'}."
    comfort_line = f"• **Comfort & Rating:** {bus_type} with a {rating}/5.0 operator rating, comfort score {score.comfort_score:.0%}."

    return f"{price_line}\n{time_line}\n{comfort_line}"


async def generate_reasons_batch(
    buses: List[dict],
    scores: list,
    preference: str,
) -> dict:
    bus_map = {b["id"]: b for b in buses}
    tasks   = [
        generate_reason(bus_map[s.bus_id], s, preference)
        for s in scores
    ]
    reasons = await asyncio.gather(*tasks)
    return {scores[i].bus_id: reasons[i] for i in range(len(scores))}