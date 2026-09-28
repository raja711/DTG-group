import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { hasPermission } from "../access";
import api from "../api";
import Modal from "../components/Modal";

const empty = {
  project: "",
  wing: "",
  flatNo: "",
  floorNo: "",
  unitType: "Flat",
  configuration: "1 BHK",
  carpetArea: "",
  carpetAreaUnit: "Sq. Ft.",
  unitStatus: "Available",
  statusDate: "",
  isActive: true,
  parkingAvailable: true,
  parkingNo: "",
  parkingType: "Covered",
  currentPSFStratum: "",
  currentPSFBaseRate: "",
  currentNetRate: "",
  currentAV: "",
  currentPossessionDevelopmentCharges: "",
  currentInternalAmenities: "",
  currentCarParkingAmount: "",
  priceEffectiveFrom: "",
  remarks: ""
};

export default function Units() {
  const { notify } = useOutletContext();
  const sessionUser = JSON.parse(localStorage.getItem("dtg_user") || "{}");
  const canAddUnits = hasPermission(sessionUser, "Units", "add");
  const canEditUnits = hasPermission(sessionUser, "Units", "edit");
  const canDeleteUnits = hasPermission(sessionUser, "Units", "delete");
  const [units, setUnits] = useState([]);
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
      const [unitResponse, projectResponse] = await Promise.all([
        api.get("/units", { params: { search } }),
        api.get("/units/project-options")
      ]);
      setUnits(unitResponse.data);
      setProjects(projectResponse.data);
    } catch (e) {
      notify("error", e.response?.data?.message || "Unable to load units");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [search]);

  function openAdd() {
    setEditing(null);
    setForm({
      ...empty,
      project: projects[0]?._id || "",
      unitStatus: "Available",
      parkingAvailable: true,
      parkingType: "Covered",
      isActive: true,
      statusDate: new Date().toISOString().slice(0, 10)
    });
    setError("");
    setModal(true);
  }

  function openEdit(unit) {
    setEditing(unit);
    setForm({
      ...empty,
      project: unit.project?._id || "",
      wing: unit.wing || "",
      flatNo: unit.flatNo || "",
      floorNo: unit.floorNo ?? "",
      unitType: unit.unitType || "Flat",
      configuration: unit.configuration || "1 BHK",
      carpetArea: unit.carpetArea ?? "",
      carpetAreaUnit: unit.carpetAreaUnit || "Sq. Ft.",
      unitStatus: unit.unitStatus || "Available",
      statusDate: unit.statusDate ? new Date(unit.statusDate).toISOString().slice(0, 10) : "",
      isActive: Boolean(unit.isActive),
      parkingAvailable: Boolean(unit.parkingAvailable),
      parkingNo: unit.parkingNo || "",
      parkingType: unit.parkingType || "Covered",
      currentPSFStratum: unit.currentPSFStratum ?? "",
      currentPSFBaseRate: unit.currentPSFBaseRate ?? "",
      currentNetRate: unit.currentNetRate ?? "",
      currentAV: unit.currentAV ?? "",
      currentPossessionDevelopmentCharges: unit.currentPossessionDevelopmentCharges ?? "",
      currentInternalAmenities: unit.currentInternalAmenities ?? "",
      currentCarParkingAmount: unit.currentCarParkingAmount ?? "",
      priceEffectiveFrom: unit.priceEffectiveFrom ? new Date(unit.priceEffectiveFrom).toISOString().slice(0, 10) : "",
      remarks: unit.remarks || ""
    });
    setError("");
    setModal(true);
  }

  async function save(e) {
    e.preventDefault();

    if (!form.project) return setError("Project is required");
    if (!form.wing.trim()) return setError("Wing is required");
    if (!form.flatNo.trim()) return setError("Flat number is required");
    if (!form.floorNo && Number(form.floorNo) !== 0) return setError("Floor number is required");
    if (!form.configuration) return setError("Configuration is required");
    if (!form.carpetArea) return setError("Carpet area is required");
    if (!form.statusDate) return setError("Status date is required");
    if (!form.currentPSFBaseRate || !form.currentNetRate || !form.currentAV || !form.priceEffectiveFrom) {
      return setError("PSF base rate, net rate, AV and price effective date are required");
    }

    setSaving(true);
    try {
      if (editing) await api.put(`/units/${editing._id}`, form);
      else await api.post("/units", form);
      setModal(false);
      notify("success", editing ? "Unit updated successfully" : "Unit created successfully");
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to save unit");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(unit) {
    setBusyId(unit._id);
    try {
      await api.put(`/units/${unit._id}`, { isActive: !unit.isActive });
      notify("success", `Unit ${unit.isActive ? "inactivated" : "activated"}`);
      await load();
    } catch (e) {
      notify("error", e.response?.data?.message || "Unable to update unit status");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(unit) {
    if (!window.confirm(`Are you sure you want to delete ${unit.project?.projectName || "unit"} - ${unit.flatNo}?`)) return;
    try {
      await api.delete(`/units/${unit._id}`);
      notify("success", "Unit deleted successfully");
      await load();
    } catch (e) {
      notify("error", e.response?.data?.message || "Unable to delete unit");
    }
  }

  let tableContent;
  if (loading) {
    tableContent = <div className="state">Loading units...</div>;
  } else if (units.length === 0) {
    tableContent = <div className="state">No units found.</div>;
  } else {
    tableContent = (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Wing</th>
              <th>Flat</th>
              <th>Configuration</th>
              <th>Status</th>
              <th>Active</th>
              <th>Actions</th>
              <th>Created</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {units.map(unit => (
              <tr key={unit._id}>
                <td>{unit.project?.projectName || "-"}</td>
                <td>{unit.wing}</td>
                <td><strong>{unit.flatNo}</strong></td>
                <td>{unit.configuration}</td>
                <td>{unit.unitStatus}</td>
                <td>
                  {canEditUnits && (
                    <button type="button" className={`toggle ${unit.isActive ? "on" : ""}`} onClick={() => toggle(unit)} disabled={busyId === unit._id} aria-label={`Toggle ${unit.flatNo}`}>
                      <span />
                    </button>
                  )}
                  <span className="status-text">{unit.isActive ? "Active" : "Inactive"}</span>
                </td>
                <td>
                  <div className="actions">
                    {canEditUnits && <button type="button" className="icon-button" onClick={() => openEdit(unit)} title="Edit unit"><Pencil size={16} /></button>}
                    {canDeleteUnits && <button type="button" className="icon-button danger" onClick={() => remove(unit)} title="Delete unit"><Trash2 size={16} /></button>}
                  </div>
                </td>
                <td>{unit.createdBy?.name || "-"}</td>
                <td>{unit.updatedBy?.name || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const submitLabel = editing ? (saving ? "Saving..." : "Update Unit") : (saving ? "Saving..." : "Create Unit");

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Unit Master</h1>
          <p>Maintain individual units, commercial pricing and status.</p>
        </div>
        {canAddUnits && <button type="button" className="primary" onClick={openAdd}><Plus size={18} /> Add Unit</button>}
      </div>

      <div className="toolbar">
        <div className="search">
          <Search size={18} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search unit status or flat..." />
        </div>
      </div>

      <div className="table-card">{tableContent}</div>

      {modal && (
        <Modal title={editing ? "Edit Unit" : "Add Unit"} onClose={() => setModal(false)}>
          <form onSubmit={save} className="form-grid">
            <div className="field"><label htmlFor="unit-project">Project</label><select id="unit-project" value={form.project} required onChange={e => setForm({ ...form, project: e.target.value })}><option value="">Select project</option>{projects.map(project => <option key={project._id} value={project._id}>{project.projectName}</option>)}</select></div>
            <div className="field"><label htmlFor="unit-wing">Wing</label><input id="unit-wing" value={form.wing} required onChange={e => setForm({ ...form, wing: e.target.value })} /></div>
            <div className="field"><label htmlFor="unit-flat-no">Flat No</label><input id="unit-flat-no" value={form.flatNo} required onChange={e => setForm({ ...form, flatNo: e.target.value })} /></div>
            <div className="field"><label htmlFor="unit-floor-no">Floor No</label><input id="unit-floor-no" type="number" min="0" value={form.floorNo} required onChange={e => setForm({ ...form, floorNo: e.target.value })} /></div>
            <div className="field"><label htmlFor="unit-type">Unit Type</label><select id="unit-type" value={form.unitType} onChange={e => setForm({ ...form, unitType: e.target.value })}><option>Flat</option><option>Shop</option><option>Office</option><option>Villa</option><option>Plot</option><option>Other</option></select></div>
            <div className="field"><label htmlFor="unit-config">Configuration</label><select id="unit-config" value={form.configuration} onChange={e => setForm({ ...form, configuration: e.target.value })}><option>Studio</option><option>1 BHK</option><option>2 BHK</option><option>3 BHK</option><option>4 BHK</option><option>5 BHK</option><option>Shop</option><option>Office</option><option>Other</option></select></div>
            <div className="field"><label htmlFor="unit-carpet-area">Carpet Area</label><input id="unit-carpet-area" type="number" min="0" value={form.carpetArea} required onChange={e => setForm({ ...form, carpetArea: e.target.value })} /></div>
            <div className="field"><label htmlFor="unit-carpet-unit">Carpet Area Unit</label><select id="unit-carpet-unit" value={form.carpetAreaUnit} onChange={e => setForm({ ...form, carpetAreaUnit: e.target.value })}><option>Sq. Ft.</option><option>Sq. M.</option></select></div>
            <div className="field"><label htmlFor="unit-status">Unit Status</label><select id="unit-status" value={form.unitStatus} onChange={e => setForm({ ...form, unitStatus: e.target.value })}><option>Available</option><option>Hold</option><option>Booked</option><option>Sold</option><option>Cancelled</option></select></div>
            <div className="field"><label htmlFor="unit-status-date">Status Date</label><input id="unit-status-date" type="date" value={form.statusDate} required onChange={e => setForm({ ...form, statusDate: e.target.value })} /></div>
            <div className="field"><label htmlFor="unit-active">Active</label><select id="unit-active" value={String(form.isActive)} onChange={e => setForm({ ...form, isActive: e.target.value === "true" })}><option value="true">Active</option><option value="false">Inactive</option></select></div>
            <div className="field"><label htmlFor="unit-parking-available">Parking Available</label><select id="unit-parking-available" value={String(form.parkingAvailable)} onChange={e => setForm({ ...form, parkingAvailable: e.target.value === "true" })}><option value="true">Yes</option><option value="false">No</option></select></div>
            <div className="field"><label htmlFor="unit-parking-no">Parking No</label><input id="unit-parking-no" value={form.parkingNo} onChange={e => setForm({ ...form, parkingNo: e.target.value })} disabled={!form.parkingAvailable} /></div>
            <div className="field"><label htmlFor="unit-parking-type">Parking Type</label><select id="unit-parking-type" value={form.parkingType} onChange={e => setForm({ ...form, parkingType: e.target.value })} disabled={!form.parkingAvailable}><option>Open</option><option>Covered</option><option>Podium</option><option>Stilt</option><option>Basement</option><option>Mechanical</option><option>Other</option></select></div>
            <div className="field"><label htmlFor="unit-psf-stratum">PSF Stratum</label><input id="unit-psf-stratum" type="number" min="0" value={form.currentPSFStratum} onChange={e => setForm({ ...form, currentPSFStratum: e.target.value })} /></div>
            <div className="field"><label htmlFor="unit-psf-base-rate">PSF Base Rate</label><input id="unit-psf-base-rate" type="number" min="0" value={form.currentPSFBaseRate} required onChange={e => setForm({ ...form, currentPSFBaseRate: e.target.value })} /></div>
            <div className="field"><label htmlFor="unit-net-rate">Net Rate</label><input id="unit-net-rate" type="number" min="0" value={form.currentNetRate} required onChange={e => setForm({ ...form, currentNetRate: e.target.value })} /></div>
            <div className="field"><label htmlFor="unit-av">AV</label><input id="unit-av" type="number" min="0" value={form.currentAV} required onChange={e => setForm({ ...form, currentAV: e.target.value })} /></div>
            <div className="field"><label htmlFor="unit-possession-dev">Poss./Dev. Charges</label><input id="unit-possession-dev" type="number" min="0" value={form.currentPossessionDevelopmentCharges} onChange={e => setForm({ ...form, currentPossessionDevelopmentCharges: e.target.value })} /></div>
            <div className="field"><label htmlFor="unit-amenities">Internal Amenities</label><input id="unit-amenities" type="number" min="0" value={form.currentInternalAmenities} onChange={e => setForm({ ...form, currentInternalAmenities: e.target.value })} /></div>
            <div className="field"><label htmlFor="unit-car-parking">Car Parking Amount</label><input id="unit-car-parking" type="number" min="0" value={form.currentCarParkingAmount} onChange={e => setForm({ ...form, currentCarParkingAmount: e.target.value })} /></div>
            <div className="field"><label htmlFor="unit-price-effective">Price Effective From</label><input id="unit-price-effective" type="date" value={form.priceEffectiveFrom} required onChange={e => setForm({ ...form, priceEffectiveFrom: e.target.value })} /></div>
            <div className="field full-width"><label htmlFor="unit-remarks">Remarks</label><textarea id="unit-remarks" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
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
