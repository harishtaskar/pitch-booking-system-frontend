import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import Calendar from "./pages/Calendar";
import Login from "./pages/Login";
import MyBookings from "./pages/MyBookings";
import Pitches from "./pages/Pitches";
import Register from "./pages/Register";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={token ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={token ? <Navigate to="/" replace /> : <Register />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Shell>
              <Pitches />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pitches/:pitchId"
        element={
          <ProtectedRoute>
            <Shell>
              <Calendar />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute>
            <Shell>
              <MyBookings />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
