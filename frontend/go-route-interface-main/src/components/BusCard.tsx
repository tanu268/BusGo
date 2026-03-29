// frontend/src/components/BusCard.tsx

import React, { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BusScores {
  total:   number;
  price:   number;
  time:    number;
  comfort: number;
  seats:   number;
  rating:  number;
}

interface PricePrediction {
  current_price:    number;
  predicted_price:  number;
  trend:            "rising" | "falling" | "stable";
  urgency:          "high" | "medium" | "low";
  diff_pct:         number;
  days_to_departure:number;
}

interface BusResult {
  rank:       number;
  bus_id:     number;
  operator:   string;
  bus_number: string;
  departure:  string;
  arrival:    string;
  fare:       string;
  bus_type:   string;
  seats:      number;
  scores:     BusScores;
  confidence: number;
  reason:     string;
}

interface BusCardProps {
  bus: BusResult;
}

// ─── Score bar ────────────────────────────────────────────────────────────────
const ScoreBar = ({ label, value }: { label: string; value: number }) => {
  const percent = Math.round(value * 100);
  const color =
    percent >= 75 ? "#16a34a" :
    percent >= 45 ? "#d97706" : "#dc2626";
  return (
    <div style={{ marginBottom: "6px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", marginBottom:"3px", color:"#6b7280" }}>
        <span>{label}</span>
        <span style={{ fontWeight:500, color }}>{percent}%</span>
      </div>
      <div style={{ width:"100%", height:"6px", backgroundColor:"#e5e7eb", borderRadius:"999px", overflow:"hidden" }}>
        <div style={{ width:`${percent}%`, height:"100%", backgroundColor:color, borderRadius:"999px", transition:"width 0.4s ease" }}/>
      </div>
    </div>
  );
};

// ─── Confidence badge ─────────────────────────────────────────────────────────
const ConfidenceBadge = ({ value }: { value: number }) => {
  const percent = Math.round(value * 100);
  const bg    = percent >= 75 ? "#dcfce7" : percent >= 50 ? "#fef9c3" : "#fee2e2";
  const color = percent >= 75 ? "#15803d" : percent >= 50 ? "#92400e" : "#b91c1c";
  const label = percent >= 75 ? "High confidence" : percent >= 50 ? "Medium confidence" : "Low confidence";
  return (
    <span style={{ display:"inline-block", padding:"2px 10px", borderRadius:"999px", fontSize:"11px", fontWeight:500, backgroundColor:bg, color }}>
      {label} · {percent}%
    </span>
  );
};

// ─── Price trend badge ────────────────────────────────────────────────────────
const TrendBadge = ({ prediction }: { prediction: PricePrediction }) => {
  const arrow  = prediction.trend === "rising" ? "↑" : prediction.trend === "falling" ? "↓" : "→";
  const bg     = prediction.trend === "rising"  ? "#fef3c7" : prediction.trend === "falling" ? "#dcfce7" : "#f3f4f6";
  const color  = prediction.trend === "rising"  ? "#92400e" : prediction.trend === "falling" ? "#15803d" : "#6b7280";
  const pct    = Math.abs(prediction.diff_pct).toFixed(0);

  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"4px", padding:"2px 10px", borderRadius:"999px", fontSize:"11px", fontWeight:500, backgroundColor:bg, color }}>
      {arrow} {prediction.trend} · {pct}%
    </span>
  );
};

// ─── Urgency warning banner ───────────────────────────────────────────────────
const UrgencyBanner = ({ prediction }: { prediction: PricePrediction }) => {
  if (prediction.urgency === "low") return null;

  const isHigh  = prediction.urgency === "high";
  const bg      = isHigh ? "#fef3c7" : "#fff7ed";
  const border  = isHigh ? "#fbbf24" : "#fdba74";
  const color   = isHigh ? "#92400e" : "#9a3412";
  const message = isHigh
    ? `⚠️ Price likely to rise ${Math.abs(prediction.diff_pct).toFixed(0)}% — book now to lock ₹${prediction.current_price}!`
    : `📈 Price may increase slightly. Consider booking soon.`;

  return (
    <div style={{
      backgroundColor: bg,
      border:          `1px solid ${border}`,
      borderRadius:    "8px",
      padding:         "10px 14px",
      marginBottom:    "12px",
      fontSize:        "13px",
      fontWeight:      500,
      color,
    }}>
      {message}
    </div>
  );
};

