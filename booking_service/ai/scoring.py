# booking_service/ai/scoring.py

from dataclasses import dataclass
from typing import List
from datetime import datetime

# ─── Weight profiles — now includes rating ───────────────────────────────────
WEIGHT_PROFILES = {
    "cheap":    {"price": 0.50, "time": 0.15, "comfort": 0.10, "seats": 0.10, "rating": 0.15},
    "fast":     {"price": 0.10, "time": 0.55, "comfort": 0.10, "seats": 0.10, "rating": 0.15},
    "comfort":  {"price": 0.10, "time": 0.10, "comfort": 0.45, "seats": 0.10, "rating": 0.25},
    "balanced": {"price": 0.20, "time": 0.25, "comfort": 0.25, "seats": 0.10, "rating": 0.20},
}

COMFORT_TIER = {
    "AC Sleeper":     1.0,
    "Volvo":          0.9,
    "AC Seater":      0.7,
    "Non-AC Sleeper": 0.5,
    "Non-AC Seater":  0.3,
}

@dataclass
class BusScore:
    bus_id:        int
    price_score:   float
    time_score:    float
    comfort_score: float
    seat_score:    float
    rating_score:  float
    total_score:   float
    confidence:    float
    reason:        str = ""


def _minmax(values: List[float], invert=False) -> List[float]:
    lo, hi = min(values), max(values)
    if hi == lo:
        return [0.5] * len(values)
    normalized = [(v - lo) / (hi - lo) for v in values]
    return [1 - n for n in normalized] if invert else normalized


def _travel_minutes(bus: dict) -> int:
    try:
        dep = datetime.strptime(str(bus["departure_time"]), "%H:%M:%S")
        arr = datetime.strptime(str(bus["arrival_time"]),   "%H:%M:%S")
    except ValueError:
        dep = datetime.strptime(str(bus["departure_time"]), "%H:%M")
        arr = datetime.strptime(str(bus["arrival_time"]),   "%H:%M")
    diff = int((arr - dep).total_seconds() / 60)
    return diff if diff > 0 else diff + 1440


def _confidence(ps, ts, cs, ss, rs, bus: dict) -> float:
    base = 0.85
    if bus.get("available_seats") is None: base -= 0.15
    if bus.get("bus_type") not in COMFORT_TIER: base -= 0.10
    if float(bus.get("rating", 0)) == 0.0: base -= 0.05
    spread = max(ps, ts, cs, ss, rs) - min(ps, ts, cs, ss, rs)
    if spread < 0.15: base -= 0.10
    return round(max(0.30, min(1.0, base)), 2)


def score_buses(buses: List[dict], preference: str) -> List[BusScore]:
    weights = WEIGHT_PROFILES.get(preference, WEIGHT_PROFILES["balanced"])

    prices    = [float(b["fare"])                              for b in buses]
    durations = [_travel_minutes(b)                            for b in buses]
    comforts  = [COMFORT_TIER.get(b.get("bus_type"), 0.3)     for b in buses]
    seats     = [min(int(b.get("available_seats") or 0)/40, 1.0) for b in buses]
    ratings   = [float(b.get("rating", 0.0)) / 5.0            for b in buses]

    p_scores = _minmax(prices,    invert=True)
    t_scores = _minmax(durations, invert=True)
    c_scores = comforts
    s_scores = _minmax(seats)
    r_scores = _minmax(ratings)

    results = []
    for i, bus in enumerate(buses):
        total = (
            weights["price"]   * p_scores[i] +
            weights["time"]    * t_scores[i] +
            weights["comfort"] * c_scores[i] +
            weights["seats"]   * s_scores[i] +
            weights["rating"]  * r_scores[i]
        )
        conf = _confidence(
            p_scores[i], t_scores[i], c_scores[i],
            s_scores[i], r_scores[i], bus
        )
        results.append(BusScore(
            bus_id        = bus["id"],
            price_score   = round(p_scores[i], 3),
            time_score    = round(t_scores[i], 3),
            comfort_score = round(c_scores[i], 3),
            seat_score    = round(s_scores[i], 3),
            rating_score  = round(r_scores[i], 3),
            total_score   = round(total,        3),
            confidence    = conf,
        ))

    return sorted(results, key=lambda x: x.total_score, reverse=True)