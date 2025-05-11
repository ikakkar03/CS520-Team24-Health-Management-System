import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";
import { cn } from "../utils/cn";

export default function Sidebar() {
  const { logout, user } = useAuth();

  let navItems = [];
  if (user?.role === "doctor") {
    navItems = [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/appointments', label: 'Appointments' },
      { to: '/prescriptions', label: 'Prescriptions' },
      { to: '/messages', label: 'Messages' },
    ];
  } else if (user?.role === "patient") {
    navItems = [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/appointments', label: 'Appointments' },
      { to: '/prescriptions', label: 'Prescriptions' },
      { to: '/messages', label: 'Messages' },
    ];
  }

  return (
    <aside className="hidden w-64 flex-col bg-white p-4 shadow-lg dark:bg-gray-800 md:flex">
      <h1 className="mb-6 text-3xl font-bold text-blue-600">HMS</h1>
      {navItems.map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          className={({ isActive }) => cn(
            "mb-2 rounded-lg px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-700",
            isActive && "bg-blue-100 font-medium dark:bg-gray-700"
          )}
        >
          {label}
        </Link>
      ))}
      <Button className="mt-auto bg-red-500 text-white" onClick={logout}>
        Logout
      </Button>
    </aside>
  );
}