// frontend/src/pages/SearchResults.tsx

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Bus, AlertCircle, Calendar } from "lucide-react";
import BusCard from "../components/BusCard";
import { fetchRecommendations, BusResult } from "../lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const PREFERENCES = [
  { value: "balanced", emoji: " ", text: "Best Overall"    },
  { value: "cheap",    emoji: " ", text: "Cheapest"         },
  { value: "fast",     emoji: " ", text: "Fastest"           },
  { value: "comfort",  emoji: " ", text: "Most Comfortable" },
];

const POPULAR_ROUTES = [
  { from: "Delhi",     to: "Jaipur"   },
  { from: "Mumbai",    to: "Pune"     },
  { from: "Bangalore", to: "Chennai"  },
  { from: "Hyderabad", to: "Vizag"    },
  { from: "Delhi",     to: "Agra"     },
  { from: "Kolkata",   to: "Siliguri" },
];

const SEARCH_TIPS = [
  { icon: " ", tip: "Check spelling",    detail: 'City names like "Bengaluru" vs "Bangalore" may differ.' },
  { icon: " ", tip: "Try reverse route", detail: "Some routes are listed only in one direction."          },
  { icon: " ", tip: "Use nearby cities", detail: "Try a major hub city close to your destination."        },
  { icon: " ", tip: "Off-peak routes",   detail: "Fewer buses run on weekends or late nights."            },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

// ─── Empty state SVG ──────────────────────────────────────────────────────────
const EmptyIllustration: React.FC = () => (
  <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ width:"220px", height:"auto", margin:"0 auto", display:"block" }} aria-hidden="true">
    <rect x="60"  y="155" width="200" height="28" rx="6" fill="#e5e7eb"/>
    <rect x="60"  y="155" width="200" height="28" rx="6" fill="url(#rg)"/>
    <rect x="148" y="164" width="24"  height="6"  rx="3" fill="#d1d5db"/>
    <rect x="88"  y="110" width="100" height="52" rx="10" fill="#c7d2fe"/>
    <rect x="88"  y="110" width="100" height="52" rx="10" stroke="#818cf8" strokeWidth="1.5"/>
    <rect x="96"  y="118" width="18" height="14" rx="3" fill="#eef2ff" stroke="#a5b4fc" strokeWidth="1"/>
    <rect x="120" y="118" width="18" height="14" rx="3" fill="#eef2ff" stroke="#a5b4fc" strokeWidth="1"/>
    <rect x="144" y="118" width="18" height="14" rx="3" fill="#eef2ff" stroke="#a5b4fc" strokeWidth="1"/>
    <rect x="168" y="118" width="14" height="14" rx="3" fill="#eef2ff" stroke="#a5b4fc" strokeWidth="1"/>
    <circle cx="108" cy="164" r="10" fill="#6366f1"/><circle cx="108" cy="164" r="5" fill="#e0e7ff"/>
    <circle cx="168" cy="164" r="10" fill="#6366f1"/><circle cx="168" cy="164" r="5" fill="#e0e7ff"/>
    <rect x="183" y="128" width="8" height="6" rx="2" fill="#fde68a"/>
    <rect x="183" y="138" width="8" height="6" rx="2" fill="#fde68a"/>
    <line x1="230" y1="100" x2="230" y2="158" stroke="#d1d5db" strokeWidth="2"/>
    <rect x="214" y="78" width="32" height="32" rx="6" fill="#fee2e2" stroke="#fca5a5" strokeWidth="1.5"/>
    <line x1="221" y1="85" x2="239" y2="103" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="239" y1="85" x2="221" y2="103" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
    <text x="62"  y="108" fontSize="16" fill="#c7d2fe" opacity="0.7">?</text>
    <text x="258" y="130" fontSize="13" fill="#c7d2fe" opacity="0.5">?</text>
    <text x="76"  y="140" fontSize="10" fill="#c7d2fe" opacity="0.4">?</text>
    <ellipse cx="138" cy="195" rx="56" ry="8" fill="#e5e7eb" opacity="0.6"/>
    <defs>
      <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#d1d5db" stopOpacity="0.3"/>
        <stop offset="100%" stopColor="#9ca3af" stopOpacity="0.15"/>
      </linearGradient>
    </defs>
  </svg>
);

