import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { hasPermission } from "../access";
import api from "../api";
import Modal from "../components/Modal";

const empty = {
  projectCode: "",
  projectName: "",
  projectShortName: "",
  projectType: "Residential",
  projectCategory: "Apartment",
  reraNumber: "",
  reraRegistrationDate: "",
  projectAddress: "",
  city: "",
  state: "",
  pincode: "",
  landArea: "",
  landAreaUnit: "Sq. Ft.",
  totalWings: "",
  totalUnits: "",
  totalFloors: "",
  projectStartDate: "",
  expectedCompletionDate: "",
  actualCompletionDate: "",
  possessionDate: "",
  projectStatus: "Planning",
  salesStatus: "Not Started",
  isActive: true,
  description: "",
  projectWebsite: "",
  projectEmail: "",
  projectPhone: "",
  projectLogo: "",
  projectImage: ""
};

export default function Projects() {
  const { notify } = useOutletContext();
  const sessionUser = JSON.parse(localStorage.getItem("dtg_user") || "{}");
  const canAddProjects = hasPermission(sessionUser, "Projects", "add");
  const canEditProjects = hasPermission(sessionUser, "Projects", "edit");
  const canDeleteProjects = hasPermission(sessionUser, "Projects", "delete");
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const response = await api.get("/projects", { params: { search } });
      setProjects(response.data);
    } catch (e) {
      notify("error", e.response?.data?.message || "Unable to load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [search]);

  function openAdd() {
    setEditing(null);
    setForm({ ...empty, projectType: "Residential", projectCategory: "Apartment", projectStatus: "Planning", salesStatus: "Not Started", isActive: true });
    setError("");
    setModal(true);
  }

  function openEdit(project) {
    setEditing(project);
    setForm({
      ...empty,
      ...project,
      projectCode: project.projectCode || "",
      projectShortName: project.projectShortName || "",
      reraRegistrationDate: project.reraRegistrationDate ? new Date(project.reraRegistrationDate).toISOString().slice(0, 10) : "",
      projectAddress: project.projectAddress || "",
      city: project.city || "",
      state: project.state || "",
      pincode: project.pincode || "",
      landArea: project.landArea ?? "",
      landAreaUnit: project.landAreaUnit || "Sq. Ft.",
      totalWings: project.totalWings ?? "",
      totalUnits: project.totalUnits ?? "",
      totalFloors: project.totalFloors ?? "",
      projectStartDate: project.projectStartDate ? new Date(project.projectStartDate).toISOString().slice(0, 10) : "",
      expectedCompletionDate: project.expectedCompletionDate ? new Date(project.expectedCompletionDate).toISOString().slice(0, 10) : "",
      actualCompletionDate: project.actualCompletionDate ? new Date(project.actualCompletionDate).toISOString().slice(0, 10) : "",
      possessionDate: project.possessionDate ? new Date(project.possessionDate).toISOString().slice(0, 10) : "",
      projectStatus: project.projectStatus || "Planning",
      salesStatus: project.salesStatus || "Not Started",
      isActive: Boolean(project.isActive),
      description: project.description || "",
      projectWebsite: project.projectWebsite || "",
      projectEmail: project.projectEmail || "",
      projectPhone: project.projectPhone || "",
      projectLogo: project.projectLogo || "",
      projectImage: project.projectImage || ""
    });
    setError("");
    setModal(true);
  }

  async function save(e) {
    e.preventDefault();

    if (!form.projectCode.trim()) return setError("Project code is required");
    if (!form.projectName.trim()) return setError("Project name is required");
    if (!form.projectAddress.trim()) return setError("Project address is required");
    if (!form.city.trim()) return setError("City is required");
    if (!form.state.trim()) return setError("State is required");
    if (!form.pincode.trim()) return setError("Pincode is required");
    if (!form.totalWings || !form.totalUnits || !form.totalFloors) return setError("Total wings, units and floors are required");

    setSaving(true);
    try {
      if (editing) await api.put(`/projects/${editing._id}`, form);
      else await api.post("/projects", form);
      setModal(false);
      notify("success", editing ? "Project updated successfully" : "Project created successfully");
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to save project");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(project) {
    setBusyId(project._id);
    try {
      await api.put(`/projects/${project._id}`, { isActive: !project.isActive });
      notify("success", `Project ${project.isActive ? "inactivated" : "activated"}`);
      await load();
    } catch (e) {
      notify("error", e.response?.data?.message || "Unable to update project status");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(project) {
    if (!window.confirm(`Are you sure you want to delete ${project.projectName}?`)) return;
    try {
      await api.delete(`/projects/${project._id}`);
      notify("success", "Project deleted successfully");
      await load();
    } catch (e) {
      notify("error", e.response?.data?.message || "Unable to delete project");
    }
  }

  let tableContent;
  if (loading) {
    tableContent = <div className="state">Loading projects...</div>;
  } else if (projects.length === 0) {
    tableContent = <div className="state">No projects found.</div>;
  } else {
    tableContent = (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Project</th>
              <th>Type</th>
              <th>Category</th>
              <th>Status</th>
              <th>Active</th>
              <th>Actions</th>
              <th>Created</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <tr key={project._id}>
                <td><strong>{project.projectCode}</strong></td>
                <td>
                  <div><strong>{project.projectName}</strong></div>
                  <small>{project.projectShortName || "-"}</small>
                </td>
                <td>{project.projectType}</td>
                <td>{project.projectCategory}</td>
                <td>{project.projectStatus}</td>
                <td>
                  {canEditProjects && (
                    <button type="button" className={`toggle ${project.isActive ? "on" : ""}`} onClick={() => toggle(project)} disabled={busyId === project._id} aria-label={`Toggle ${project.projectName}`}>
                      <span />
                    </button>
                  )}
                  <span className="status-text">{project.isActive ? "Active" : "Inactive"}</span>
                </td>
                <td>
                  <div className="actions">
                    {canEditProjects && <button type="button" className="icon-button" onClick={() => openEdit(project)} title="Edit project"><Pencil size={16} /></button>}
                    {canDeleteProjects && <button type="button" className="icon-button danger" onClick={() => remove(project)} title="Delete project"><Trash2 size={16} /></button>}
                  </div>
                </td>
                <td>{project.createdBy?.name || "-"}</td>
                <td>{project.updatedBy?.name || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const submitLabel = editing ? (saving ? "Saving..." : "Update Project") : (saving ? "Saving..." : "Create Project");

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Project Master</h1>
          <p>Maintain project details, configuration and status.</p>
        </div>
        {canAddProjects && <button type="button" className="primary" onClick={openAdd}><Plus size={18} /> Add Project</button>}
      </div>

      <div className="toolbar">
        <div className="search">
          <Search size={18} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search project or city..." />
        </div>
      </div>

      <div className="table-card">{tableContent}</div>

      {modal && (
        <Modal title={editing ? "Edit Project" : "Add Project"} onClose={() => setModal(false)}>
          <form onSubmit={save} className="form-grid">
            <div className="field"><label htmlFor="project-code">Project Code</label><input id="project-code" value={form.projectCode} maxLength={30} required onChange={e => setForm({ ...form, projectCode: e.target.value })} /></div>
            <div className="field"><label htmlFor="project-name">Project Name</label><input id="project-name" value={form.projectName} maxLength={150} required onChange={e => setForm({ ...form, projectName: e.target.value })} /></div>
            <div className="field"><label htmlFor="project-short-name">Short Name</label><input id="project-short-name" value={form.projectShortName} maxLength={50} onChange={e => setForm({ ...form, projectShortName: e.target.value })} /></div>
            <div className="field"><label htmlFor="project-type">Project Type</label><select id="project-type" value={form.projectType} onChange={e => setForm({ ...form, projectType: e.target.value })}><option>Residential</option><option>Commercial</option><option>Mixed</option></select></div>
            <div className="field"><label htmlFor="project-category">Project Category</label><select id="project-category" value={form.projectCategory} onChange={e => setForm({ ...form, projectCategory: e.target.value })}><option>Apartment</option><option>Villa</option><option>Plot</option><option>Shop</option><option>Office</option><option>Other</option></select></div>
            <div className="field"><label htmlFor="project-rera">RERA Number</label><input id="project-rera" value={form.reraNumber} maxLength={50} onChange={e => setForm({ ...form, reraNumber: e.target.value })} /></div>
            <div className="field"><label htmlFor="project-rera-date">RERA Registration Date</label><input id="project-rera-date" type="date" value={form.reraRegistrationDate} onChange={e => setForm({ ...form, reraRegistrationDate: e.target.value })} /></div>
            <div className="field full-width"><label htmlFor="project-address">Project Address</label><textarea id="project-address" value={form.projectAddress} required onChange={e => setForm({ ...form, projectAddress: e.target.value })} /></div>
            <div className="field"><label htmlFor="project-city">City</label><input id="project-city" value={form.city} required onChange={e => setForm({ ...form, city: e.target.value })} /></div>
            <div className="field"><label htmlFor="project-state">State</label><input id="project-state" value={form.state} required onChange={e => setForm({ ...form, state: e.target.value })} /></div>
            <div className="field"><label htmlFor="project-pincode">Pincode</label><input id="project-pincode" value={form.pincode} required onChange={e => setForm({ ...form, pincode: e.target.value })} /></div>
            <div className="field"><label htmlFor="project-land-area">Land Area</label><input id="project-land-area" type="number" min="0" value={form.landArea} onChange={e => setForm({ ...form, landArea: e.target.value })} /></div>
            <div className="field"><label htmlFor="project-land-unit">Land Area Unit</label><select id="project-land-unit" value={form.landAreaUnit} onChange={e => setForm({ ...form, landAreaUnit: e.target.value })}><option>Sq. Ft.</option><option>Sq. M.</option><option>Acre</option><option>Hectare</option></select></div>
            <div className="field"><label htmlFor="project-wings">Total Wings</label><input id="project-wings" type="number" min="1" value={form.totalWings} required onChange={e => setForm({ ...form, totalWings: e.target.value })} /></div>
            <div className="field"><label htmlFor="project-units">Total Units</label><input id="project-units" type="number" min="1" value={form.totalUnits} required onChange={e => setForm({ ...form, totalUnits: e.target.value })} /></div>
            <div className="field"><label htmlFor="project-floors">Total Floors</label><input id="project-floors" type="number" min="1" value={form.totalFloors} required onChange={e => setForm({ ...form, totalFloors: e.target.value })} /></div>
            <div className="field"><label htmlFor="project-start-date">Project Start Date</label><input id="project-start-date" type="date" value={form.projectStartDate} onChange={e => setForm({ ...form, projectStartDate: e.target.value })} /></div>
            <div className="field"><label htmlFor="project-expected">Expected Completion</label><input id="project-expected" type="date" value={form.expectedCompletionDate} onChange={e => setForm({ ...form, expectedCompletionDate: e.target.value })} /></div>
            <div className="field"><label htmlFor="project-actual">Actual Completion</label><input id="project-actual" type="date" value={form.actualCompletionDate} onChange={e => setForm({ ...form, actualCompletionDate: e.target.value })} /></div>
            <div className="field"><label htmlFor="project-possession">Possession Date</label><input id="project-possession" type="date" value={form.possessionDate} onChange={e => setForm({ ...form, possessionDate: e.target.value })} /></div>
            <div className="field"><label htmlFor="project-status">Project Status</label><select id="project-status" value={form.projectStatus} onChange={e => setForm({ ...form, projectStatus: e.target.value })}><option>Planning</option><option>Ongoing</option><option>Completed</option><option>On Hold</option></select></div>
            <div className="field"><label htmlFor="project-sales-status">Sales Status</label><select id="project-sales-status" value={form.salesStatus} onChange={e => setForm({ ...form, salesStatus: e.target.value })}><option>Not Started</option><option>Open</option><option>Closed</option></select></div>
            <div className="field"><label htmlFor="project-active">Active</label><select id="project-active" value={String(form.isActive)} onChange={e => setForm({ ...form, isActive: e.target.value === "true" })}><option value="true">Active</option><option value="false">Inactive</option></select></div>
            <div className="field"><label htmlFor="project-website">Project Website</label><input id="project-website" type="url" value={form.projectWebsite} onChange={e => setForm({ ...form, projectWebsite: e.target.value })} /></div>
            <div className="field"><label htmlFor="project-email">Project Email</label><input id="project-email" type="email" value={form.projectEmail} onChange={e => setForm({ ...form, projectEmail: e.target.value })} /></div>
            <div className="field"><label htmlFor="project-phone">Project Phone</label><input id="project-phone" value={form.projectPhone} onChange={e => setForm({ ...form, projectPhone: e.target.value })} /></div>
            <div className="field"><label htmlFor="project-logo">Project Logo URL</label><input id="project-logo" value={form.projectLogo} onChange={e => setForm({ ...form, projectLogo: e.target.value })} /></div>
            <div className="field"><label htmlFor="project-image">Project Image URL</label><input id="project-image" value={form.projectImage} onChange={e => setForm({ ...form, projectImage: e.target.value })} /></div>
            <div className="field full-width"><label htmlFor="project-description">Description</label><textarea id="project-description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            {error && <div className="form-error full-width">{error}</div>}
            <div className="modal-actions full-width">
              <button type="button" className="secondary" onClick={() => setModal(false)}>Cancel</button>
              <button type="submit" className="primary" disabled={saving}>{submitLabel}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
