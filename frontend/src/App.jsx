import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import Signup from "./pages/Signup";
import AppointmentsList from "./pages/AppointmentsList";
import PrescriptionsList from "./pages/PrescriptionsList";
import PatientDashboard from "./components/patient/dashboard/Dashboard";
import DoctorDashboard from "./components/doctor/dashboard/Dashboard";
import PrescriptionPatient from "./components/patient/dashboard/Pescription";
<<<<<<< HEAD
import MessagingPage from "./pages/MessagingPage";
=======
import MessageListDoctor from "./pages/MessageListDoctor";
// import PatientPrescriptions from "./pages/PatientPrescriptions";
// import Profile from "./pages/Profile";
>>>>>>> c24c4e476a58a79ce65dcc97968f6af48b359b01

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
          {/* Shared pages */}
          <Route
            path="appointments"
            element={
              <ProtectedRoute>
                <AppointmentsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="prescriptions"
            element={
              <ProtectedRoute>
                {user.role === "patient" ? <PrescriptionPatient /> : <PrescriptionsList />}
              </ProtectedRoute>
            }
          />
          <Route
            path="messages"
            element={
              <ProtectedRoute>
                <MessagingPage />
              </ProtectedRoute>
            }
          />

          {/* Dashboards */}
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
<<<<<<< HEAD
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
=======
            <>
              <Route path="dashboard" element={<PatientDashboard />} />
              {/* <Route path="doctors" element={<DoctorsList />} /> */}
              <Route path="appointments" element={<AppointmentsList />} />
              <Route path="prescriptions" element={<PrescriptionPatient />} />
              <Route path="messages" element={<MessagesList />} />
              {/* <Route path="my-prescriptions" element={<PatientPrescriptions />} />
              <Route path="profile" element={<Profile />} /> */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
>>>>>>> c24c4e476a58a79ce65dcc97968f6af48b359b01
          )}

          {/* Redirects */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      )}

      {/* Fallback for non-auth’d */}
      <Route
        path="*"
        element={
          <Navigate to={user ? "/dashboard" : "/"} replace />
        }
      />
    </Routes>
  );
}
