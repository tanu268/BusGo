import { useState, useEffect } from "react";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Seatmap from "./Seatmap";
import { createBooking, getCookie } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

// This matches exactly what BusCard's toSchedule() produces.
// No more relying on the imported Schedule type from api.ts.
interface BusSchedule {
  id:        number;
  operator:  string;
  departure: string;
  arrival:   string;
  seats:     number; // available seats shown in the card
  bus: {
    total_seats: number;
  };
}

interface BookingModalProps {
  schedule: BusSchedule;
  onClose:  () => void;
  onBooked?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BookingModal({ schedule, onClose, onBooked }: BookingModalProps) {
  const API_BASE_URL = "http://localhost:8000";

  const [name,        setName]        = useState("");
  const [seat,        setSeat]        = useState<number | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState<string | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [bookedSeats, setBookedSeats] = useState<number[]>([]);

  const navigate = useNavigate();

  // Fetch already-booked seats for this schedule
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/booked-seats/${schedule.id}/`)
      .then(res => res.json())
      .then(data => setBookedSeats(data.booked_seats ?? []))
      .catch(err => console.error("Failed to load booked seats:", err));
  }, [schedule.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || seat === null) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const csrfToken = getCookie("csrftoken");

      // 1. Create Razorpay payment order
      const res = await fetch(`${API_BASE_URL}/api/create-payment/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({ amount: 850 }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const order = await res.json();

      // 2. Open Razorpay checkout
      const options = {
        key:         "rzp_test_SNF5yHYJl6KGco",
        amount:      order.amount,
        currency:    "INR",
        name:        "Bus Booking System",
        description: "Seat Booking",
        order_id:    order.order_id,

        handler: async function () {
          try {
            // 3. Confirm booking in backend after successful payment
            await createBooking({
              schedule_id:      schedule.id,
              passenger_name:   name.trim(),
              seat_number:      seat!,
            });

            setSuccess("Booking confirmed!");

            // 4. Refresh booked seats
            const seatsRes = await fetch(
              `${API_BASE_URL}/api/booked-seats/${schedule.id}/`
            );
            const seatsData = await seatsRes.json();
            setBookedSeats(seatsData.booked_seats ?? []);

            if (onBooked) onBooked();

            navigate("/bookings");
          } catch (bookingErr) {
            console.error("Booking failed after payment:", bookingErr);
            setError("Payment succeeded but booking failed. Please contact support.");
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg mx-4 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-card-foreground">Book Your Seat</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Bus info summary */}
        <div className="mb-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
          <p className="font-medium text-card-foreground">
            {schedule.operator}
          </p>
          <p>
            {schedule.departure.slice(0, 5)} → {schedule.arrival.slice(0, 5)}
          </p>
          <p>
            Available seats: {schedule.seats}
          </p>
        </div>

        {/* Success state */}
        {success ? (
          <div className="flex items-center gap-2 rounded-md bg-success/10 p-3 text-sm text-success">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {success}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Passenger name */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">
                Passenger Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter your full name"
              />
            </div>

            {/* Seat selection */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">
                Seat Number
              </label>
              <Seatmap
                totalSeats={schedule.bus.total_seats}
                bookedSeats={bookedSeats}
                onSelect={(selectedSeat) => setSeat(selectedSeat)}
              />
              {seat !== null && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected seat: <strong>{seat}</strong>
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Processing..." : "Confirm Booking"}
            </button>

          </form>
        )}
      </div>
    </div>
  );
}
