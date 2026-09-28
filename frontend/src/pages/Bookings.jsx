import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { hasPermission } from "../access";
import api from "../api";
import Modal from "../components/Modal";

const empty = {
  project: "",
  unit: "",
  newFlatNo: "",
  configuration: "",
  carpetArea: "",
  carpetAreaUnit: "Sq. Ft.",
  bookingDate: "",
  bookingStatus: "Draft",
  clientName: "",
  contactNumber: "",
  emailId: "",
  clientLocation: "",
  sanctionLetterReceived: "No",
  bankName: "",
  fundSource: "Self",
  bankLoanPercentage: "",
  bookingSource: "Direct",
  currentPSFStratum: "",
  currentPSFBaseRate: "",
  currentNetRate: "",
  currentAV: "",
  currentPossessionDevelopmentCharges: "",
  currentInternalAmenities: "",
  currentCarParkingAmount: "",
  bookingPSFStratum: "",
  bookingPSFBaseRate: "",
  bookingNetRate: "",
  bookingAV: "",
  bookingPossessionDevelopmentCharges: "",
  bookingInternalAmenities: "",
  bookingCarParkingAmount: "",
  bookingTotalNetAV: "",
  amountDuePercentage: "",
  amountDue: "",
  oldCollection: "",
  reraCollection: "",
  balance: "",
  receivedPercentage: "",
  dueDate: "",
  dpd: "",
  interest: "",
  disbursementDate: "",
  disbursementAmount: "",
  bankPayout: "",
  gstDue: "",
  gstReceived: "",
  gstPending: "",
  tdsApplicable: false,
  tdsDue: "",
  tdsReceived: "",
  tdsPending: "",
  sdrRegistrationPayment: "",
  scanningChargesDone: false,
  registrationRemarks: "",
  registrationExpectedDate: "",
  registrationDate: "",
  registrationStatus: "Not Started",
  cpFirmName: "",
  cpNameSourcingManager: "",
  brokerage: "",
  cpPaid: "",
  cpDue: "",
  carParking: false,
  carParkingAmount: "",
  carParkingAmountReceived: "",
  dealNoteRemark: "",
  installments: [],
  transactions: []
};

