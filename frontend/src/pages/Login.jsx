import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import { cn } from "../utils/cn";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", role: "patient" });
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please enter email and password");
      return;
    }
    // Mock login: accept any credentials with selected role
    login({ ...form });
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-sm">
        <h2 className="mb-4 text-center text-2xl font-bold">Sign In</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Login as:</p>
            <div className="flex space-x-2">
              <div 
                className={cn(
                  "flex items-center space-x-2 cursor-pointer",
                  form.role === "patient" && "font-bold"
                )}
                onClick={() => setForm({ ...form, role: "patient" })}
              >
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                <span>Patient</span>
              </div>
              <div 
                className={cn(
                  "flex items-center space-x-2 cursor-pointer",
                  form.role === "doctor" && "font-bold"
                )}
                onClick={() => setForm({ ...form, role: "doctor" })}
              >
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                <span>Doctor</span>
              </div>
            </div>
          </div>
          
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full bg-blue-600 text-white">
            Login
          </Button>
        </form>
      </Card>
    </div>
  );
}