// ─── Main BusCard ─────────────────────────────────────────────────────────────
const BusCard: React.FC<BusCardProps> = ({ bus }) => {
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);

  // Fetch price prediction when card loads
  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/ai/predict-price/", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fare:             parseFloat(bus.fare),
            bus_type:         bus.bus_type,
            available_seats:  bus.seats,
            days_to_departure: 7,   // default — you can pass real date diff later
          }),
        });
        const data = await res.json();
        if (data.success) setPrediction(data.prediction);
      } catch {
        // prediction unavailable — card still works fine
      }
    };
    fetchPrediction();
  }, [bus.bus_id]);

  return (
    <div style={{
      border:          "1px solid #e5e7eb",
      borderRadius:    "12px",
      padding:         "20px",
      marginBottom:    "16px",
      backgroundColor: "#ffffff",
      boxShadow:       "0 1px 4px rgba(0,0,0,0.06)",
      position:        "relative",
    }}>

      {/* Rank badge */}
      <div style={{
        position:        "absolute",
        top:             "16px",
        right:           "16px",
        width:           "32px",
        height:          "32px",
        borderRadius:    "50%",
        backgroundColor: bus.rank === 1 ? "#7c3aed" : "#6b7280",
        color:           "#fff",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        fontSize:        "13px",
        fontWeight:      600,
      }}>
        #{bus.rank}
      </div>

      {/* Header */}
      <div style={{ marginBottom:"12px" }}>
        <h3 style={{ margin:0, fontSize:"16px", fontWeight:600 }}>{bus.operator}</h3>
        <p style={{ margin:"2px 0 0", fontSize:"13px", color:"#6b7280" }}>
          {bus.bus_number} · {bus.bus_type}
        </p>
      </div>

      {/* Urgency warning */}
      {prediction && <UrgencyBanner prediction={prediction} />}

      {/* Time + fare row */}
      <div style={{ display:"flex", gap:"24px", marginBottom:"14px", flexWrap:"wrap" }}>
        <div>
          <p style={{ margin:0, fontSize:"11px", color:"#9ca3af" }}>Departure</p>
          <p style={{ margin:0, fontSize:"15px", fontWeight:600 }}>{bus.departure.slice(0,5)}</p>
        </div>
        <div style={{ fontSize:"20px", color:"#d1d5db", alignSelf:"center" }}>→</div>
        <div>
          <p style={{ margin:0, fontSize:"11px", color:"#9ca3af" }}>Arrival</p>
          <p style={{ margin:0, fontSize:"15px", fontWeight:600 }}>{bus.arrival.slice(0,5)}</p>
        </div>

        {/* Fare + predicted price */}
        <div style={{ marginLeft:"auto" }}>
          <p style={{ margin:0, fontSize:"11px", color:"#9ca3af" }}>Current fare</p>
          <p style={{ margin:0, fontSize:"18px", fontWeight:700, color:"#7c3aed" }}>
            ₹{parseFloat(bus.fare).toFixed(0)}
          </p>
          {prediction && (
            <div style={{ display:"flex", alignItems:"center", gap:"6px", marginTop:"4px" }}>
              <p style={{ margin:0, fontSize:"11px", color:"#9ca3af" }}>
                Predicted: ₹{prediction.predicted_price.toFixed(0)}
              </p>
              <TrendBadge prediction={prediction} />
            </div>
          )}
        </div>

        <div>
          <p style={{ margin:0, fontSize:"11px", color:"#9ca3af" }}>Seats left</p>
          <p style={{ margin:0, fontSize:"15px", fontWeight:600 }}>{bus.seats}</p>
        </div>
      </div>

      {/* Score bars */}
      <div style={{ backgroundColor:"#f9fafb", borderRadius:"8px", padding:"12px", marginBottom:"12px" }}>
        <p style={{ margin:"0 0 8px", fontSize:"11px", fontWeight:600, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.05em" }}>
          AI score breakdown
        </p>
        <ScoreBar label="Price"   value={bus.scores.price}         />
        <ScoreBar label="Speed"   value={bus.scores.time}          />
        <ScoreBar label="Comfort" value={bus.scores.comfort}       />
        <ScoreBar label="Seats"   value={bus.scores.seats}         />
        <ScoreBar label="Rating"  value={bus.scores.rating ?? 0}   />
      </div>

      {/* Bullet-point reasons */}
      {bus.reason && (
        <div style={{ backgroundColor:"#fafafa", border:"1px solid #e5e7eb", borderRadius:"8px", padding:"12px 14px", marginBottom:"12px" }}>
          <p style={{ margin:"0 0 8px", fontSize:"11px", fontWeight:600, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.05em" }}>
            AI reasoning
          </p>
          {bus.reason.split("\n").map((line, i) => {
            const formatted = line.replace(/\*\*(.+?)\*\*/g, (_, t) => `<strong>${t}</strong>`);
            return (
              <p key={i} style={{ margin:"4px 0", fontSize:"13px", color:"#374151" }}
                dangerouslySetInnerHTML={{ __html: formatted }}/>
            );
          })}
        </div>
      )}

      {/* Confidence badge */}
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <ConfidenceBadge value={bus.confidence} />
      </div>

    </div>
  );
};

export default BusCard;