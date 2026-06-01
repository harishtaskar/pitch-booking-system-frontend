import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import Calendar from "./pages/Calendar";
import Login from "./pages/Login";
import MyBookings from "./pages/MyBookings";
import Pitches from "./pages/Pitches";
import Register from "./pages/Register";

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={token ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/" element={<Protected><Pitches /></Protected>} />
      <Route path="/pitches/:pitchId" element={<Protected><Calendar /></Protected>} />
      <Route path="/my-bookings" element={<Protected><MyBookings /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
