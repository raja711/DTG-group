import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { hasPermission } from "../access";
import api from "../api";
import Modal from "../components/Modal";

const modules = ["Users", "Roles", "Projects", "Units", "Bookings"];
const blank = { name: "", description: "", status: "Active", permissions: modules.map(module => ({module, view:false, add:false, edit:false, delete:false})) };

function freshPermissions(source) {
  return modules.map(module => {
    const existing = source?.find(permission => permission.module === module);
    return existing || {module,view:false,add:false,edit:false,delete:false};
  });
}

export default function Roles() {
  const { notify } = useOutletContext();
  const sessionUser = JSON.parse(localStorage.getItem("dtg_user") || "{}");
  const canAddRoles = hasPermission(sessionUser, "Roles", "add");
  const canEditRoles = hasPermission(sessionUser, "Roles", "edit");
  const canDeleteRoles = hasPermission(sessionUser, "Roles", "delete");
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    try { setRoles((await api.get("/roles", {params:{search}})).data); }
    catch(e){ notify("error", e.response?.data?.message || "Unable to load roles"); }
    finally { setLoading(false); }
  }
  useEffect(()=>{load()},[search]);

  function openAdd() {
    setEditing(null); setForm({name:"",description:"",status:"Active",permissions:freshPermissions()}); setError(""); setModal(true);
  }

  function openEdit(role) {
    setEditing(role); setForm({name:role.name,description:role.description,status:role.status,permissions:freshPermissions(role.permissions)}); setError(""); setModal(true);
  }

  function setPermission(index, key) {
    const permissions = form.permissions.map((p,i)=>i===index?{...p,[key]:!p[key]}:p);
    setForm({...form,permissions});
  }

  async function save(e) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Role name is required");
    setSaving(true);
    try {
      if(editing) await api.put(`/roles/${editing._id}`,form); else await api.post("/roles",form);
      setModal(false);
      notify("success", editing ? "Role updated successfully" : "Role created successfully");
      await load();
    } catch(e){ setError(e.response?.data?.message || "Unable to save role"); }
    finally { setSaving(false); }
  }

  async function toggle(role) {
    setBusyId(role._id);
    try {
      await api.put(`/roles/${role._id}`,{status:role.status==="Active"?"Inactive":"Active"});
      notify("success", `Role ${role.status === "Active" ? "deactivated" : "activated"}`);
      await load();
    } catch(e){ notify("error", e.response?.data?.message || "Unable to update status"); }
    finally { setBusyId(null); }
  }

  async function remove(role) {
    if(!window.confirm(`Are you sure you want to delete ${role.name}?`)) return;
    try {
      await api.delete(`/roles/${role._id}`);
      notify("success", "Role deleted successfully");
      await load();
    } catch(e){ notify("error", e.response?.data?.message || "Unable to delete role"); }
  }

  let tableContent;
  if (loading) {
    tableContent = <div className="state">Loading roles...</div>;
  } else if (roles.length === 0) {
    tableContent = <div className="state">No roles found.</div>;
  } else {
    tableContent = (
      <div className="table-scroll"><table><thead><tr><th>ID</th><th>Role Name</th><th>Description</th><th>Status</th><th>Actions</th><th>Created By</th><th>Created At</th><th>Updated By</th><th>Updated At</th></tr></thead>
      <tbody>{roles.map((role,index)=><tr key={role._id}><td>{index + 1}</td><td><strong>{role.name}</strong></td><td>{role.description || "-"}</td>
      <td>{canEditRoles && <button type="button" className={`toggle ${role.status === "Active" ? "on" : ""}`} onClick={()=>toggle(role)} disabled={busyId === role._id} aria-label={`Set ${role.name} ${role.status === "Active" ? "inactive" : "active"}`}><span/></button>} <span className="status-text">{role.status}</span></td>
      <td><div className="actions">{canEditRoles && <button type="button" className="icon-button" onClick={()=>openEdit(role)} title="Edit role" aria-label={`Edit ${role.name}`}><Pencil size={16}/></button>}{canDeleteRoles && <button type="button" className="icon-button danger" onClick={()=>remove(role)} title="Delete role" aria-label={`Delete ${role.name}`}><Trash2 size={16}/></button>}</div></td>
      <td>{role.createdBy?.name || "-"}</td><td>{new Date(role.createdAt).toLocaleString()}</td><td>{role.updatedBy?.name || "-"}</td><td>{new Date(role.updatedAt).toLocaleString()}</td>
      </tr>)}</tbody></table></div>
    );
  }

  let submitLabel = "Create Role";
  if (editing) submitLabel = "Update Role";
  if (saving) submitLabel = "Saving...";

  return (
    <>
      <div className="page-heading">
        <div><h1>Role Master</h1><p>Manage roles, status and permissions.</p></div>
        {canAddRoles && <button type="button" className="primary" onClick={openAdd}><Plus size={18}/> Add Role</button>}
      </div>
      <div className="toolbar"><div className="search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search role..." aria-label="Search roles" /></div></div>
      <div className="table-card">
        {tableContent}
      </div>

      {modal && <Modal title={editing?"Edit Role":"Add Role"} onClose={()=>setModal(false)}>
        <form onSubmit={save}>
          <div className="form-grid">
            <div className="field"><label htmlFor="role-name">Role Name</label><input id="role-name" value={form.name} maxLength={80} required onChange={e=>setForm({...form,name:e.target.value})}/></div>
            <div className="field"><label htmlFor="role-status">Status</label><select id="role-status" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Active</option><option>Inactive</option></select></div>
            <div className="field full-width"><label htmlFor="role-description">Description</label><textarea id="role-description" maxLength={300} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
          </div>
          <div className="permissions">
            <h3>Permissions</h3>
            <div className="permission-head"><span>Module</span><span>View</span><span>Add</span><span>Edit</span><span>Delete</span></div>
            {form.permissions.map((p,i)=><div className="permission-row" key={p.module}><strong>{p.module}</strong>
              {["view","add","edit","delete"].map(k=><label key={k}><input type="checkbox" aria-label={`${p.module} ${k}`} checked={p[k]} onChange={()=>setPermission(i,k)}/></label>)}
            </div>)}
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions"><button type="button" className="secondary" onClick={()=>setModal(false)}>Cancel</button><button type="submit" className="primary" disabled={saving}>{submitLabel}</button></div>
        </form>
      </Modal>}
    </>
  );
}
