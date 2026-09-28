
import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { hasPermission } from "./access";
import Layout from "./components/Layout";
import Bookings from "./pages/Bookings";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Projects from "./pages/Projects";
import Roles from "./pages/Roles";
import Units from "./pages/Units";
import Users from "./pages/Users";

function App() {
  const [toast, setToast] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem("dtg_token")));
  const user = JSON.parse(localStorage.getItem("dtg_user") || "{}");

  function notify(type, message) {
    setToast({ type, message, id: Date.now() });
  }

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={() => setIsAuthenticated(true)} />} />
        <Route path="/" element={isAuthenticated ? <Layout notify={notify} onSignOut={() => setIsAuthenticated(false)} /> : <Navigate to="/login" replace />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={hasPermission(user, "Users") ? <Users /> : <Navigate to="/dashboard" replace />} />
          <Route path="roles" element={hasPermission(user, "Roles") ? <Roles /> : <Navigate to="/dashboard" replace />} />
          <Route path="projects" element={hasPermission(user, "Projects") ? <Projects /> : <Navigate to="/dashboard" replace />} />
          <Route path="units" element={hasPermission(user, "Units") ? <Units /> : <Navigate to="/dashboard" replace />} />
          <Route path="bookings" element={hasPermission(user, "Bookings") ? <Bookings /> : <Navigate to="/dashboard" replace />} />
        </Route>
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
      {toast && (
        <output className={`toast ${toast.type}`} key={toast.id}>
          {toast.message}
        </output>
      )}
    </>
  );
}

export default App;