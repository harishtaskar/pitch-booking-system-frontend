import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold text-emerald-700">
          🏏 Pitch Booking
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-slate-600 hover:text-slate-900">
            Pitches
          </Link>
          <Link to="/my-bookings" className="text-slate-600 hover:text-slate-900">
            My Bookings
          </Link>
          {user && <span className="text-slate-400">|</span>}
          {user && <span className="font-medium">{user.name}</span>}
          <button
            onClick={handleLogout}
            className="rounded bg-slate-100 px-3 py-1 font-medium text-slate-700 hover:bg-slate-200"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
