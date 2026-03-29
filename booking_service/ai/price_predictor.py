# booking_service/ai/price_predictor.py

import numpy as np
import pickle
from pathlib import Path
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "price_model.pkl"

# ─── Price multipliers (real-world pricing patterns) ─────────────────────────
DAY_MULTIPLIERS = {
    0: 0.90,  # Monday    — cheapest
    1: 0.92,  # Tuesday
    2: 0.93,  # Wednesday
    3: 0.95,  # Thursday
    4: 1.15,  # Friday    — expensive
    5: 1.20,  # Saturday  — most expensive
    6: 1.10,  # Sunday
}

MONTH_MULTIPLIERS = {
    1:  0.90,  # January   — off season
    2:  0.88,  # February  — cheapest
    3:  0.92,  # March
    4:  1.10,  # April     — summer starts
    5:  1.20,  # May       — peak summer
    6:  1.15,  # June
    7:  1.05,  # July
    8:  1.00,  # August
    9:  0.95,  # September
    10: 1.05,  # October   — festive season
    11: 1.25,  # November  — Diwali peak
    12: 1.10,  # December  — holidays
}

BUS_TYPE_MULTIPLIERS = {
    "AC Sleeper":     1.4,
    "Volvo":          1.3,
    "AC Seater":      1.1,
    "Non-AC Sleeper": 0.9,
    "Non-AC Seater":  0.7,
}


# ─── Generate synthetic training data ────────────────────────────────────────
def _generate_training_data(schedules: list) -> tuple:
    """
    Creates 200 synthetic price samples per schedule
    by varying: day of week, month, days to departure, seats remaining.
    Returns X (features) and y (prices).
    """
    X, y = [], []

    for schedule in schedules:
        base_price   = float(schedule["price"])
        bus_type     = schedule.get("bus_type", "AC Seater")
        type_mult    = BUS_TYPE_MULTIPLIERS.get(bus_type, 1.0)
        total_seats  = max(int(schedule.get("total_seats", 40)), 1)

        # Generate 200 samples per schedule
        for _ in range(200):
            day_of_week      = np.random.randint(0, 7)
            month            = np.random.randint(1, 13)
            days_to_departure= np.random.randint(0, 60)
            seats_remaining  = np.random.randint(0, total_seats + 1)
            seats_pct        = seats_remaining / total_seats  # 0.0 to 1.0

            # Calculate realistic price with all multipliers
            day_mult   = DAY_MULTIPLIERS[day_of_week]
            month_mult = MONTH_MULTIPLIERS[month]

            # Last minute surge: <3 days = +20%, <1 day = +35%
            if days_to_departure <= 1:
                urgency_mult = 1.35
            elif days_to_departure <= 3:
                urgency_mult = 1.20
            elif days_to_departure <= 7:
                urgency_mult = 1.10
            else:
                urgency_mult = 1.00

            # Low seats surge: <20% seats left = +15%
            if seats_pct < 0.20:
                seats_mult = 1.15
            elif seats_pct < 0.40:
                seats_mult = 1.05
            else:
                seats_mult = 1.00

            # Final price with small random noise (+/- 5%)
            noise = np.random.uniform(0.95, 1.05)
            price = (
                base_price *
                type_mult  *
                day_mult   *
                month_mult *
                urgency_mult *
                seats_mult *
                noise
            )

            X.append([
                day_of_week,
                month,
                days_to_departure,
                seats_remaining,
                seats_pct,
                base_price,
                type_mult,
            ])
            y.append(round(price, 2))

    return np.array(X), np.array(y)


# ─── Train and save model ─────────────────────────────────────────────────────
def train_model():
    """
    Call this from Django shell to train and save the model.
    Fetches your real schedules from MySQL as training base.
    """
    from bookings.models import Schedule

    print("[ML] Fetching schedules from database...")
    schedules = list(Schedule.objects.select_related("bus").values(
        "price",
        "available_seats",
        "bus__bus_type",
        "bus__total_seats",
    ))

    # Rename keys for clarity
    cleaned = [{
        "price":       s["price"],
        "bus_type":    s["bus__bus_type"],
        "total_seats": s["bus__total_seats"],
    } for s in schedules]

    if not cleaned:
        print("[ML] No schedules found. Add some schedules first.")
        return

    print(f"[ML] Generating training data from {len(cleaned)} schedules...")
    X, y = _generate_training_data(cleaned)
    print(f"[ML] Generated {len(X)} training samples.")

    # Train / test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Train RandomForest
    print("[ML] Training RandomForestRegressor...")
    model = RandomForestRegressor(
        n_estimators = 100,
        max_depth    = 10,
        random_state = 42,
        n_jobs       = -1,   # use all CPU cores
    )
    model.fit(X_train, y_train)

    # Evaluate
    preds = model.predict(X_test)
    mae   = mean_absolute_error(y_test, preds)
    print(f"[ML] Training complete. MAE: ₹{mae:.2f}")

    # Save model
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    print(f"[ML] Model saved to {MODEL_PATH}")


# ─── PricePredictorService ────────────────────────────────────────────────────
class PricePredictorService:
    _model = None

    @classmethod
    def _load_model(cls):
        if cls._model is None:
            if not MODEL_PATH.exists():
                raise FileNotFoundError(
                    "Model not trained yet. Run train_model() first."
                )
            with open(MODEL_PATH, "rb") as f:
                cls._model = pickle.load(f)
        return cls._model

    @classmethod
    def predict(cls, schedule: dict, days_to_departure: int = 7) -> dict:
        """
        Predict price for a schedule.
        Returns predicted price, trend, and urgency level.
        """
        model      = cls._load_model()
        base_price = float(schedule.get("fare", 500))
        bus_type   = schedule.get("bus_type", "AC Seater")
        type_mult  = BUS_TYPE_MULTIPLIERS.get(bus_type, 1.0)
        seats      = int(schedule.get("available_seats", 20))
        total      = 40
        seats_pct  = min(seats / total, 1.0)

        today      = datetime.now()
        day_of_week= today.weekday()
        month      = today.month

        features = np.array([[
            day_of_week,
            month,
            days_to_departure,
            seats,
            seats_pct,
            base_price,
            type_mult,
        ]])

        predicted = round(float(model.predict(features)[0]), 2)

        # Compare predicted vs current to get trend
        diff_pct = (predicted - base_price) / base_price * 100

        if diff_pct > 8:
            trend   = "rising"
            urgency = "high"
        elif diff_pct > 3:
            trend   = "rising"
            urgency = "medium"
        elif diff_pct < -5:
            trend   = "falling"
            urgency = "low"
        else:
            trend   = "stable"
            urgency = "low"

        return {
            "current_price":   base_price,
            "predicted_price": predicted,
            "trend":           trend,
            "urgency":         urgency,
            "diff_pct":        round(diff_pct, 1),
            "days_to_departure": days_to_departure,
        }