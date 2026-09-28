const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  projectCode: { type: String, required: true, unique: true, trim: true, uppercase: true, maxlength: 30 },
  projectName: { type: String, required: true, trim: true, maxlength: 150 },
  projectShortName: { type: String, trim: true, maxlength: 50, default: "" },
  projectType: { type: String, enum: ["Residential", "Commercial", "Mixed"], required: true },
  projectCategory: { type: String, enum: ["Apartment", "Villa", "Plot", "Shop", "Office", "Other"], required: true },
  reraNumber: { type: String, trim: true, maxlength: 50, default: "" },
  reraRegistrationDate: { type: Date, default: null },
  projectAddress: { type: String, required: true, trim: true, maxlength: 500 },
  city: { type: String, required: true, trim: true, maxlength: 100 },
  state: { type: String, required: true, trim: true, maxlength: 100 },
  pincode: { type: String, required: true, trim: true, maxlength: 20 },
  landArea: { type: Number, default: null },
  landAreaUnit: { type: String, enum: ["Sq. Ft.", "Sq. M.", "Acre", "Hectare"], default: null },
  totalWings: { type: Number, required: true, min: 1 },
  totalUnits: { type: Number, required: true, min: 1 },
  totalFloors: { type: Number, required: true, min: 1 },
  projectStartDate: { type: Date, default: null },
  expectedCompletionDate: { type: Date, default: null },
  actualCompletionDate: { type: Date, default: null },
  possessionDate: { type: Date, default: null },
  projectStatus: { type: String, enum: ["Planning", "Ongoing", "Completed", "On Hold"], default: "Planning" },
  salesStatus: { type: String, enum: ["Not Started", "Open", "Closed"], default: "Not Started" },
  isActive: { type: Boolean, default: true },
  description: { type: String, trim: true, default: "" },
  projectWebsite: { type: String, trim: true, default: "" },
  projectEmail: { type: String, trim: true, default: "" },
  projectPhone: { type: String, trim: true, default: "" },
  projectLogo: { type: String, trim: true, default: "" },
  projectImage: { type: String, trim: true, default: "" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);
