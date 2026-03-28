import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getBookings, cancelBooking, type Booking } from "@/lib/api";
import { AlertCircle, Ticket, MapPin, Clock, X, Hash, Bus, ChevronRight, Search } from "lucide-react";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}
function isUpcoming(iso: string) {
  return new Date(iso) > new Date();
}

export default function MyBookings() {
  const [bookings,     setBookings]     = useState<Booking[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [confirmId,    setConfirmId]    = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => { fetchBookings(); }, []);

  async function fetchBookings() {
    setLoading(true); setError(null);
    try {
      const data = await getBookings();
      setBookings(data);
    } catch (err: any) {
      setError(err.message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(bookingId: number) {
    setCancellingId(bookingId);
    setConfirmId(null);
    try {
      await cancelBooking(bookingId);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (err: any) {
      setError(err.message || "Cancellation failed.");
    } finally {
      setCancellingId(null);
    }
  }

  const upcoming = bookings.filter(b => isUpcoming(b.departure_time));
  const past     = bookings.filter(b => !isUpcoming(b.departure_time));

  return (
    <div style={{ minHeight: "calc(100vh - 3.5rem)", background: "var(--bg-page, #f3f4f8)" }}>
      <style>{`
        @keyframes mb-fade-up {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes mb-spin { to { transform:rotate(360deg); } }

        .mb-ticket { animation: mb-fade-up 0.35s ease both; }
        .mb-ticket:nth-child(1) { animation-delay:.05s }
        .mb-ticket:nth-child(2) { animation-delay:.10s }
        .mb-ticket:nth-child(3) { animation-delay:.15s }
        .mb-ticket:nth-child(4) { animation-delay:.20s }

        .mb-cancel-btn:hover:not(:disabled) {
          background: #fee2e2 !important;
          border-color: #fca5a5 !important;
          color: #b91c1c !important;
        }
        .mb-new-search:hover {
          background: linear-gradient(135deg,#5f7ef8,#8b5cf6) !important;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(79,110,247,0.4) !important;
        }
        .mb-section-label {
          font-size:11px; font-weight:600; letter-spacing:.7px;
          text-transform:uppercase; color:#9ca3af; margin:0 0 12px;
        }
      `}</style>

      {/* ── Page header ── */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)",
        padding: "40px 24px 48px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* grid texture */}
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
          backgroundSize:"36px 36px",
        }}/>
        <div style={{ maxWidth:"860px", margin:"0 auto", position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"8px" }}>
            <div style={{
              width:"40px", height:"40px", borderRadius:"12px",
              background:"rgba(99,102,241,0.25)", border:"1px solid rgba(99,102,241,0.4)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <Ticket size={20} color="#a5b4fc" />
            </div>
            <h1 style={{
              fontFamily:"'Bricolage Grotesque','DM Sans',sans-serif",
              fontSize:"28px", fontWeight:800, color:"#f1f5ff",
              margin:0, letterSpacing:"-0.6px",
            }}>
              My Bookings
            </h1>
          </div>
          <p style={{ fontSize:"14px", color:"rgba(241,245,255,0.45)", margin:"0 0 20px 52px" }}>
            View and manage all your bus reservations.
          </p>

          {/* Quick stats */}
          {!loading && bookings.length > 0 && (
            <div style={{ display:"flex", gap:"12px", flexWrap:"wrap", marginLeft:"52px" }}>
              {[
                { label:"Total", value: bookings.length,  color:"#818cf8" },
                { label:"Upcoming", value: upcoming.length, color:"#34d399" },
                { label:"Past",     value: past.length,     color:"#9ca3af" },
              ].map(s => (
                <div key={s.label} style={{
                  background:"rgba(255,255,255,0.07)",
                  border:"1px solid rgba(255,255,255,0.1)",
                  borderRadius:"10px", padding:"8px 16px",
                  display:"flex", alignItems:"center", gap:"8px",
                }}>
                  <span style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"20px", fontWeight:700, color:s.color }}>{s.value}</span>
                  <span style={{ fontSize:"12px", color:"rgba(255,255,255,0.45)", fontWeight:500 }}>{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth:"860px", margin:"0 auto", padding:"32px 24px" }}>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign:"center", padding:"64px 0" }}>
            <div style={{
              width:"44px", height:"44px", margin:"0 auto 16px",
              border:"3px solid #e5e7eb", borderTopColor:"#6366f1",
              borderRadius:"50%", animation:"mb-spin 0.75s linear infinite",
            }}/>
            <p style={{ color:"#9ca3af", fontSize:"14px" }}>Loading your bookings…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            display:"flex", alignItems:"center", gap:"10px",
            background:"#fef2f2", border:"1px solid #fca5a5",
            borderRadius:"12px", padding:"14px 18px",
            color:"#b91c1c", fontSize:"14px", marginBottom:"20px",
          }}>
            <AlertCircle size={16} style={{ flexShrink:0 }}/>
            {error}
            <button onClick={fetchBookings} style={{
              marginLeft:"auto", background:"#ef4444", color:"#fff",
              border:"none", borderRadius:"8px", padding:"5px 14px",
              fontSize:"12px", fontWeight:600, cursor:"pointer",
            }}>Retry</button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && bookings.length === 0 && (
          <div style={{ animation:"mb-fade-up 0.4s ease both" }}>
            <div style={{
              textAlign:"center", padding:"60px 24px 48px",
              background:"#fff", border:"1px solid #e5e7eb",
              borderRadius:"24px", marginBottom:"24px",
            }}>
              {/* Illustration */}
              <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg"
                style={{ width:"200px", height:"auto", margin:"0 auto 24px", display:"block" }}>
                <ellipse cx="140" cy="162" rx="80" ry="10" fill="#f3f4f6"/>
                <rect x="60" y="80" width="160" height="76" rx="14" fill="#e0e7ff" stroke="#a5b4fc" strokeWidth="1.5"/>
                <rect x="72" y="92"  width="28" height="20" rx="4" fill="#fff" stroke="#c7d2fe" strokeWidth="1"/>
                <rect x="108" y="92" width="28" height="20" rx="4" fill="#fff" stroke="#c7d2fe" strokeWidth="1"/>
                <rect x="144" y="92" width="28" height="20" rx="4" fill="#fff" stroke="#c7d2fe" strokeWidth="1"/>
                <rect x="180" y="92" width="28" height="20" rx="4" fill="#fff" stroke="#c7d2fe" strokeWidth="1"/>
                <rect x="198" y="118" width="12" height="8"  rx="2" fill="#fde68a"/>
                <circle cx="92"  cy="158" r="14" fill="#6366f1"/><circle cx="92"  cy="158" r="7" fill="#e0e7ff"/>
                <circle cx="188" cy="158" r="14" fill="#6366f1"/><circle cx="188" cy="158" r="7" fill="#e0e7ff"/>
                <rect x="58" y="136" width="164" height="26" rx="6" fill="#c7d2fe" opacity=".4"/>
                {/* Ticket stub floating */}
                <rect x="96" y="22" width="88" height="50" rx="8" fill="#fff" stroke="#c7d2fe" strokeWidth="1.5"/>
                <line x1="96" y1="44" x2="184" y2="44" stroke="#e0e7ff" strokeWidth="1"/>
                <rect x="104" y="30" width="40" height="6" rx="3" fill="#e0e7ff"/>
                <rect x="104" y="50" width="24" height="5" rx="2.5" fill="#e0e7ff"/>
                <circle cx="170" cy="47" r="8" fill="#f0fdf4" stroke="#86efac" strokeWidth="1"/>
                <path d="M165 47l3 3 6-6" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>

              <h3 style={{
                fontFamily:"'Bricolage Grotesque','DM Sans',sans-serif",
                fontSize:"22px", fontWeight:700, color:"#111827",
                margin:"0 0 8px", letterSpacing:"-0.4px",
              }}>No bookings yet</h3>
              <p style={{ fontSize:"14px", color:"#6b7280", margin:"0 0 28px", lineHeight:1.6 }}>
                You haven't booked any bus tickets yet.<br/>Start by searching for a route.
              </p>
              <button
                className="mb-new-search"
                onClick={() => navigate("/")}
                style={{
                  background:"linear-gradient(135deg,#4f6ef7,#7c3aed)",
                  color:"#fff", border:"none", borderRadius:"12px",
                  padding:"12px 28px", fontSize:"14px", fontWeight:600,
                  cursor:"pointer", display:"inline-flex", alignItems:"center",
                  gap:"8px", boxShadow:"0 4px 16px rgba(79,110,247,0.35)",
                  transition:"all 0.2s",
                }}
              >
                <Search size={16}/> Find a Bus
              </button>
            </div>
          </div>
        )}

        {/* ── Booking cards ── */}
        {!loading && bookings.length > 0 && (
          <>
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div style={{ marginBottom:"32px" }}>
                <p className="mb-section-label">🟢 Upcoming trips — {upcoming.length}</p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(360px,1fr))", gap:"16px" }}>
                  {upcoming.map(b => (
                    <BookingCard
                      key={b.id} b={b} upcoming={true}
                      cancellingId={cancellingId}
                      confirmId={confirmId}
                      setConfirmId={setConfirmId}
                      handleCancel={handleCancel}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div>
                <p className="mb-section-label">⚫ Past trips — {past.length}</p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(360px,1fr))", gap:"16px" }}>
                  {past.map(b => (
                    <BookingCard
                      key={b.id} b={b} upcoming={false}
                      cancellingId={cancellingId}
                      confirmId={confirmId}
                      setConfirmId={setConfirmId}
                      handleCancel={handleCancel}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Ticket card sub-component ────────────────────────────────────────────────
function BookingCard({ b, upcoming, cancellingId, confirmId, setConfirmId, handleCancel }: {
  b: Booking;
  upcoming: boolean;
  cancellingId: number | null;
  confirmId: number | null;
  setConfirmId: (id: number | null) => void;
  handleCancel: (id: number) => void;
}) {
  const isConfirming = confirmId === b.id;
  const isCancelling = cancellingId === b.id;

  return (
    <div className="mb-ticket" style={{
      background: "#fff",
      border: `1px solid ${upcoming ? "#e0e7ff" : "#e5e7eb"}`,
      borderRadius: "18px",
      overflow: "hidden",
      boxShadow: upcoming ? "0 4px 20px rgba(99,102,241,0.08)" : "0 2px 8px rgba(0,0,0,0.04)",
      opacity: upcoming ? 1 : 0.7,
    }}>

      {/* Card top stripe */}
      <div style={{
        height: "4px",
        background: upcoming
          ? "linear-gradient(90deg,#6366f1,#8b5cf6)"
          : "linear-gradient(90deg,#d1d5db,#9ca3af)",
      }}/>

      {/* Card header */}
      <div style={{
        padding: "16px 20px 12px",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        borderBottom: "1px dashed #e5e7eb",
      }}>
        <div>
          <p style={{ fontSize:"11px", color:"#9ca3af", margin:"0 0 3px", fontWeight:500 }}>
            Booking #{b.id}
          </p>
          <h3 style={{
            fontFamily:"'Bricolage Grotesque','DM Sans',sans-serif",
            fontSize:"17px", fontWeight:700, color:"#111827",
            margin:0, letterSpacing:"-0.3px", textTransform:"capitalize",
          }}>
            {b.passenger_name}
          </h3>
        </div>

        {/* Status badge */}
        <span style={{
          display:"inline-flex", alignItems:"center", gap:"5px",
          fontSize:"11px", fontWeight:600,
          padding:"4px 10px", borderRadius:"999px",
          background: upcoming ? "#f0fdf4" : "#f9fafb",
          color:       upcoming ? "#15803d" : "#6b7280",
          border:      `1px solid ${upcoming ? "#86efac" : "#e5e7eb"}`,
        }}>
          <span style={{
            width:"6px", height:"6px", borderRadius:"50%",
            background: upcoming ? "#22c55e" : "#9ca3af",
          }}/>
          {upcoming ? "Upcoming" : "Completed"}
        </span>
      </div>

      {/* Route display */}
      <div style={{
        padding:"14px 20px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background: upcoming ? "#fafbff" : "#fafafa",
        borderBottom:"1px dashed #e5e7eb",
      }}>
        <div style={{ textAlign:"center" }}>
          <p style={{ fontSize:"10px", color:"#9ca3af", margin:"0 0 3px", textTransform:"uppercase", letterSpacing:".5px" }}>From</p>
          <p style={{ fontSize:"16px", fontWeight:700, color:"#111827", margin:0, letterSpacing:"-0.3px" }}>{b.source}</p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"4px" }}>
          <Bus size={16} color="#6366f1"/>
          <div style={{ height:"1px", width:"60px", background:"linear-gradient(90deg,#c7d2fe,#a5b4fc)" }}/>
        </div>
        <div style={{ textAlign:"center" }}>
          <p style={{ fontSize:"10px", color:"#9ca3af", margin:"0 0 3px", textTransform:"uppercase", letterSpacing:".5px" }}>To</p>
          <p style={{ fontSize:"16px", fontWeight:700, color:"#111827", margin:0, letterSpacing:"-0.3px" }}>{b.destination}</p>
        </div>
      </div>

      {/* Details row */}
      <div style={{
        padding:"12px 20px",
        display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
        gap:"8px", borderBottom:"1px dashed #e5e7eb",
      }}>
        {[
          { icon:<Hash size={12}/>,    label:"Bus",  value: b.bus_number  },
          { icon:<Ticket size={12}/>,  label:"Seat", value: `#${b.seat_number}` },
          { icon:<Clock size={12}/>,   label:"Time", value: formatTime(b.departure_time) },
        ].map(d => (
          <div key={d.label} style={{ textAlign:"center" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"3px", color:"#9ca3af", marginBottom:"3px" }}>
              {d.icon}
              <span style={{ fontSize:"10px", textTransform:"uppercase", letterSpacing:".4px", fontWeight:600 }}>{d.label}</span>
            </div>
            <p style={{ fontSize:"13px", fontWeight:600, color:"#374151", margin:0 }}>{d.value}</p>
          </div>
        ))}
      </div>

      {/* Date + cancel row */}
      <div style={{ padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"6px", color:"#6b7280", fontSize:"12px" }}>
          <Clock size={12}/>
          {formatDate(b.departure_time)}
        </div>

        {upcoming && (
          <>
            {!isConfirming ? (
              <button
                className="mb-cancel-btn"
                onClick={() => setConfirmId(b.id)}
                disabled={isCancelling}
                style={{
                  display:"inline-flex", alignItems:"center", gap:"5px",
                  background:"#fef2f2", border:"1px solid #fecaca",
                  color:"#dc2626", borderRadius:"8px",
                  padding:"6px 14px", fontSize:"12px", fontWeight:600,
                  cursor:"pointer", transition:"all 0.15s",
                }}
              >
                <X size={12}/>
                Cancel
              </button>
            ) : (
              <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                <span style={{ fontSize:"12px", color:"#6b7280" }}>Sure?</span>
                <button
                  onClick={() => handleCancel(b.id)}
                  disabled={isCancelling}
                  style={{
                    background:"#ef4444", color:"#fff", border:"none",
                    borderRadius:"7px", padding:"5px 12px", fontSize:"12px",
                    fontWeight:600, cursor:"pointer",
                  }}
                >
                  {isCancelling ? "…" : "Yes, cancel"}
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  style={{
                    background:"#f3f4f6", color:"#374151", border:"none",
                    borderRadius:"7px", padding:"5px 10px", fontSize:"12px",
                    cursor:"pointer",
                  }}
                >
                  Keep
                </button>
              </div>
            )}
          </>
        )}

        {!upcoming && (
          <span style={{
            fontSize:"11px", color:"#9ca3af", fontStyle:"italic",
          }}>Trip completed</span>
        )}
      </div>
    </div>
  );
}
