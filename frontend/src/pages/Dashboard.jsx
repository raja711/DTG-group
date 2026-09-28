import { Building2, CreditCard, Package2, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { hasPermission } from "../access";
import api from "../api";

export default function Dashboard() {
  const navigate = useNavigate();
  const { notify } = useOutletContext();
  const user = JSON.parse(localStorage.getItem("dtg_user") || "{}");
  const canViewUsers = hasPermission(user, "Users");
  const canViewRoles = hasPermission(user, "Roles");
  const canViewProjects = hasPermission(user, "Projects");
  const canViewUnits = hasPermission(user, "Units");
  const canViewBookings = hasPermission(user, "Bookings");
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canViewUsers && !canViewRoles && !canViewProjects && !canViewUnits && !canViewBookings) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    api.get("/dashboard/counts")
      .then(response => {
        if (active) setCounts(response.data);
      })
      .catch(error => {
        if (active) notify("error", error.response?.data?.message || "Unable to load dashboard totals");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [canViewUsers, canViewRoles, canViewProjects, canViewUnits, canViewBookings]);

  const cards = [];
  if (canViewUsers) cards.push({ label: "User Master", total: counts.users, path: "/users", icon: <Users size={26} /> });
  if (canViewRoles) cards.push({ label: "Role Master", total: counts.roles, path: "/roles", icon: <ShieldCheck size={26} /> });
  if (canViewProjects) cards.push({ label: "Project Master", total: counts.projects, path: "/projects", icon: <Building2 size={26} /> });
  if (canViewUnits) cards.push({ label: "Unit Master", total: counts.units, path: "/units", icon: <Package2 size={26} /> });
  if (canViewBookings) cards.push({ label: "Booking & Sales", total: counts.bookings, path: "/bookings", icon: <CreditCard size={26} /> });

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Manage users, roles, projects, units and bookings for DTG Group.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {cards.map(card => (
          <button key={card.path} className="dashboard-card" onClick={() => navigate(card.path)}>
            <div className="card-icon">{card.icon}</div>
            <div>
              <span>{card.label}</span>
              <strong>{loading ? "—" : (card.total ?? 0).toLocaleString()}</strong>
              <small>
                Total {card.label === "User Master" ? "Users" : card.label === "Role Master" ? "Roles" : card.label === "Project Master" ? "Projects" : card.label === "Unit Master" ? "Units" : "Bookings"}
              </small>
            </div>
          </button>
        ))}
      </div>
      {!loading && cards.length === 0 && <div className="state">No modules are available for your role.</div>}
    </>
  );
}
