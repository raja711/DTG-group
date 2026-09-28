const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  wing: { type: String, required: true, trim: true, maxlength: 50 },
  flatNo: { type: String, required: true, trim: true, maxlength: 50 },
  floorNo: { type: Number, required: true, min: 0 },
  unitType: { type: String, enum: ["Flat", "Shop", "Office", "Villa", "Plot", "Other"], required: true },
  configuration: { type: String, enum: ["Studio", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK", "Shop", "Office", "Other"], required: true },
  carpetArea: { type: Number, required: true, min: 0 },
  carpetAreaUnit: { type: String, enum: ["Sq. Ft.", "Sq. M."], required: true },
  unitStatus: { type: String, enum: ["Available", "Hold", "Booked", "Sold", "Cancelled"], default: "Available" },
  statusDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  parkingAvailable: { type: Boolean, default: true },
  parkingNo: { type: String, trim: true, maxlength: 50, default: "" },
  parkingType: { type: String, enum: ["Open", "Covered", "Podium", "Stilt", "Basement", "Mechanical", "Other"], default: "Covered" },
  currentPSFStratum: { type: Number, default: null },
  currentPSFBaseRate: { type: Number, required: true, min: 0 },
  currentNetRate: { type: Number, required: true, min: 0 },
  currentAV: { type: Number, required: true, min: 0 },
  currentPossessionDevelopmentCharges: { type: Number, default: null },
  currentInternalAmenities: { type: Number, default: null },
  currentCarParkingAmount: { type: Number, default: null },
  priceEffectiveFrom: { type: Date, required: true },
  remarks: { type: String, trim: true, default: "" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
}, { timestamps: true });

module.exports = mongoose.model("Unit", unitSchema);
