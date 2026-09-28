const router = require("express").Router();
const Booking = require("../models/Booking");
const Unit = require("../models/Unit");
const Project = require("../models/Project");
const { auth, permission } = require("../middleware/auth");

function generateBookingId() {
  return `BK-${String(Date.now()).slice(-6)}`;
}

function calculateBookingTotal(netAv, parkingAmount = 0) {
  return Number(netAv || 0) + Number(parkingAmount || 0);
}

router.get("/", auth, permission("Bookings", "view"), async (req, res, next) => {
  try {
    const search = (req.query.search || "").trim();
    const filter = search ? {
      $or: [
        { bookingId: { $regex: search, $options: "i" } },
        { clientName: { $regex: search, $options: "i" } },
        { contactNumber: { $regex: search, $options: "i" } },
        { bookingStatus: { $regex: search, $options: "i" } }
      ]
    } : {};

    const bookings = await Booking.find(filter)
      .populate("project", "projectName projectCode")
      .populate("unit", "wing flatNo configuration carpetArea carpetAreaUnit currentPSFBaseRate currentNetRate currentAV currentCarParkingAmount parkingAvailable")
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

router.get("/project-unit-options", auth, async (req, res, next) => {
  try {
    const projects = await Project.find({ isActive: true }).select("_id projectName projectCode");
    const units = await Unit.find({ isActive: true }).select("_id project wing flatNo configuration carpetArea carpetAreaUnit unitStatus currentPSFBaseRate currentPSFStratum currentNetRate currentAV currentPossessionDevelopmentCharges currentInternalAmenities currentCarParkingAmount parkingAvailable parkingType");
    res.json({ projects, units });
  } catch (error) {
    next(error);
  }
});

router.post("/", auth, permission("Bookings", "add"), async (req, res, next) => {
  try {
    const payload = req.body || {};
    const requiredFields = [
      "project",
      "unit",
      "bookingDate",
      "clientName",
      "contactNumber",
      "bookingSource",
      "fundSource"
    ];

    const missing = requiredFields.filter(field => payload[field] === undefined || payload[field] === "" || payload[field] === null);
    if (missing.length) {
      return res.status(400).json({ message: "Required booking fields are missing" });
    }

    const project = await Project.findById(payload.project);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const unit = await Unit.findById(payload.unit);
    if (!unit) return res.status(404).json({ message: "Unit not found" });

    const bookingId = generateBookingId();
    const currentAV = Number(unit.currentAV || 0);
    const currentParking = Number(unit.currentCarParkingAmount || 0);
    const bookingTotalNetAV = calculateBookingTotal(currentAV, currentParking);

    const booking = await Booking.create({
      bookingId,
      project: project._id,
      unit: unit._id,
      newFlatNo: payload.newFlatNo || "",
      configuration: unit.configuration,
      carpetArea: unit.carpetArea,
      carpetAreaUnit: unit.carpetAreaUnit,
      bookingDate: payload.bookingDate,
      bookingStatus: payload.bookingStatus || "Draft",
      clientName: payload.clientName,
      contactNumber: payload.contactNumber,
      emailId: payload.emailId || "",
      clientLocation: payload.clientLocation || "",
      sanctionLetterReceived: payload.sanctionLetterReceived || "No",
      bankName: payload.bankName || "",
      fundSource: payload.fundSource || "Self",
      bankLoanPercentage: Number(payload.bankLoanPercentage || 0),
      bookingSource: payload.bookingSource || "Direct",
      currentPSFStratum: Number(unit.currentPSFStratum || 0),
      currentPSFBaseRate: Number(unit.currentPSFBaseRate || 0),
      currentNetRate: Number(unit.currentNetRate || 0),
      currentAV: currentAV,
      currentPossessionDevelopmentCharges: Number(unit.currentPossessionDevelopmentCharges || 0),
      currentInternalAmenities: Number(unit.currentInternalAmenities || 0),
      currentCarParkingAmount: currentParking,
      bookingPSFStratum: Number(unit.currentPSFStratum || 0),
      bookingPSFBaseRate: Number(unit.currentPSFBaseRate || 0),
      bookingNetRate: Number(unit.currentNetRate || 0),
      bookingAV: currentAV,
      bookingPossessionDevelopmentCharges: Number(unit.currentPossessionDevelopmentCharges || 0),
      bookingInternalAmenities: Number(unit.currentInternalAmenities || 0),
      bookingCarParkingAmount: currentParking,
      bookingTotalNetAV: bookingTotalNetAV,
      amountDuePercentage: Number(payload.amountDuePercentage || 0),
      amountDue: Number(payload.amountDue || 0),
      oldCollection: Number(payload.oldCollection || 0),
      reraCollection: Number(payload.reraCollection || 0),
      balance: Number(payload.balance || 0),
      receivedPercentage: Number(payload.receivedPercentage || 0),
      dueDate: payload.dueDate || null,
      dpd: Number(payload.dpd || 0),
      interest: Number(payload.interest || 0),
      disbursementDate: payload.disbursementDate || null,
      disbursementAmount: Number(payload.disbursementAmount || 0),
      bankPayout: Number(payload.bankPayout || 0),
      gstDue: Number(payload.gstDue || 0),
      gstReceived: Number(payload.gstReceived || 0),
      gstPending: Number(payload.gstPending || 0),
      tdsApplicable: Boolean(payload.tdsApplicable),
      tdsDue: Number(payload.tdsDue || 0),
      tdsReceived: Number(payload.tdsReceived || 0),
      tdsPending: Number(payload.tdsPending || 0),
      sdrRegistrationPayment: Number(payload.sdrRegistrationPayment || 0),
      scanningChargesDone: Boolean(payload.scanningChargesDone),
      registrationRemarks: payload.registrationRemarks || "",
      registrationExpectedDate: payload.registrationExpectedDate || null,
      registrationDate: payload.registrationDate || null,
      registrationStatus: payload.registrationStatus || "Not Started",
      cpFirmName: payload.cpFirmName || "",
      cpNameSourcingManager: payload.cpNameSourcingManager || "",
      brokerage: Number(payload.brokerage || 0),
      cpPaid: Number(payload.cpPaid || 0),
      cpDue: Number(payload.cpDue || 0),
      carParking: Boolean(unit.parkingAvailable),
      carParkingAmount: currentParking,
      carParkingAmountReceived: Number(payload.carParkingAmountReceived || 0),
      dealNoteRemark: payload.dealNoteRemark || "",
      installments: Array.isArray(payload.installments) ? payload.installments : [],
      transactions: Array.isArray(payload.transactions) ? payload.transactions : [],
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    const result = await Booking.findById(booking._id)
      .populate("project", "projectName projectCode")
      .populate("unit", "wing flatNo configuration carpetArea carpetAreaUnit")
      .populate("createdBy", "name")
      .populate("updatedBy", "name");

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", auth, permission("Bookings", "edit"), async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const update = req.body || {};
    const fields = [
      "project",
      "unit",
      "newFlatNo",
      "bookingDate",
      "bookingStatus",
      "clientName",
      "contactNumber",
      "emailId",
      "clientLocation",
      "sanctionLetterReceived",
      "bankName",
      "fundSource",
      "bankLoanPercentage",
      "bookingSource",
      "amountDuePercentage",
      "amountDue",
      "oldCollection",
      "reraCollection",
      "balance",
      "receivedPercentage",
      "dueDate",
      "dpd",
      "interest",
      "disbursementDate",
      "disbursementAmount",
      "bankPayout",
      "gstDue",
      "gstReceived",
      "gstPending",
      "tdsApplicable",
      "tdsDue",
      "tdsReceived",
      "tdsPending",
      "sdrRegistrationPayment",
      "scanningChargesDone",
      "registrationRemarks",
      "registrationExpectedDate",
      "registrationDate",
      "registrationStatus",
      "cpFirmName",
      "cpNameSourcingManager",
      "brokerage",
      "cpPaid",
      "cpDue",
      "carParking",
      "carParkingAmount",
      "carParkingAmountReceived",
      "dealNoteRemark",
      "installments",
      "transactions"
    ];

    fields.forEach(field => {
      if (update[field] !== undefined) {
        booking[field] = update[field];
      }
    });

    if (update.unit !== undefined && update.unit) {
      const unit = await Unit.findById(update.unit);
      if (!unit) return res.status(404).json({ message: "Unit not found" });
      booking.configuration = unit.configuration;
      booking.carpetArea = unit.carpetArea;
      booking.carpetAreaUnit = unit.carpetAreaUnit;
      booking.currentPSFStratum = Number(unit.currentPSFStratum || 0);
      booking.currentPSFBaseRate = Number(unit.currentPSFBaseRate || 0);
      booking.currentNetRate = Number(unit.currentNetRate || 0);
      booking.currentAV = Number(unit.currentAV || 0);
      booking.currentPossessionDevelopmentCharges = Number(unit.currentPossessionDevelopmentCharges || 0);
      booking.currentInternalAmenities = Number(unit.currentInternalAmenities || 0);
      booking.currentCarParkingAmount = Number(unit.currentCarParkingAmount || 0);
      booking.bookingPSFStratum = Number(unit.currentPSFStratum || 0);
      booking.bookingPSFBaseRate = Number(unit.currentPSFBaseRate || 0);
      booking.bookingNetRate = Number(unit.currentNetRate || 0);
      booking.bookingAV = Number(unit.currentAV || 0);
      booking.bookingPossessionDevelopmentCharges = Number(unit.currentPossessionDevelopmentCharges || 0);
      booking.bookingInternalAmenities = Number(unit.currentInternalAmenities || 0);
      booking.bookingCarParkingAmount = Number(unit.currentCarParkingAmount || 0);
      booking.bookingTotalNetAV = calculateBookingTotal(booking.bookingAV, booking.bookingCarParkingAmount);
      booking.carParking = Boolean(unit.parkingAvailable);
      booking.carParkingAmount = Number(unit.currentCarParkingAmount || 0);
    }

    booking.updatedBy = req.user._id;
    await booking.save();

    const result = await Booking.findById(booking._id)
      .populate("project", "projectName projectCode")
      .populate("unit", "wing flatNo configuration carpetArea carpetAreaUnit")
      .populate("createdBy", "name")
      .populate("updatedBy", "name");

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", auth, permission("Bookings", "delete"), async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
