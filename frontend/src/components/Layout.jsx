import { Building2, CreditCard, LayoutDashboard, LogOut, Package2, ShieldCheck, Users } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { hasPermission } from "../access";

export default function Layout({ notify, onSignOut }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("dtg_user") || "{}");

  function signOut() {
    localStorage.removeItem("dtg_token");
    localStorage.removeItem("dtg_user");
    onSignOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">D</div>
          <div>
            <strong>DTG Groups</strong>
            <span>Role Management</span>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
            <LayoutDashboard size={19} /> Dashboard
          </NavLink>
          {hasPermission(user, "Users") && (
            <NavLink to="/users" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <Users size={19} /> User Master
            </NavLink>
          )}
          {hasPermission(user, "Roles") && (
            <NavLink to="/roles" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <ShieldCheck size={19} /> Role Master
            </NavLink>
          )}
          {hasPermission(user, "Projects") && (
            <NavLink to="/projects" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <Building2 size={19} /> Project Master
            </NavLink>
          )}
          {hasPermission(user, "Units") && (
            <NavLink to="/units" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <Package2 size={19} /> Unit Master
            </NavLink>
          )}
          {hasPermission(user, "Bookings") && (
            <NavLink to="/bookings" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <CreditCard size={19} /> Booking & Sales
            </NavLink>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="avatar">{(user.name || "U").charAt(0).toUpperCase()}</div>
            <div>
              <strong>{user.name || "User"}</strong>
              <span>{user.role?.name || "User"}</span>
            </div>
          </div>
          <button className="signout" onClick={signOut}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="topbar-company">DTG Groups</span>
            <span className="topbar-separator">/</span>
            <span>Role Management System</span>
          </div>
          <span className="user-role">{user.role?.name || ""}</span>
        </header>
        <section className="content">
          <Outlet context={{ notify }} />
        </section>
      </main>
    </div>
  );
}