// ─── Main component ───────────────────────────────────────────────────────────
const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const source      = searchParams.get("source")      || "";
  const destination = searchParams.get("destination") || "";
  const date        = searchParams.get("date")        || new Date().toISOString().split("T")[0];
  const navigate    = useNavigate();

  const [preference, setPreference] = useState("balanced");
  const [results,    setResults]    = useState<BusResult[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [total,      setTotal]      = useState(0);

  useEffect(() => {
    if (!source || !destination) return;
    const load = async () => {
      setLoading(true); setError("");
      try {
        const data = await fetchRecommendations(source, destination, preference);
        setResults(data.results);
        setTotal(data.meta.total);
      } catch (e: any) {
        setError("Could not load results. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [source, destination, preference]);

  const handleRouteClick = (from: string, to: string) =>
    navigate(`/search?source=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`);

  return (
    <div style={{ minHeight:"calc(100vh - 3.5rem)", background:"#f3f4f8" }}>
      <style>{`
        @keyframes sr-spin    { to { transform:rotate(360deg); } }
        @keyframes sr-fade-up { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .sr-pref:hover:not(.sr-pref-on) {
          background:rgba(255,255,255,0.13) !important;
          border-color:rgba(255,255,255,0.3) !important;
          color:#fff !important;
        }
        .sr-tip:hover   { background:#f5f3ff !important; border-color:#c4b5fd !important; }
        .sr-pill:hover  { background:#ede9fe !important; border-color:#a78bfa !important; color:#5b21b6 !important; }
        .sr-cta:hover   { filter:brightness(1.1); transform:translateY(-1px); box-shadow:0 8px 24px rgba(79,110,247,0.45) !important; }
        .sr-retry:hover { background:#dc2626 !important; }
      `}</style>

      {/* ── Navy hero header ─────────────────────────────────── */}
      <div style={{
        background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)",
        padding:"40px 24px 52px",
        position:"relative",
        overflow:"hidden",
      }}>
        {/* dot grid */}
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
          backgroundSize:"36px 36px",
        }}/>
        {/* ambient glows */}
        <div style={{
          position:"absolute", width:"420px", height:"420px", borderRadius:"50%", pointerEvents:"none",
          background:"radial-gradient(circle,rgba(99,102,241,0.22) 0%,transparent 70%)",
          top:"-160px", left:"-100px",
        }}/>
        <div style={{
          position:"absolute", width:"320px", height:"320px", borderRadius:"50%", pointerEvents:"none",
          background:"radial-gradient(circle,rgba(14,165,233,0.13) 0%,transparent 70%)",
          bottom:"-120px", right:"-60px",
        }}/>

        <div style={{ maxWidth:"720px", margin:"0 auto", position:"relative", zIndex:1 }}>

          {/* Route title */}
          <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"6px", flexWrap:"wrap" }}>
            <div style={{
              width:"38px", height:"38px", borderRadius:"10px", flexShrink:0,
              background:"rgba(99,102,241,0.22)", border:"1px solid rgba(99,102,241,0.4)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <Bus size={18} color="#a5b4fc"/>
            </div>
            <h1 style={{
              fontFamily:"'Bricolage Grotesque','DM Sans',sans-serif",
              fontSize:"clamp(20px,4vw,30px)", fontWeight:800,
              margin:0, letterSpacing:"-0.5px",
              display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap",
            }}>
              <span style={{ background:"linear-gradient(90deg,#a5b4fc,#818cf8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                {source || "—"}
              </span>
              <span style={{ color:"rgba(255,255,255,0.2)", fontWeight:300, fontSize:"20px" }}>→</span>
              <span style={{ background:"linear-gradient(90deg,#818cf8,#38bdf8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                {destination || "—"}
              </span>
            </h1>
          </div>

          {/* Date + bus count row */}
          <div style={{
            display:"flex", alignItems:"center", gap:"16px",
            margin:"0 0 28px 50px", flexWrap:"wrap",
          }}>
            {/* Date badge */}
            <div style={{
              display:"flex", alignItems:"center", gap:"6px",
              background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.3)",
              borderRadius:"999px", padding:"4px 12px",
            }}>
              <Calendar size={12} color="#a5b4fc"/>
              <span style={{ fontSize:"13px", color:"#a5b4fc", fontWeight:600 }}>
                {formatDisplayDate(date)}
              </span>
            </div>

            {/* Bus count */}
            <p style={{
              margin:0, fontSize:"14px",
              color: loading ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.42)",
            }}>
              {loading ? "Searching…" : `${total} bus${total !== 1 ? "es" : ""} found`}
            </p>
          </div>

          {/* Preference pills */}
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
            {PREFERENCES.map(p => {
              const on = preference === p.value;
              return (
                <button
                  key={p.value}
                  className={`sr-pref${on ? " sr-pref-on" : ""}`}
                  onClick={() => setPreference(p.value)}
                  style={{
                    padding:"8px 18px", borderRadius:"999px", cursor:"pointer",
                    border: on ? "2px solid #818cf8" : "2px solid rgba(255,255,255,0.14)",
                    background: on ? "linear-gradient(135deg,#4f6ef7,#7c3aed)" : "rgba(255,255,255,0.07)",
                    color: on ? "#fff" : "rgba(255,255,255,0.55)",
                    fontSize:"13px", fontWeight:600, transition:"all 0.2s",
                    boxShadow: on ? "0 4px 14px rgba(99,102,241,0.4)" : "none",
                  }}
                >
                  {p.emoji} {p.text}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      <div style={{ maxWidth:"720px", margin:"0 auto", padding:"28px 16px 48px" }}>

        {/* Loading spinner */}
        {loading && (
          <div style={{ textAlign:"center", padding:"64px 0" }}>
            <div style={{
              width:"48px", height:"48px", margin:"0 auto 16px",
              border:"3px solid #e5e7eb", borderTopColor:"#6366f1",
              borderRadius:"50%", animation:"sr-spin 0.8s linear infinite",
            }}/>
            <p style={{ fontSize:"15px", color:"#6b7280", margin:0 }}>Finding the best buses for you…</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{
            padding:"14px 18px", borderRadius:"12px", marginBottom:"20px",
            background:"#fef2f2", border:"1px solid #fca5a5",
            color:"#b91c1c", fontSize:"14px",
            display:"flex", alignItems:"center", gap:"10px",
          }}>
            <AlertCircle size={16} style={{ flexShrink:0 }}/>
            {error}
            <button className="sr-retry" onClick={() => window.location.reload()} style={{
              marginLeft:"auto", background:"#ef4444", color:"#fff",
              border:"none", borderRadius:"8px", padding:"6px 14px",
              fontSize:"13px", cursor:"pointer", fontWeight:500, transition:"background 0.15s",
            }}>Retry</button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && results.length === 0 && (
          <div style={{ animation:"sr-fade-up 0.4s ease both" }}>
            <div style={{
              textAlign:"center", padding:"48px 24px 36px",
              background:"#fff", border:"1px solid #e5e7eb",
              borderRadius:"20px", marginBottom:"24px",
              boxShadow:"0 4px 20px rgba(0,0,0,0.05)",
            }}>
              <EmptyIllustration/>
              <h3 style={{
                fontFamily:"'Bricolage Grotesque','DM Sans',sans-serif",
                fontSize:"22px", fontWeight:700, color:"#111827",
                margin:"24px 0 8px", letterSpacing:"-0.4px",
              }}>
                No buses on this route
              </h3>
              <p style={{ fontSize:"14px", color:"#6b7280", margin:"0 0 24px", lineHeight:1.6 }}>
                We couldn't find any scheduled buses from{" "}
                <strong style={{ color:"#374151" }}>{source}</strong> to{" "}
                <strong style={{ color:"#374151" }}>{destination}</strong> on{" "}
                <strong style={{ color:"#374151" }}>{formatDisplayDate(date)}</strong>.
              </p>
              <button className="sr-cta" onClick={() => navigate("/")} style={{
                background:"linear-gradient(135deg,#4f6ef7,#7c3aed)",
                color:"#fff", border:"none", borderRadius:"10px",
                padding:"11px 24px", fontSize:"14px", fontWeight:600,
                cursor:"pointer", transition:"all 0.2s",
                boxShadow:"0 4px 16px rgba(99,102,241,0.35)",
                display:"inline-flex", alignItems:"center", gap:"8px",
              }}>
                <Search size={15}/> Search a new route
              </button>
            </div>

            {/* Search tips */}
            <div style={{ marginBottom:"24px" }}>
              <p style={{ fontSize:"11px", fontWeight:600, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.6px", margin:"0 0 12px" }}>
                💡 Search tips
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"10px" }}>
                {SEARCH_TIPS.map(t => (
                  <div key={t.tip} className="sr-tip" style={{
                    display:"flex", alignItems:"flex-start", gap:"12px",
                    padding:"14px 16px", background:"#fff",
                    border:"1px solid #e5e7eb", borderRadius:"12px",
                    transition:"all 0.15s",
                  }}>
                    <span style={{ fontSize:"20px", flexShrink:0, lineHeight:1 }}>{t.icon}</span>
                    <div>
                      <p style={{ margin:"0 0 2px", fontSize:"13px", fontWeight:600, color:"#111827" }}>{t.tip}</p>
                      <p style={{ margin:0, fontSize:"12px", color:"#6b7280", lineHeight:1.5 }}>{t.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular routes */}
            <div>
              <p style={{ fontSize:"11px", fontWeight:600, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.6px", margin:"0 0 12px" }}>
                🗺️ Try a popular route
              </p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                {POPULAR_ROUTES.map(r => (
                  <button key={`${r.from}-${r.to}`} className="sr-pill"
                    onClick={() => handleRouteClick(r.from, r.to)}
                    style={{
                      background:"#fff", border:"1px solid #e5e7eb", borderRadius:"999px",
                      padding:"8px 16px", fontSize:"13px", color:"#374151", fontWeight:500,
                      cursor:"pointer", transition:"all 0.15s",
                      display:"flex", alignItems:"center", gap:"6px",
                    }}
                  >
                    <span style={{ color:"#7c3aed" }}>🚌</span>
                    {r.from}
                    <span style={{ color:"#9ca3af" }}>→</span>
                    {r.to}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results — pass travelDate to BusCard */}
        {!loading && results.map(bus => (
          <BusCard key={bus.bus_id} bus={bus} travelDate={date} />
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
