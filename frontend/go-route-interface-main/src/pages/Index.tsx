import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Shield, Clock, ArrowRight, MapPin, Navigation, Calendar } from "lucide-react";

const Index = () => {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (source.trim() && destination.trim()) {
      navigate(
        `/search?source=${encodeURIComponent(source.trim())}&destination=${encodeURIComponent(destination.trim())}&date=${encodeURIComponent(date)}`
      );
    }
  };

  const features = [
    {
      icon: Search,
      title: "Search Instantly",
      desc: "Find buses across all major routes with real-time availability.",
      accent: "#3b82f6",
      bg: "rgba(59,130,246,0.08)",
    },
    {
      icon: Shield,
      title: "Safe Transactions",
      desc: "Transaction-safe booking powered by a reliable backend.",
      accent: "#10b981",
      bg: "rgba(16,185,129,0.08)",
    },
    {
      icon: Clock,
      title: "Live Updates",
      desc: "Get real-time schedule info, seats, and pricing.",
      accent: "#f59e0b",
      bg: "rgba(245,158,11,0.08)",
    },
  ];

  const popularRoutes = [
    { from: "Delhi",     to: "Jaipur"  },
    { from: "Mumbai",    to: "Pune"    },
    { from: "Bangalore", to: "Chennai" },
    { from: "Hyderabad", to: "Vizag"   },
  ];

  return (
    <div className="busgo-home">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="busgo-hero">
        <div className="busgo-hero-bg" />
        <div className="busgo-hero-grid" />
        <div className="busgo-hero-glow busgo-glow-left" />
        <div className="busgo-hero-glow busgo-glow-right" />

        <div className="busgo-hero-inner">
          {/* Badge */}
          <div className="busgo-badge">
            <span className="busgo-badge-dot" />
            Fast &amp; reliable bus booking across India
          </div>

          {/* Heading */}
          <h1 className="busgo-heading">
            Book your bus,<br />
            <span className="busgo-heading-accent">skip the hassle.</span>
          </h1>

          <p className="busgo-subheading">
            Search routes, compare options, and book your seat in seconds.
          </p>

          {/* ── Search card ──
               Override the card's flex direction so rows stack vertically.
               padding:0 lets each inner row control its own spacing.        */}
          <form
            onSubmit={handleSearch}
            className="busgo-search-card"
            style={{ display:"flex", flexDirection:"column", padding:0, overflow:"hidden" }}
          >
            {/* Row 1: Source / Swap / Destination */}
            <div className="busgo-search-fields" style={{ padding:"12px 16px" }}>
              <div className="busgo-search-field">
                <MapPin className="busgo-field-icon" />
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="From (e.g. Delhi)"
                  className="busgo-input"
                  required
                />
              </div>

              <div className="busgo-search-divider">
                <div className="busgo-divider-line" />
                <button
                  type="button"
                  className="busgo-swap-btn"
                  onClick={() => { const t = source; setSource(destination); setDestination(t); }}
                  title="Swap cities"
                >
                  ⇄
                </button>
                <div className="busgo-divider-line" />
              </div>

              <div className="busgo-search-field">
                <Navigation className="busgo-field-icon" />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="To (e.g. Jaipur)"
                  className="busgo-input"
                  required
                />
              </div>
            </div>

            {/* Row 2: Date picker — full width below source/dest */}
            <div style={{
              display:"flex",
              alignItems:"center",
              gap:"12px",
              padding:"12px 20px",
              borderTop:"1px solid rgba(255,255,255,0.07)",
              background:"rgba(255,255,255,0.04)",
            }}>
              <Calendar size={15} color="#a5b4fc" style={{ flexShrink:0 }} />
              <span style={{
                fontSize:"13px",
                color:"rgba(255,255,255,0.45)",
                fontWeight:500,
                whiteSpace:"nowrap",
              }}>
                Travel Date
              </span>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                required
                style={{
                  flex:1,
                  background:"transparent",
                  border:"none",
                  outline:"none",
                  color:"#c7d2fe",
                  fontSize:"14px",
                  fontWeight:600,
                  cursor:"pointer",
                  colorScheme:"dark",
                }}
              />
            </div>

            {/* Row 3: Search button — full width */}
            <div style={{
              padding:"12px 16px",
              borderTop:"1px solid rgba(255,255,255,0.07)",
            }}>
              <button
                type="submit"
                className="busgo-search-btn"
                style={{ width:"100%", margin:0, justifyContent:"center" }}
              >
                <Search className="busgo-btn-icon" />
                Search Buses
              </button>
            </div>
          </form>

          {/* Popular routes */}
          <div className="busgo-popular">
            <span className="busgo-popular-label">Popular:</span>
            {popularRoutes.map((r) => (
              <button
                key={`${r.from}-${r.to}`}
                type="button"
                className="busgo-route-pill"
                onClick={() => { setSource(r.from); setDestination(r.to); }}
              >
                {r.from} → {r.to}
              </button>
            ))}
          </div>
        </div>
      </section>
      {/* ── Stats strip ──────────────────────────────────────── */}
      <section className="busgo-stats">
        {[
          { value:"",   label:"Routes covered"   },
          { value:"", label:"Daily schedules"  },
          { value:"",    label:"On-time rate"     },
          { value:"",   label:"Happy travellers" },
        ].map((s) => (
          <div key={s.label} className="busgo-stat">
            <span className="busgo-stat-value">{s.value}</span>
            <span className="busgo-stat-label">{s.label}</span>
          </div>
        ))}
      </section>


      {/* ── Features ─────────────────────────────────────────── */}
      <section className="busgo-features">
        <div className="busgo-features-header">
          <h2 className="busgo-section-title">Why BusGo?</h2>
          <p className="busgo-section-sub">
            Everything you need for a smooth journey, all in one place.
          </p>
        </div>
        <div className="busgo-feature-grid">
          {features.map((f) => (
            <div key={f.title} className="busgo-feature-card">
              <div className="busgo-feature-icon-wrap" style={{ background:f.bg, color:f.accent }}>
                <f.icon size={22} />
              </div>
              <h3 className="busgo-feature-title">{f.title}</h3>
              <p className="busgo-feature-desc">{f.desc}</p>
              <div className="busgo-feature-arrow" style={{ color:f.accent }}>
                <ArrowRight size={16} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
