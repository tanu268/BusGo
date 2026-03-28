import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, ArrowRight, Bus } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

type UserType = {
  username: string;
  email: string;
  is_staff: boolean;
};

interface LoginProps {
  setUser: React.Dispatch<React.SetStateAction<UserType | null>>;
}

export default function Login({ setUser }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/login/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Invalid credentials");
      }

      const data = await response.json();
      setUser(data);

      if (data.is_staff) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Check username/password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .login-page {
          min-height: 100vh;
          background: #050d1a;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: 'Sora', 'Segoe UI', sans-serif;
        }

        /* Background layers matching Index hero */
        .login-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #050d1a 0%, #0a1628 40%, #0d1f3c 100%);
        }
        .login-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .login-glow-left {
          position: absolute;
          left: -200px;
          top: 30%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .login-glow-right {
          position: absolute;
          right: -200px;
          bottom: 10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        /* Card */
        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 40px 36px;
          backdrop-filter: blur(16px);
          box-shadow: 0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(59,130,246,0.1);
          animation: fadeSlideUp 0.5s ease both;
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Logo */
        .login-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 32px;
          justify-content: center;
        }
        .login-logo-icon {
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          border-radius: 10px;
          padding: 6px 8px;
          display: flex;
          align-items: center;
          color: white;
        }
        .login-logo-text {
          font-size: 1.35rem;
          font-weight: 700;
          color: white;
          letter-spacing: -0.5px;
        }

        /* Heading */
        .login-title {
          font-size: 1.6rem;
          font-weight: 700;
          color: #ffffff;
          text-align: center;
          margin-bottom: 6px;
          letter-spacing: -0.5px;
        }
        .login-subtitle {
          text-align: center;
          color: rgba(255,255,255,0.4);
          font-size: 0.85rem;
          margin-bottom: 28px;
        }

        /* Error */
        .login-error {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          color: #f87171;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 0.82rem;
          margin-bottom: 20px;
          text-align: center;
        }

        /* Field */
        .login-field {
          margin-bottom: 16px;
        }
        .login-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          color: rgba(255,255,255,0.55);
          margin-bottom: 7px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .login-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .login-input-icon {
          position: absolute;
          left: 14px;
          color: rgba(255,255,255,0.25);
          width: 16px;
          height: 16px;
          pointer-events: none;
        }
        .login-input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 11px;
          color: #ffffff;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }
        .login-input::placeholder {
          color: rgba(255,255,255,0.2);
        }
        .login-input:focus {
          border-color: rgba(59,130,246,0.6);
          background: rgba(59,130,246,0.07);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
        }

        /* Submit button */
        .login-btn {
          width: 100%;
          margin-top: 8px;
          padding: 13px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          color: white;
          font-size: 0.95rem;
          font-weight: 600;
          border: none;
          border-radius: 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(59,130,246,0.35);
          font-family: inherit;
          letter-spacing: 0.2px;
        }
        .login-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(59,130,246,0.45);
        }
        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Spinner */
        .login-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Footer link */
        .login-footer {
          text-align: center;
          margin-top: 22px;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.35);
        }
        .login-footer a {
          color: #60a5fa;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
        }
        .login-footer a:hover { color: #93c5fd; }
      `}</style>

      <div className="login-page">
        <div className="login-bg" />
        <div className="login-grid" />
        <div className="login-glow-left" />
        <div className="login-glow-right" />

        <form onSubmit={handleLogin} className="login-card">
          {/* Logo */}
          <div className="login-logo">
            <div className="login-logo-icon">
              <Bus size={18} />
            </div>
            <span className="login-logo-text">BusGo</span>
          </div>

          <h2 className="login-title">Welcome back</h2>
          <p className="login-subtitle">Sign in to continue booking your journey</p>

          {error && <div className="login-error">{error}</div>}

          <div className="login-field">
            <label className="login-label">Username</label>
            <div className="login-input-wrap">
              <User className="login-input-icon" />
              <input
                type="text"
                placeholder="Enter your username"
                className="login-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label">Password</label>
            <div className="login-input-wrap">
              <Lock className="login-input-icon" />
              <input
                type="password"
                placeholder="Enter your password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span className="login-spinner" />
            ) : (
              <>
                Login <ArrowRight size={16} />
              </>
            )}
          </button>

          <div className="login-footer">
            Don't have an account?{" "}
            <a href="/signup">Sign up</a>
          </div>
        </form>
      </div>
    </>
  );
}
