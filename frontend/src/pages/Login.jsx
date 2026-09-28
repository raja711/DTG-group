import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!form.email.trim()) return "Email is required";
    if (!form.password) return "Password is required";
    return "";
  }

  async function submit(e) {
    e.preventDefault();
    const validation = validate();
    if (validation) return setError(validation);
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      localStorage.setItem("dtg_token", data.token);
      localStorage.setItem("dtg_user", JSON.stringify(data.user));
      onLogin();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">D</div>
        <div className="login-brand">DTG Groups</div>
        <p className="login-subtitle">Role Management System</p>

        <form onSubmit={submit}>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            required
            value={form.email}
            placeholder="Enter your email"
            onChange={e => setForm({...form, email: e.target.value})}
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            placeholder="Enter your password"
            onChange={e => setForm({...form, password: e.target.value})}
          />

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="primary full" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
