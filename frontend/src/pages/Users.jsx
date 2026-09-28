import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { hasPermission } from "../access";
import api from "../api";
import Modal from "../components/Modal";

const empty = { name: "", email: "", password: "", role: "", status: "Active" };

export default function Users() {
  const { notify } = useOutletContext();
  const sessionUser = JSON.parse(localStorage.getItem("dtg_user") || "{}");
  const canAddUsers = hasPermission(sessionUser, "Users", "add");
  const canEditUsers = hasPermission(sessionUser, "Users", "edit");
  const canDeleteUsers = hasPermission(sessionUser, "Users", "delete");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [changePassword, setChangePassword] = useState(false);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [userResponse, roleResponse] = await Promise.all([
        api.get("/users", { params: { search } }),
        canAddUsers || canEditUsers
          ? api.get("/roles/assignment-options")
          : Promise.resolve({ data: [] })
      ]);
      setUsers(userResponse.data);
      setRoles(roleResponse.data);
    } catch (e) {
      notify("error", e.response?.data?.message || "Unable to load users");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [search]);

  function openAdd() {
    setEditing(null);
    setChangePassword(false);
    setForm({...empty, role: roles.find(role => role.status === "Active")?._id || roles[0]?._id || ""});
    setError("");
    setModal(true);
  }

  function openEdit(user) {
    setEditing(user);
    setChangePassword(false);
    setForm({ name: user.name, email: user.email, password: "", role: user.role?._id || "", status: user.status });
    setError("");
    setModal(true);
  }

  async function save(e) {
    e.preventDefault();
    if (form.name.trim().length < 2) return setError("Name must be at least 2 characters");
    if (!form.email.trim()) return setError("Email is required");
    if ((!editing || changePassword) && form.password.length < 8) return setError("Password must be at least 8 characters");
    if (!form.role) return setError("Please select a role");

    setSaving(true);
    try {
      if (editing) await api.put(`/users/${editing._id}`, form);
      else await api.post("/users", form);
      setModal(false);
      notify("success", editing ? "User updated successfully" : "User created successfully");
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to save user");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(user) {
    setBusyId(user._id);
    try {
      await api.put(`/users/${user._id}`, { status: user.status === "Active" ? "Inactive" : "Active" });
      notify("success", `User ${user.status === "Active" ? "deactivated" : "activated"}`);
      await load();
    } catch (e) {
      notify("error", e.response?.data?.message || "Unable to update status");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(user) {
    if (!window.confirm(`Are you sure you want to delete ${user.name}?`)) return;
    try {
      await api.delete(`/users/${user._id}`);
      notify("success", "User deleted successfully");
      await load();
    } catch (e) {
      notify("error", e.response?.data?.message || "Unable to delete user");
    }
  }

  let tableContent;
  if (loading) {
    tableContent = <div className="state">Loading users...</div>;
  } else if (users.length === 0) {
    tableContent = <div className="state">No users found.</div>;
  } else {
    tableContent = (
      <div className="table-scroll"><table>
        <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th><th>Created By</th><th>Created At</th><th>Updated By</th><th>Updated At</th></tr></thead>
        <tbody>{users.map((user, index) => {
          const isCurrentUser = String(sessionUser.id) === String(user._id);
          const nextStatus = user.status === "Active" ? "inactive" : "active";
          const statusLabel = isCurrentUser ? "You cannot change your own account status" : `Set ${user.name} ${nextStatus}`;
          return (
            <tr key={user._id}>
              <td>{index + 1}</td><td><strong>{user.name}</strong></td><td>{user.email}</td><td>{user.role?.name || "-"}</td>
              <td>{canEditUsers && <button type="button" className={`toggle ${user.status === "Active" ? "on" : ""}`} onClick={() => toggle(user)} disabled={busyId === user._id || isCurrentUser} title={statusLabel} aria-label={statusLabel}><span/></button>} <span className="status-text">{user.status}</span></td>
              <td><div className="actions">{canEditUsers && <button type="button" className="icon-button" onClick={() => openEdit(user)} title="Edit"><Pencil size={16}/></button>}{canDeleteUsers && <button type="button" className="icon-button danger" onClick={() => remove(user)} title="Delete"><Trash2 size={16}/></button>}</div></td>
              <td>{user.createdBy?.name || "-"}</td><td>{new Date(user.createdAt).toLocaleString()}</td><td>{user.updatedBy?.name || "-"}</td><td>{new Date(user.updatedAt).toLocaleString()}</td>
            </tr>
          );
        })}</tbody>
      </table></div>
    );
  }

  let submitLabel = "Create User";
  if (editing) submitLabel = "Update User";
  if (saving) submitLabel = "Saving...";

  return (
    <>
      <div className="page-heading">
        <div><h1>User Master</h1><p>Manage DTG Group users and role assignments.</p></div>
        {canAddUsers && <button type="button" className="primary" onClick={openAdd}><Plus size={18}/> Add User</button>}
      </div>

      <div className="toolbar">
        <div className="search"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..." /></div>
      </div>

      <div className="table-card">
        {tableContent}
      </div>

      {modal && <Modal title={editing ? "Edit User" : "Add User"} onClose={() => setModal(false)}>
        <form onSubmit={save} className="form-grid">
          <div className="field full-width"><label htmlFor="user-name">Name</label><input id="user-name" value={form.name} maxLength={100} required onChange={e=>setForm({...form,name:e.target.value})} /></div>
          <div className="field"><label htmlFor="user-email">Email</label><input id="user-email" type="email" autoComplete="email" value={form.email} required onChange={e=>setForm({...form,email:e.target.value})} /></div>
          {editing && <div className="field full-width"><label className="checkbox-field" htmlFor="change-user-password"><input id="change-user-password" type="checkbox" checked={changePassword} onChange={e=>{setChangePassword(e.target.checked);if(!e.target.checked)setForm(current=>({...current,password:""}));}} />Change password</label></div>}
          {(!editing || changePassword) && <div className="field"><label htmlFor="user-password">{editing ? "New password" : "Password"}</label><input id="user-password" type="password" autoComplete="new-password" minLength={8} required value={form.password} onChange={e=>setForm({...form,password:e.target.value})} /></div>}
          <div className="field"><label htmlFor="user-role">Role</label><select id="user-role" value={form.role} required onChange={e=>setForm({...form,role:e.target.value})}><option value="">Select role</option>{roles.map(r=><option key={r._id} value={r._id} disabled={r.status === "Inactive" && r._id !== form.role}>{r.name}{r.status === "Inactive" ? " (Inactive)" : ""}</option>)}</select></div>
          <div className="field"><label htmlFor="user-status">Status</label><select id="user-status" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Active</option><option>Inactive</option></select></div>
          {error && <div className="form-error full-width">{error}</div>}
          <div className="modal-actions full-width"><button type="button" className="secondary" onClick={()=>setModal(false)}>Cancel</button><button type="submit" className="primary" disabled={saving}>{submitLabel}</button></div>
        </form>
      </Modal>}
    </>
  );
}
