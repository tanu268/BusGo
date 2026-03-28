import json
from groq import Groq
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

client = Groq(api_key=settings.GROQ_API_KEY)

ADMIN_SYSTEM_PROMPT = """
You are BusGo Admin AI.
RULES:
- NEVER greet or introduce yourself
- NEVER say Hello, Hi, or How can I help
- Answer the question DIRECTLY in 2-3 sentences
- Be specific and actionable
- If you don't have real data, give general admin advice
"""

USER_SYSTEM_PROMPT = """
You are BusGo Assistant, a friendly chatbot for bus booking users.
RULES:
- NEVER greet or introduce yourself repeatedly
- Answer DIRECTLY in 2-3 sentences
- Be warm, friendly and helpful

You help users with:
- Searching buses: Go to Search page, enter source and destination
- Booking: Click on a bus, select a seat, proceed to payment
- Cancellation: Go to My Bookings, click Cancel on the booking
- Payment: We accept UPI, cards, and net banking via Razorpay
- Seat selection: Available seats shown in green, booked in red
- General questions about the BusGo platform
"""

@csrf_exempt
def chatbot(request):
    if request.method == "POST":
        body = json.loads(request.body)
        user_message = body.get("message")
        # ✅ Frontend sends is_admin flag to pick correct prompt
        is_admin = body.get("is_admin", False)

        system_prompt = ADMIN_SYSTEM_PROMPT if is_admin else USER_SYSTEM_PROMPT

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ]
        )

        reply = response.choices[0].message.content
        return JsonResponse({"reply": reply})

    return JsonResponse({"error": "Invalid request"}, status=405)


# ─── ADD THIS AT THE BOTTOM OF booking_service/ai/views.py ───────────────────

from django.views import View
from django.http  import JsonResponse
from .scoring     import score_buses
from .llm_service import generate_reasons_batch

import json
import asyncio

@method_decorator(csrf_exempt, name="dispatch")
class RecommendView(View):

    def post(self, request):
        # ── Step 1: Read the request body ────────────────────────────────────
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON body"}, status=400)

        source      = body.get("source")
        destination = body.get("destination")
        preference  = body.get("preference", "balanced")

        # ── Step 2: Basic validation ──────────────────────────────────────────
        if not source or not destination:
            return JsonResponse(
                {"error": "source and destination are required"},
                status=400
            )

        if preference not in ("cheap", "fast", "comfort", "balanced"):
            return JsonResponse(
                {"error": "preference must be cheap, fast, comfort, or balanced"},
                status=400
            )


        # ── Step 3: Fetch schedules joined with Bus and Route ─────────────────
        try:
            from bookings.models import Schedule

            schedules_queryset = Schedule.objects.filter(
                route__source      = source,
                route__destination = destination,
                available_seats__gt = 0,         # only buses with seats left
            ).select_related("bus", "route")     # joins all 3 tables in one query

            # Flatten into a list of plain dicts for the scoring engine
            buses = []
            for s in schedules_queryset:
                buses.append({
                    "id":               s.id,
                    "fare":             s.price,
                    "departure_time":   s.departure_time.strftime("%H:%M:%S"),
                    "arrival_time":     s.arrival_time.strftime("%H:%M:%S"),
                    "bus_type":         s.bus.bus_type,
                    "available_seats":  s.available_seats,
                    "operator_name":    s.bus.operator_name,
                    "bus_number":       s.bus.bus_number,
                    "rating":           s.bus.rating,
                    "source":           s.route.source,
                    "destination":      s.route.destination,
                    "rating":           s.bus.rating,
                })

        except Exception as e:
            return JsonResponse(
                {"error": f"Database error: {str(e)}"},
                status=500
            )

        # ── Step 4: Handle no results ─────────────────────────────────────────
        if not buses:
            return JsonResponse({
                "preference": preference,
                "results":    [],
                "meta":       {"total": 0},
            })

        # ── Step 5: Score all buses ───────────────────────────────────────────
        try:
            scores = score_buses(buses, preference)
        except Exception as e:
            return JsonResponse(
                {"error": f"Scoring error: {str(e)}"},
                status=500
            )

        # ── Step 6: Generate reasons from llama3 (runs concurrently) ─────────
        try:
            reasons = asyncio.run(
                generate_reasons_batch(buses, scores, preference)
            )
        except Exception:
            # If Ollama fails completely, use empty reasons — don't crash
            reasons = {s.bus_id: "" for s in scores}

        # ── Step 7: Build the final ranked response ───────────────────────────
        bus_map = {b["id"]: b for b in buses}
        results = []

        for rank, s in enumerate(scores, start=1):
            bus = bus_map[s.bus_id]

            results.append({
                "rank":          rank,
                "bus_id":        s.bus_id,
                "operator":      bus.get("operator_name", ""),
                "bus_number":    bus.get("bus_number", ""),
                "departure":     str(bus["departure_time"]),
                "arrival":       str(bus["arrival_time"]),
                "fare":          str(bus["fare"]),
                "bus_type":      bus.get("bus_type", ""),
                "seats":         bus.get("available_seats", 0),
                "scores": {
                        "total":   s.total_score,
                        "price":   s.price_score,
                        "time":    s.time_score,
                        "comfort": s.comfort_score,
                        "seats":   s.seat_score,
                        "rating":  s.rating_score,
                    },
                "confidence": s.confidence,
                "reason":     reasons.get(s.bus_id, ""),
            })

        return JsonResponse({
            "preference": preference,
            "results":    results,
            "meta":       {"total": len(results)},
        })