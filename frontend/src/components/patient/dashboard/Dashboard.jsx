import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { LogOut } from 'lucide-react';

export default function PatientDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex items-center justify-between p-4 bg-white shadow">
        <h1 className="text-2xl font-bold text-blue-600">HMS</h1>
        <button onClick={logout} className="p-2">
          <LogOut className="h-6 w-6 text-gray-600" />
        </button>
      </header>

      <main className="container mx-auto p-6">
        <h2 className="text-3xl font-semibold mb-6">
          Welcome, {user?.firstName || 'Patient'}
        </h2>

        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
          <Link
            to="/appointments"
            className="group block p-6 bg-blue-50 hover:bg-blue-100 rounded-lg shadow"
          >
            <h3 className="text-xl font-medium text-blue-700 group-hover:underline">
              Upcoming Appointments
            </h3>
            <p className="text-gray-600 mt-2">
              View and manage your scheduled appointments
            </p>
          </Link>

          <Link
            to="/prescriptions"
            className="group block p-6 bg-green-50 hover:bg-green-100 rounded-lg shadow"
          >
            <h3 className="text-xl font-medium text-green-700 group-hover:underline">
              Prescriptions
            </h3>
            <p className="text-gray-600 mt-2">
              Access your current prescriptions
            </p>
          </Link>

          <Link
            to="/messages"
            className="group block p-6 bg-purple-50 hover:bg-purple-100 rounded-lg shadow"
          >
            <h3 className="text-xl font-medium text-purple-700 group-hover:underline">
              Messages
            </h3>
            <p className="text-gray-600 mt-2">
              Communicate with your healthcare providers
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
