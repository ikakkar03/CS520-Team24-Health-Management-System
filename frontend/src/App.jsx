import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import Signup from "./pages/Signup";
// import DoctorsList from "./pages/DoctorsList";
// import PatientsList from "./pages/PatientsList";
import AppointmentsList from "./pages/AppointmentsList";
import PrescriptionsList from "./pages/PrescriptionsList";
import MessagesList from "./pages/MessagesList";
import PatientDashboard from "./components/patient/dashboard/Dashboard";
import DoctorDashboard from "./components/doctor/dashboard/Dashboard";
import PrescriptionPatient from "./components/patient/dashboard/Pescription";
import MessageListDoctor from "./pages/MessageListDoctor";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  return children;
};

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-10 text-center">Loading…</p>;

  // Helper to get dashboard route by role
  const getDashboardRoute = (role) => {
    if (role === "doctor") return "/dashboard";
    if (role === "patient") return "/dashboard";
    return "/login";
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<Signup />} />
      {!user && <Route path="/login" element={<Login />} />}

      {/* Private: wrap with Layout (which includes Sidebar) */}
      {user && (
        <Route path="/*" element={<Layout />}>          
          {/* Doctor routes */}
          {user.role === "doctor" && (
            <>
              <Route path="dashboard" element={<DoctorDashboard />} />
              {/* <Route path="patients" element={<PatientsList />} /> */}
              <Route path="appointments" element={<AppointmentsList />} />
              <Route path="prescriptions" element={<PrescriptionsList />} />
              <Route path="messages" element={<MessageListDoctor />} />
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          )}
          {/* Patient routes */}
          {user.role === "patient" && (
            <>
              <Route path="dashboard" element={<PatientDashboard />} />
              {/* <Route path="doctors" element={<DoctorsList />} /> */}
              <Route path="appointments" element={<AppointmentsList />} />
              <Route path="prescriptions" element={<PrescriptionPatient />} />
              <Route path="messages" element={<MessagesList />} />
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          )}
        </Route>
      )}

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? getDashboardRoute(user.role) : "/"} replace />} />
    </Routes>
  );
}