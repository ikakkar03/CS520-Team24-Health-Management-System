import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import Signup from "./pages/Signup";
import AppointmentsList from "./pages/AppointmentsList";
import PatientPrescriptions from "./pages/PatientPrescriptions";
import DoctorPrescriptions from "./pages/DoctorPrescriptions";
import PatientDashboard from "./components/patient/dashboard/Dashboard";
import DoctorDashboard from "./components/doctor/dashboard/Dashboard";
import MessagingPage from "./pages/MessagingPage";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
};

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-10 text-center">Loading…</p>;

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<Signup />} />
      {!user && <Route path="/login" element={<Login />} />}

      {/* Private */}
      {user && (
        <Route path="/*" element={<Layout />}>
          {/* Appointments (shared) */}
          <Route
            path="appointments"
            element={
              <ProtectedRoute>
                <AppointmentsList />
              </ProtectedRoute>
            }
          />

          {/* Prescriptions */}
          <Route
            path="prescriptions"
            element={
              <ProtectedRoute>
                {user.role === "patient" ? (
                  <PatientPrescriptions />
                ) : (
                  <DoctorPrescriptions />
                )}
              </ProtectedRoute>
            }
          />

          {/* Messaging */}
          <Route
            path="messages"
            element={
              <ProtectedRoute>
                <MessagingPage />
              </ProtectedRoute>
            }
          />

          {/* Dashboard */}
          {user.role === "doctor" && (
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
          )}
          {user.role === "patient" && (
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
          )}

          {/* Redirect defaults */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      )}

      {/* Fallback */}
      <Route
        path="*"
        element={<Navigate to={user ? "/dashboard" : "/"} replace />}
      />
    </Routes>
  );
}
