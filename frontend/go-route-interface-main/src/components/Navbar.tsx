import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bus, Search, BarChart3, Menu, X, Ticket } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useState } from "react";

type User = {
  username: string;
  email: string;
  is_staff: boolean;
};

interface NavbarProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const links = [
  { to: "/", label: "Home", icon: Bus },
  { to: "/search", label: "Search", icon: Search },
  { to: "/bookings", label: "My Bookings", icon: Ticket },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Navbar({ user, setUser }: NavbarProps) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const logout = async () => {
    await fetch("http://localhost:8000/api/logout/", {
      method: "POST",
      credentials: "include",
    });

    setUser(null); // update state in App.tsx
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          <Bus className="h-5 w-5 text-primary" />
          <span>BusGo</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">

          {/* Links visible only if logged in */}
          {user &&
            links.map((l) => {
              if (l.to === "/analytics" && !user.is_staff) return null;

              const active = location.pathname === l.to;

              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}

            {user?.is_staff && (
  <Link
    to="/admin"
    className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
  >
    Admin
  </Link>
)}

          {/* Login button */}
{!user && (
  <>
    <button
      onClick={() => navigate("/login")}
      className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
    >
      Login
    </button>

    <button
      onClick={() => navigate("/signup")}
      className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
    >
      Sign Up
    </button>
  </>
)}
          {/* Logout button */}
          {user && (
            <button
              onClick={logout}
              className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Logout
            </button>
          )}

          <ThemeToggle />
        </div>

        {/* Mobile toggle */}
        <div className="flex md:hidden items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setOpen(!open)}
            className="p-2 text-muted-foreground hover:text-foreground"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t bg-card px-4 pb-3 pt-1 animate-fade-in">
          {user &&
            links.map((l) => {
              if (l.to === "/analytics" && !user.is_staff) return null;

              const active = location.pathname === l.to;

              return (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}
        </div>
      )}
    </nav>
  );
}