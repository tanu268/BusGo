import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bus, Shield, Clock, ArrowRight, MapPin, Navigation } from "lucide-react";

const Index = () => {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (source.trim() && destination.trim()) {
      navigate(
        `/search?source=${encodeURIComponent(source.trim())}&destination=${encodeURIComponent(destination.trim())}`
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
    { from: "Delhi", to: "Jaipur" },
    { from: "Mumbai", to: "Pune" },
    { from: "Bangalore", to: "Chennai" },
    { from: "Hyderabad", to: "Vizag" },
  ];

  return (
    <div className="busgo-home">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="busgo-hero">
        {/* Background layers */}
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

          {/* Search card */}
          <form onSubmit={handleSearch} className="busgo-search-card">
            <div className="busgo-search-fields">
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
                  onClick={() => {
                    const tmp = source;
                    setSource(destination);
                    setDestination(tmp);
                  }}
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

            <button type="submit" className="busgo-search-btn">
              <Search className="busgo-btn-icon" />
              Search Buses
            </button>
          </form>

          {/* Popular routes */}
          <div className="busgo-popular">
            <span className="busgo-popular-label">Popular:</span>
            {popularRoutes.map((r) => (
              <button
                key={`${r.from}-${r.to}`}
                type="button"
                className="busgo-route-pill"
                onClick={() => {
                  setSource(r.from);
                  setDestination(r.to);
                }}
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
          { value: "500+", label: "Routes covered" },
          { value: "1,200+", label: "Daily schedules" },
          { value: "98%", label: "On-time rate" },
          { value: "50K+", label: "Happy travellers" },
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
              <div
                className="busgo-feature-icon-wrap"
                style={{ background: f.bg, color: f.accent }}
              >
                <f.icon size={22} />
              </div>
              <h3 className="busgo-feature-title">{f.title}</h3>
              <p className="busgo-feature-desc">{f.desc}</p>
              <div className="busgo-feature-arrow" style={{ color: f.accent }}>
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
