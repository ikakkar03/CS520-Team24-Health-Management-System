import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import DoctorsList from "./pages/DoctorsList";
import PatientsList from "./pages/PatientsList";
import AppointmentsList from "./pages/AppointmentsList";
import PrescriptionsList from "./pages/PrescriptionsList";

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-10 text-center">Loading…</p>;

  return (
    <Routes>
      {/* Public */}
      {!user && <Route path="/login" element={<Login />} />}

      {/* Private: wrap with Layout (which includes Sidebar) */}
      {user && (
        <Route path="/*" element={<Layout />}>          
          <Route path="doctors" element={<DoctorsList />} />
          <Route path="patients" element={<PatientsList />} />
          <Route path="appointments" element={<AppointmentsList />} />
          <Route path="prescriptions" element={<PrescriptionsList />} />
          <Route index element={<Navigate to="doctors" replace />} />
        </Route>
      )}

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? "/doctors" : "/login"} replace />} />
    </Routes>
  );
}