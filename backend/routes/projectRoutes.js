const router = require("express").Router();
const Project = require("../models/Project");
const Unit = require("../models/Unit");
const { auth, permission } = require("../middleware/auth");

router.get("/", auth, permission("Projects", "view"), async (req, res, next) => {
  try {
    const search = (req.query.search || "").trim();
    const filter = search ? {
      $or: [
        { projectCode: { $regex: search, $options: "i" } },
        { projectName: { $regex: search, $options: "i" } },
        { projectShortName: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } }
      ]
    } : {};

    const projects = await Project.find(filter)
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    next(error);
  }
});

router.post("/", auth, permission("Projects", "add"), async (req, res, next) => {
  try {
    const payload = req.body || {};
    const requiredFields = [
      "projectCode",
      "projectName",
      "projectType",
      "projectCategory",
      "projectAddress",
      "city",
      "state",
      "pincode",
      "totalWings",
      "totalUnits",
      "totalFloors"
    ];

    const missing = requiredFields.filter(field => payload[field] === undefined || payload[field] === "" || payload[field] === null);
    if (missing.length) {
      return res.status(400).json({ message: "Required project fields are missing" });
    }

    const exists = await Project.findOne({ projectCode: String(payload.projectCode).trim() });
    if (exists) {
      return res.status(409).json({ message: "Project code already exists" });
    }

    const project = await Project.create({
      ...payload,
      projectCode: String(payload.projectCode).trim(),
      projectName: String(payload.projectName).trim(),
      projectShortName: payload.projectShortName ? String(payload.projectShortName).trim() : "",
      projectAddress: String(payload.projectAddress).trim(),
      city: String(payload.city).trim(),
      state: String(payload.state).trim(),
      pincode: String(payload.pincode).trim(),
      totalWings: Number(payload.totalWings),
      totalUnits: Number(payload.totalUnits),
      totalFloors: Number(payload.totalFloors),
      landArea: payload.landArea !== "" && payload.landArea !== null && payload.landArea !== undefined ? Number(payload.landArea) : null,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    const result = await Project.findById(project._id).populate("createdBy", "name").populate("updatedBy", "name");
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", auth, permission("Projects", "edit"), async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const update = req.body || {};
    if (update.projectCode !== undefined && String(update.projectCode).trim() && String(update.projectCode).trim() !== project.projectCode) {
      const exists = await Project.findOne({ projectCode: String(update.projectCode).trim(), _id: { $ne: project._id } });
      if (exists) return res.status(409).json({ message: "Project code already exists" });
      project.projectCode = String(update.projectCode).trim();
    }

    const fields = [
      "projectName",
      "projectShortName",
      "projectType",
      "projectCategory",
      "reraNumber",
      "reraRegistrationDate",
      "projectAddress",
      "city",
      "state",
      "pincode",
      "landArea",
      "landAreaUnit",
      "totalWings",
      "totalUnits",
      "totalFloors",
      "projectStartDate",
      "expectedCompletionDate",
      "actualCompletionDate",
      "possessionDate",
      "projectStatus",
      "salesStatus",
      "isActive",
      "description",
      "projectWebsite",
      "projectEmail",
      "projectPhone",
      "projectLogo",
      "projectImage"
    ];

    fields.forEach(field => {
      if (update[field] !== undefined) {
        if (field === "landArea") {
          project[field] = update[field] === "" || update[field] === null ? null : Number(update[field]);
          return;
        }

        if (["totalWings", "totalUnits", "totalFloors"].includes(field)) {
          project[field] = Number(update[field]);
          return;
        }

        project[field] = field === "projectName" || field === "projectAddress" || field === "city" || field === "state" || field === "pincode"
          ? String(update[field]).trim()
          : update[field];
      }
    });

    project.updatedBy = req.user._id;
    await project.save();

    const result = await Project.findById(project._id).populate("createdBy", "name").populate("updatedBy", "name");
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", auth, permission("Projects", "delete"), async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const units = await Unit.countDocuments({ project: project._id });
    if (units > 0) return res.status(400).json({ message: "Cannot delete a project that has units" });

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
