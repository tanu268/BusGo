// frontend/src/components/BusCard.tsx

import React, { useState } from "react";
import { BookingModal } from "./BookingModal";

// ─── Type definitions ─────────────────────────────────────────────────────────
interface BusScores {
  total:   number;
  price:   number;
  time:    number;
  comfort: number;
  seats:   number;
  rating:  number;
}

interface BusResult {
  rank:         number;
  bus_id:       number;
  operator:     string;
  bus_number:   string;
  departure:    string;
  arrival:      string;
  fare:         string;
  bus_type:     string;
  seats:        number;
  total_seats?: number;
  scores:       BusScores;
  confidence:   number;
  reason:       string;
}

interface BusCardProps {
  bus:        BusResult;
  travelDate?: string; // "YYYY-MM-DD"
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

// Parse "HH:MM" or "HH:MM:SS" → total minutes
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Format "YYYY-MM-DD" → "Mon, 28 Mar"
function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

// Add N days to a "YYYY-MM-DD" string
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

// Given travelDate + departure/arrival time strings, return:
//   { depDate, arrDate, isOvernight }
function resolveDates(travelDate: string, departure: string, arrival: string) {
  const depMins = timeToMinutes(departure);
  const arrMins = timeToMinutes(arrival);
  const isOvernight = arrMins <= depMins; // arrival is same time or earlier → next day
  const depDate = travelDate;
  const arrDate = isOvernight ? addDays(travelDate, 1) : travelDate;
  return { depDate, arrDate, isOvernight };
}

// ─── Helper: transform BusResult → Schedule shape BookingModal expects ────────
const toSchedule = (bus: BusResult) => ({
  id:        bus.bus_id,
  operator:  bus.operator,
  departure: bus.departure,
  arrival:   bus.arrival,
  seats:     bus.seats,
  bus: {
    total_seats: bus.total_seats ?? 40,
  },
});

// ─── Score bar component ──────────────────────────────────────────────────────
const ScoreBar = ({ label, value }: { label: string; value: number }) => {
  const percent = Math.round(value * 100);
  const color =
    percent >= 75 ? "#16a34a" :
    percent >= 45 ? "#d97706" : "#dc2626";

  return (
    <div style={{ marginBottom: "6px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: "12px",
        marginBottom: "3px",
        color: "#6b7280",
      }}>
        <span>{label}</span>
        <span style={{ fontWeight: 500, color }}>{percent}%</span>
      </div>
      <div style={{
        width: "100%",
        height: "6px",
        backgroundColor: "#e5e7eb",
        borderRadius: "999px",
        overflow: "hidden",
      }}>
        <div style={{
          width: `${percent}%`,
          height: "100%",
          backgroundColor: color,
          borderRadius: "999px",
          transition: "width 0.4s ease",
        }}/>
      </div>
    </div>
  );
};

// ─── Confidence badge ─────────────────────────────────────────────────────────
const ConfidenceBadge = ({ value }: { value: number }) => {
  const percent = Math.round(value * 100);
  const bg    = percent >= 75 ? "#dcfce7" : percent >= 50 ? "#fef9c3" : "#fee2e2";
  const color = percent >= 75 ? "#15803d" : percent >= 50 ? "#92400e" : "#b91c1c";
  const label = percent >= 75 ? "High confidence" :
                percent >= 50 ? "Medium confidence" : "Low confidence";

  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: "999px",
      fontSize: "11px",
      fontWeight: 500,
      backgroundColor: bg,
      color,
    }}>
      {label} · {percent}%
    </span>
  );
};