export default function Bookings() {
  const { notify } = useOutletContext();
  const sessionUser = JSON.parse(localStorage.getItem("dtg_user") || "{}");
  const canAddBookings = hasPermission(sessionUser, "Bookings", "add");
  const canEditBookings = hasPermission(sessionUser, "Bookings", "edit");
  const canDeleteBookings = hasPermission(sessionUser, "Bookings", "delete");
  const [bookings, setBookings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [bookingsResponse, optionsResponse] = await Promise.all([
        api.get("/bookings", { params: { search } }),
        api.get("/bookings/project-unit-options")
      ]);
      setBookings(bookingsResponse.data);
      const projectList = Array.isArray(optionsResponse.data?.projects) ? optionsResponse.data.projects : [];
      const unitList = Array.isArray(optionsResponse.data?.units) ? optionsResponse.data.units : [];
      setProjects(projectList);
      setUnits(unitList);
    } catch (e) {
      notify("error", e.response?.data?.message || "Unable to load bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [search]);

  function resetUnitDerivedFields() {
    return {
      unit: "",
      configuration: "",
      carpetArea: "",
      carpetAreaUnit: "Sq. Ft.",
      currentPSFStratum: "",
      currentPSFBaseRate: "",
      currentNetRate: "",
      currentAV: "",
      currentPossessionDevelopmentCharges: "",
      currentInternalAmenities: "",
      currentCarParkingAmount: "",
      bookingPSFStratum: "",
      bookingPSFBaseRate: "",
      bookingNetRate: "",
      bookingAV: "",
      bookingPossessionDevelopmentCharges: "",
      bookingInternalAmenities: "",
      bookingCarParkingAmount: "",
      bookingTotalNetAV: "",
      carParking: false,
      carParkingAmount: "",
      carParkingAmountReceived: ""
    };
  }

  function applySelectedUnit(unitId) {
    const selected = units.find(unit => String(unit._id) === String(unitId));
    const commercialValues = {
      unit: unitId || "",
      configuration: selected?.configuration || "",
      carpetArea: selected?.carpetArea || "",
      carpetAreaUnit: selected?.carpetAreaUnit || "Sq. Ft.",
      currentPSFStratum: selected?.currentPSFStratum ?? "",
      currentPSFBaseRate: selected?.currentPSFBaseRate ?? "",
      currentNetRate: selected?.currentNetRate ?? "",
      currentAV: selected?.currentAV ?? "",
      currentPossessionDevelopmentCharges: selected?.currentPossessionDevelopmentCharges ?? "",
      currentInternalAmenities: selected?.currentInternalAmenities ?? "",
      currentCarParkingAmount: selected?.currentCarParkingAmount ?? "",
      bookingPSFStratum: selected?.currentPSFStratum ?? "",
      bookingPSFBaseRate: selected?.currentPSFBaseRate ?? "",
      bookingNetRate: selected?.currentNetRate ?? "",
      bookingAV: selected?.currentAV ?? "",
      bookingPossessionDevelopmentCharges: selected?.currentPossessionDevelopmentCharges ?? "",
      bookingInternalAmenities: selected?.currentInternalAmenities ?? "",
      bookingCarParkingAmount: selected?.currentCarParkingAmount ?? "",
      bookingTotalNetAV: Number(selected?.currentAV || 0) + Number(selected?.currentCarParkingAmount || 0),
      carParking: Boolean(selected?.parkingAvailable),
      carParkingAmount: selected?.currentCarParkingAmount ?? "",
      carParkingAmountReceived: ""
    };

    setForm(prev => ({ ...prev, ...commercialValues }));
  }

  function resetForm(projectId = "") {
    const defaultProject = projectId || projects[0]?._id || "";
    setForm({
      ...empty,
      ...resetUnitDerivedFields(),
      project: defaultProject,
      bookingDate: new Date().toISOString().slice(0, 10),
      bookingStatus: "Draft",
      sanctionLetterReceived: "No",
      fundSource: "Self",
      bookingSource: "Direct",
      registrationStatus: "Not Started",
      tdsApplicable: false,
      scanningChargesDone: false
    });
  }

  function openAdd() {
    setEditing(null);
    setError("");
    resetForm();
    setModal(true);
  }

  function openEdit(booking) {
    setEditing(booking);
    const bookingUnit = booking.unit || null;
    setForm({
      ...empty,
      project: booking.project?._id || "",
      unit: bookingUnit?._id || "",
      newFlatNo: booking.newFlatNo || "",
      configuration: booking.configuration || "",
      carpetArea: booking.carpetArea || "",
      carpetAreaUnit: booking.carpetAreaUnit || "Sq. Ft.",
      bookingDate: booking.bookingDate ? new Date(booking.bookingDate).toISOString().slice(0,10) : "",
      bookingStatus: booking.bookingStatus || "Draft",
      clientName: booking.clientName || "",
      contactNumber: booking.contactNumber || "",
      emailId: booking.emailId || "",
      clientLocation: booking.clientLocation || "",
      sanctionLetterReceived: booking.sanctionLetterReceived || "No",
      bankName: booking.bankName || "",
      fundSource: booking.fundSource || "Self",
      bankLoanPercentage: booking.bankLoanPercentage ?? "",
      bookingSource: booking.bookingSource || "Direct",
      currentPSFStratum: booking.currentPSFStratum ?? "",
      currentPSFBaseRate: booking.currentPSFBaseRate ?? "",
      currentNetRate: booking.currentNetRate ?? "",
      currentAV: booking.currentAV ?? "",
      currentPossessionDevelopmentCharges: booking.currentPossessionDevelopmentCharges ?? "",
      currentInternalAmenities: booking.currentInternalAmenities ?? "",
      currentCarParkingAmount: booking.currentCarParkingAmount ?? "",
      bookingPSFStratum: booking.bookingPSFStratum ?? "",
      bookingPSFBaseRate: booking.bookingPSFBaseRate ?? "",
      bookingNetRate: booking.bookingNetRate ?? "",
      bookingAV: booking.bookingAV ?? "",
      bookingPossessionDevelopmentCharges: booking.bookingPossessionDevelopmentCharges ?? "",
      bookingInternalAmenities: booking.bookingInternalAmenities ?? "",
      bookingCarParkingAmount: booking.bookingCarParkingAmount ?? "",
      bookingTotalNetAV: booking.bookingTotalNetAV ?? "",
      amountDuePercentage: booking.amountDuePercentage ?? "",
      amountDue: booking.amountDue ?? "",
      oldCollection: booking.oldCollection ?? "",
      reraCollection: booking.reraCollection ?? "",
      balance: booking.balance ?? "",
      receivedPercentage: booking.receivedPercentage ?? "",
      dueDate: booking.dueDate ? new Date(booking.dueDate).toISOString().slice(0,10) : "",
      dpd: booking.dpd ?? "",
      interest: booking.interest ?? "",
      disbursementDate: booking.disbursementDate ? new Date(booking.disbursementDate).toISOString().slice(0,10) : "",
      disbursementAmount: booking.disbursementAmount ?? "",
      bankPayout: booking.bankPayout ?? "",
      gstDue: booking.gstDue ?? "",
      gstReceived: booking.gstReceived ?? "",
      gstPending: booking.gstPending ?? "",
      tdsApplicable: Boolean(booking.tdsApplicable),
      tdsDue: booking.tdsDue ?? "",
      tdsReceived: booking.tdsReceived ?? "",
      tdsPending: booking.tdsPending ?? "",
      sdrRegistrationPayment: booking.sdrRegistrationPayment ?? "",
      scanningChargesDone: Boolean(booking.scanningChargesDone),
      registrationRemarks: booking.registrationRemarks || "",
      registrationExpectedDate: booking.registrationExpectedDate ? new Date(booking.registrationExpectedDate).toISOString().slice(0,10) : "",
      registrationDate: booking.registrationDate ? new Date(booking.registrationDate).toISOString().slice(0,10) : "",
      registrationStatus: booking.registrationStatus || "Not Started",
      cpFirmName: booking.cpFirmName || "",
      cpNameSourcingManager: booking.cpNameSourcingManager || "",
      brokerage: booking.brokerage ?? "",
      cpPaid: booking.cpPaid ?? "",
      cpDue: booking.cpDue ?? "",
      carParking: Boolean(booking.carParking),
      carParkingAmount: booking.carParkingAmount ?? "",
      carParkingAmountReceived: booking.carParkingAmountReceived ?? "",
      dealNoteRemark: booking.dealNoteRemark || "",
      installments: booking.installments || [],
      transactions: booking.transactions || []
    });
    setError("");
    setModal(true);
  }

  async function save(e) {
    e.preventDefault();
    if (!form.project) return setError("Project is required");
    if (!form.unit) return setError("Unit is required");
    if (!form.clientName.trim()) return setError("Client name is required");
    if (!form.contactNumber.trim()) return setError("Contact number is required");
    if (!form.bookingDate) return setError("Booking date is required");

    setSaving(true);
    try {
      if (editing) await api.put(`/bookings/${editing._id}`, form);
      else await api.post("/bookings", form);
      setModal(false);
      notify("success", editing ? "Booking updated successfully" : "Booking created successfully");
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to save booking");
    } finally {
      setSaving(false);
    }
  }

  async function remove(booking) {
    if (!window.confirm(`Are you sure you want to delete ${booking.bookingId}?`)) return;
    try {
      await api.delete(`/bookings/${booking._id}`);
      notify("success", "Booking deleted successfully");
      await load();
    } catch (e) {
      notify("error", e.response?.data?.message || "Unable to delete booking");
    }
  }

  const filteredUnits = units.filter(unit => !form.project || String(unit.project) === String(form.project));

  let tableContent;
  if (loading) {
    tableContent = <div className="state">Loading bookings...</div>;
  } else if (bookings.length === 0) {
    tableContent = <div className="state">No bookings found.</div>;
  } else {
    tableContent = (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Project</th>
              <th>Unit</th>
              <th>Client</th>
              <th>Status</th>
              <th>Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => (
              <tr key={booking._id}>
                <td><strong>{booking.bookingId}</strong></td>
                <td>{booking.project?.projectName || "-"}</td>
                <td>{booking.unit ? `${booking.unit.wing || ""}-${booking.unit.flatNo || ""}` : "-"}</td>
                <td>{booking.clientName}</td>
                <td>{booking.bookingStatus}</td>
                <td>{Number(booking.balance || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                <td>
                  <div className="actions">
                    {canEditBookings && <button type="button" className="icon-button" onClick={() => openEdit(booking)} title="Edit booking"><Pencil size={16} /></button>}
                    {canDeleteBookings && <button type="button" className="icon-button danger" onClick={() => remove(booking)} title="Delete booking"><Trash2 size={16} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const submitLabel = editing ? (saving ? "Saving..." : "Update Booking") : (saving ? "Saving..." : "Create Booking");

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Booking & Sales</h1>
          <p>Capture booking workflow from unit selection through collection, loan and registration.</p>
        </div>
        {canAddBookings && <button type="button" className="primary" onClick={openAdd}><Plus size={18} /> New Booking</button>}
      </div>

      <div className="toolbar">
        <div className="search">
          <Search size={18} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bookings or client..." />
        </div>
      </div>

      <div className="table-card">{tableContent}</div>

      {modal && (
        <Modal title={editing ? "Edit Booking" : "New Booking"} onClose={() => setModal(false)}>
          <form onSubmit={save} className="form-grid">
            <div className="field"><label htmlFor="booking-project">Project</label><select id="booking-project" value={form.project} required onChange={e => { setForm({ ...form, project: e.target.value, unit: "", ...resetUnitDerivedFields() }); }}><option value="">Select project</option>{projects.map(project => <option key={project._id} value={project._id}>{project.projectName}</option>)}</select></div>
            <div className="field"><label htmlFor="booking-unit">Unit</label><select id="booking-unit" value={form.unit} required onChange={e => applySelectedUnit(e.target.value)}><option value="">Select unit</option>{filteredUnits.map(unit => <option key={unit._id} value={unit._id}>{unit.wing} - {unit.flatNo}</option>)}</select></div>
            <div className="field"><label htmlFor="booking-status">Booking Status</label><select id="booking-status" value={form.bookingStatus} onChange={e => setForm({ ...form, bookingStatus: e.target.value })}><option>Draft</option><option>Booked</option><option>Cancelled</option><option>Hold</option><option>Closed</option></select></div>
            <div className="field"><label htmlFor="booking-date">Booking Date</label><input id="booking-date" type="date" value={form.bookingDate} required onChange={e => setForm({ ...form, bookingDate: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-client-name">Client Name</label><input id="booking-client-name" value={form.clientName} required onChange={e => setForm({ ...form, clientName: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-contact">Contact Number</label><input id="booking-contact" value={form.contactNumber} required onChange={e => setForm({ ...form, contactNumber: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-email">Email ID</label><input id="booking-email" type="email" value={form.emailId} onChange={e => setForm({ ...form, emailId: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-location">Client Location</label><input id="booking-location" value={form.clientLocation} onChange={e => setForm({ ...form, clientLocation: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-sanction">Sanction Letter Received</label><select id="booking-sanction" value={form.sanctionLetterReceived} onChange={e => setForm({ ...form, sanctionLetterReceived: e.target.value })}><option>Yes</option><option>No</option></select></div>
            <div className="field"><label htmlFor="booking-bank-name">Bank Name</label><input id="booking-bank-name" value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-fund-source">Fund Source</label><select id="booking-fund-source" value={form.fundSource} onChange={e => setForm({ ...form, fundSource: e.target.value })}><option>Self</option><option>Bank Loan</option><option>Mixed</option><option>Other</option></select></div>
            <div className="field"><label htmlFor="booking-bank-loan">Bank Loan %</label><input id="booking-bank-loan" type="number" min="0" value={form.bankLoanPercentage} onChange={e => setForm({ ...form, bankLoanPercentage: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-source">Booking Source</label><select id="booking-source" value={form.bookingSource} onChange={e => setForm({ ...form, bookingSource: e.target.value })}><option>Direct</option><option>Channel Partner</option><option>Referral</option><option>Digital Marketing</option><option>Existing Customer</option><option>Walk-in</option><option>Other</option></select></div>

            <div className="field"><label>Configuration</label><input value={form.configuration || ""} readOnly /></div>
            <div className="field"><label>Carpet Area</label><input value={form.carpetArea ? `${form.carpetArea} ${form.carpetAreaUnit || "Sq. Ft."}` : ""} readOnly /></div>
            <div className="field"><label>Current PSF Stratum</label><input value={form.currentPSFStratum || ""} readOnly /></div>
            <div className="field"><label>Current PSF Base Rate</label><input value={form.currentPSFBaseRate || ""} readOnly /></div>
            <div className="field"><label>Current Net Rate</label><input value={form.currentNetRate || ""} readOnly /></div>
            <div className="field"><label>Current AV</label><input value={form.currentAV || ""} readOnly /></div>
            <div className="field"><label>Development Charge</label><input value={form.currentPossessionDevelopmentCharges || ""} readOnly /></div>
            <div className="field"><label>Internal Amenities</label><input value={form.currentInternalAmenities || ""} readOnly /></div>
            <div className="field"><label>Current Car Parking</label><input value={form.currentCarParkingAmount || ""} readOnly /></div>
            <div className="field"><label>Booking Total Net AV</label><input value={form.bookingTotalNetAV || ""} readOnly /></div>

            <div className="field"><label htmlFor="booking-amount-due">Amount Due %</label><input id="booking-amount-due" type="number" min="0" value={form.amountDuePercentage} onChange={e => setForm({ ...form, amountDuePercentage: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-old-collection">Old Collection</label><input id="booking-old-collection" type="number" min="0" value={form.oldCollection} onChange={e => setForm({ ...form, oldCollection: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-rera-collection">RERA Collection</label><input id="booking-rera-collection" type="number" min="0" value={form.reraCollection} onChange={e => setForm({ ...form, reraCollection: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-balance">Balance</label><input id="booking-balance" type="number" min="0" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-received-pct">Received %</label><input id="booking-received-pct" type="number" min="0" value={form.receivedPercentage} onChange={e => setForm({ ...form, receivedPercentage: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-due-date">Due Date</label><input id="booking-due-date" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-dpd">DPD</label><input id="booking-dpd" type="number" min="0" value={form.dpd} onChange={e => setForm({ ...form, dpd: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-interest">Interest</label><input id="booking-interest" type="number" min="0" value={form.interest} onChange={e => setForm({ ...form, interest: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-disbursement-date">Disbursement Date</label><input id="booking-disbursement-date" type="date" value={form.disbursementDate} onChange={e => setForm({ ...form, disbursementDate: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-disbursement-amount">Disbursement Amount</label><input id="booking-disbursement-amount" type="number" min="0" value={form.disbursementAmount} onChange={e => setForm({ ...form, disbursementAmount: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-bank-payout">Bank Payout</label><input id="booking-bank-payout" type="number" min="0" value={form.bankPayout} onChange={e => setForm({ ...form, bankPayout: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-gst-due">GST Due</label><input id="booking-gst-due" type="number" min="0" value={form.gstDue} onChange={e => setForm({ ...form, gstDue: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-gst-received">GST Received</label><input id="booking-gst-received" type="number" min="0" value={form.gstReceived} onChange={e => setForm({ ...form, gstReceived: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-gst-pending">GST Pending</label><input id="booking-gst-pending" type="number" min="0" value={form.gstPending} onChange={e => setForm({ ...form, gstPending: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-tds-applicable">TDS Applicable</label><select id="booking-tds-applicable" value={String(form.tdsApplicable)} onChange={e => setForm({ ...form, tdsApplicable: e.target.value === "true" })}><option value="true">Yes</option><option value="false">No</option></select></div>
            <div className="field"><label htmlFor="booking-tds-due">TDS Due</label><input id="booking-tds-due" type="number" min="0" value={form.tdsDue} onChange={e => setForm({ ...form, tdsDue: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-tds-received">TDS Received</label><input id="booking-tds-received" type="number" min="0" value={form.tdsReceived} onChange={e => setForm({ ...form, tdsReceived: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-tds-pending">TDS Pending</label><input id="booking-tds-pending" type="number" min="0" value={form.tdsPending} onChange={e => setForm({ ...form, tdsPending: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-registration-payment">SDR & Registration Payment</label><input id="booking-registration-payment" type="number" min="0" value={form.sdrRegistrationPayment} onChange={e => setForm({ ...form, sdrRegistrationPayment: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-scanning">Scanning Charges Done</label><select id="booking-scanning" value={String(form.scanningChargesDone)} onChange={e => setForm({ ...form, scanningChargesDone: e.target.value === "true" })}><option value="true">Yes</option><option value="false">No</option></select></div>
            <div className="field"><label htmlFor="booking-registration-status">Registration Status</label><select id="booking-registration-status" value={form.registrationStatus} onChange={e => setForm({ ...form, registrationStatus: e.target.value })}><option>Not Started</option><option>Documentation Pending</option><option>Payment Pending</option><option>Registration Scheduled</option><option>Registered</option><option>Cancelled</option></select></div>
            <div className="field"><label htmlFor="booking-registration-expected">Registration Expected Date</label><input id="booking-registration-expected" type="date" value={form.registrationExpectedDate} onChange={e => setForm({ ...form, registrationExpectedDate: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-registration-date">Registration Date</label><input id="booking-registration-date" type="date" value={form.registrationDate} onChange={e => setForm({ ...form, registrationDate: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-cp-firm">CP Firm Name</label><input id="booking-cp-firm" value={form.cpFirmName} onChange={e => setForm({ ...form, cpFirmName: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-cp-name">CP Name / Sourcing Manager</label><input id="booking-cp-name" value={form.cpNameSourcingManager} onChange={e => setForm({ ...form, cpNameSourcingManager: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-brokerage">Brokerage</label><input id="booking-brokerage" type="number" min="0" value={form.brokerage} onChange={e => setForm({ ...form, brokerage: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-cp-paid">CP Paid</label><input id="booking-cp-paid" type="number" min="0" value={form.cpPaid} onChange={e => setForm({ ...form, cpPaid: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-cp-due">CP Due</label><input id="booking-cp-due" type="number" min="0" value={form.cpDue} onChange={e => setForm({ ...form, cpDue: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-car-parking">Car Parking</label><select id="booking-car-parking" value={String(form.carParking)} onChange={e => setForm({ ...form, carParking: e.target.value === "true" })}><option value="true">Yes</option><option value="false">No</option></select></div>
            <div className="field"><label htmlFor="booking-car-parking-amount">Car Parking Amount</label><input id="booking-car-parking-amount" type="number" min="0" value={form.carParkingAmount} onChange={e => setForm({ ...form, carParkingAmount: e.target.value })} /></div>
            <div className="field"><label htmlFor="booking-car-parking-received">Car Parking Amount Received</label><input id="booking-car-parking-received" type="number" min="0" value={form.carParkingAmountReceived} onChange={e => setForm({ ...form, carParkingAmountReceived: e.target.value })} /></div>
            <div className="field full-width"><label htmlFor="booking-registration-remarks">Registration Remarks</label><textarea id="booking-registration-remarks" value={form.registrationRemarks} onChange={e => setForm({ ...form, registrationRemarks: e.target.value })} /></div>
            <div className="field full-width"><label htmlFor="booking-deal-note">Deal Note / Remark</label><textarea id="booking-deal-note" value={form.dealNoteRemark} onChange={e => setForm({ ...form, dealNoteRemark: e.target.value })} /></div>
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