// ─── Main BusCard component ───────────────────────────────────────────────────
const BusCard: React.FC<BusCardProps> = ({ bus, travelDate }) => {
  const [open, setOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const baseDate = travelDate || today;

  const depTime = bus.departure.slice(0, 5); // "HH:MM"
  const arrTime = bus.arrival.slice(0, 5);   // "HH:MM"

  const { depDate, arrDate, isOvernight } = resolveDates(baseDate, depTime, arrTime);

  return (
    <div style={{
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
      padding: "20px",
      marginBottom: "16px",
      backgroundColor: "#ffffff",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      position: "relative",
    }}>

      {/* Rank badge */}
      <div style={{
        position: "absolute",
        top: "16px",
        right: "16px",
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        backgroundColor: bus.rank === 1 ? "#7c3aed" : "#6b7280",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "13px",
        fontWeight: 600,
      }}>
        #{bus.rank}
      </div>

      {/* Header row */}
      <div style={{ marginBottom: "12px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
          {bus.operator}
        </h3>
        <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#6b7280" }}>
          {bus.bus_number} · {bus.bus_type}
        </p>
      </div>

      {/* Time + fare row */}
      <div style={{
        display: "flex",
        gap: "24px",
        marginBottom: "14px",
        flexWrap: "wrap",
        alignItems: "flex-start",
      }}>
        {/* Departure */}
        <div>
          <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>Departure</p>
          <p style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>{depTime}</p>
          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#6b7280" }}>
            {formatShortDate(depDate)}
          </p>
        </div>

        <div style={{ fontSize: "20px", color: "#d1d5db", alignSelf: "center" }}>→</div>

        {/* Arrival */}
        <div>
          <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>Arrival</p>
          <p style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>
            {arrTime}
            {/* Overnight indicator */}
            {isOvernight && (
              <span style={{
                marginLeft: "5px",
                fontSize: "10px",
                fontWeight: 600,
                color: "#7c3aed",
                background: "#f3e8ff",
                padding: "1px 6px",
                borderRadius: "999px",
                verticalAlign: "middle",
              }}>
                +1
              </span>
            )}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "11px", color: isOvernight ? "#7c3aed" : "#6b7280" }}>
            {formatShortDate(arrDate)}
          </p>
        </div>

        {/* Fare */}
        <div style={{ marginLeft: "auto" }}>
          <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>Fare</p>
          <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#7c3aed" }}>
            ₹{parseFloat(bus.fare).toFixed(0)}
          </p>
        </div>

        {/* Seats */}
        <div>
          <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>Seats left</p>
          <p style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>
            {bus.seats}
          </p>
        </div>
      </div>

      {/* Score bars */}
      <div style={{
        backgroundColor: "#f9fafb",
        borderRadius: "8px",
        padding: "12px",
        marginBottom: "12px",
      }}>
        <p style={{
          margin: "0 0 8px",
          fontSize: "11px",
          fontWeight: 600,
          color: "#9ca3af",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          AI score breakdown
        </p>
        <ScoreBar label="Price"   value={bus.scores.price}      />
        <ScoreBar label="Speed"   value={bus.scores.time}       />
        <ScoreBar label="Comfort" value={bus.scores.comfort}    />
        <ScoreBar label="Seats"   value={bus.scores.seats}      />
        <ScoreBar label="Rating"  value={bus.scores.rating ?? 0}/>
      </div>

      {/* Bullet-point reasons */}
      {bus.reason && (
        <div style={{
          backgroundColor: "#fafafa",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "12px 14px",
          marginBottom: "12px",
        }}>
          <p style={{
            margin: "0 0 8px",
            fontSize: "11px",
            fontWeight: 600,
            color: "#9ca3af",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            AI reasoning
          </p>
          {bus.reason.split("\n").map((line, i) => {
            const formatted = line.replace(
              /\*\*(.+?)\*\*/g,
              (_, text) => `<strong>${text}</strong>`
            );
            return (
              <p
                key={i}
                style={{ margin: "4px 0", fontSize: "13px", color: "#374151" }}
                dangerouslySetInnerHTML={{ __html: formatted }}
              />
            );
          })}
        </div>
      )}

      {/* Bottom row: Confidence + Book button */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "10px",
      }}>
        <ConfidenceBadge value={bus.confidence} />

        <button
          onClick={() => setOpen(true)}
          disabled={bus.seats === 0}
          style={{
            backgroundColor: bus.seats === 0 ? "#9ca3af" : "#7c3aed",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            cursor: bus.seats === 0 ? "not-allowed" : "pointer",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          {bus.seats === 0 ? "Sold Out" : "Book Now →"}
        </button>
      </div>

      {/* Booking Modal */}
      {open && (
        <BookingModal
          schedule={toSchedule(bus)}
          onClose={() => setOpen(false)}
        />
      )}

    </div>
  );
};

export default BusCard;
