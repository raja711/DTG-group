const router = require("express").Router();
const Unit = require("../models/Unit");
const Project = require("../models/Project");
const { auth, permission } = require("../middleware/auth");

router.get("/project-options", auth, async (req, res, next) => {
  try {
    const projects = await Project.find({ isActive: true }).select("_id projectName projectCode").sort({ projectName: 1 });
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

router.get("/", auth, permission("Units", "view"), async (req, res, next) => {
  try {
    const search = (req.query.search || "").trim();
    const filter = search ? {
      $or: [
        { wing: { $regex: search, $options: "i" } },
        { flatNo: { $regex: search, $options: "i" } },
        { unitStatus: { $regex: search, $options: "i" } },
        { configuration: { $regex: search, $options: "i" } }
      ]
    } : {};

    const units = await Unit.find(filter)
      .populate("project", "projectName projectCode")
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .sort({ createdAt: -1 });

    res.json(units);
  } catch (error) {
    next(error);
  }
});

router.post("/", auth, permission("Units", "add"), async (req, res, next) => {
  try {
    const payload = req.body || {};
    const requiredFields = [
      "project",
      "wing",
      "flatNo",
      "floorNo",
      "unitType",
      "configuration",
      "carpetArea",
      "carpetAreaUnit",
      "unitStatus",
      "statusDate",
      "currentPSFBaseRate",
      "currentNetRate",
      "currentAV",
      "priceEffectiveFrom"
    ];

    const missing = requiredFields.filter(field => payload[field] === undefined || payload[field] === "" || payload[field] === null);
    if (missing.length) {
      return res.status(400).json({ message: "Required unit fields are missing" });
    }

    const project = await Project.findById(payload.project);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const unit = await Unit.create({
      ...payload,
      project: project._id,
      floorNo: Number(payload.floorNo),
      carpetArea: Number(payload.carpetArea),
      currentPSFStratum: payload.currentPSFStratum === "" || payload.currentPSFStratum === null || payload.currentPSFStratum === undefined ? null : Number(payload.currentPSFStratum),
      currentPSFBaseRate: Number(payload.currentPSFBaseRate),
      currentNetRate: Number(payload.currentNetRate),
      currentAV: Number(payload.currentAV),
      currentPossessionDevelopmentCharges: payload.currentPossessionDevelopmentCharges === "" || payload.currentPossessionDevelopmentCharges === null || payload.currentPossessionDevelopmentCharges === undefined ? null : Number(payload.currentPossessionDevelopmentCharges),
      currentInternalAmenities: payload.currentInternalAmenities === "" || payload.currentInternalAmenities === null || payload.currentInternalAmenities === undefined ? null : Number(payload.currentInternalAmenities),
      currentCarParkingAmount: payload.currentCarParkingAmount === "" || payload.currentCarParkingAmount === null || payload.currentCarParkingAmount === undefined ? null : Number(payload.currentCarParkingAmount),
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    const result = await Unit.findById(unit._id).populate("project", "projectName projectCode").populate("createdBy", "name").populate("updatedBy", "name");
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", auth, permission("Units", "edit"), async (req, res, next) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) return res.status(404).json({ message: "Unit not found" });

    const update = req.body || {};
    if (update.project !== undefined && update.project) {
      const project = await Project.findById(update.project);
      if (!project) return res.status(404).json({ message: "Project not found" });
      unit.project = project._id;
    }

    const fields = [
      "wing",
      "flatNo",
      "floorNo",
      "unitType",
      "configuration",
      "carpetArea",
      "carpetAreaUnit",
      "unitStatus",
      "statusDate",
      "isActive",
      "parkingAvailable",
      "parkingNo",
      "parkingType",
      "currentPSFStratum",
      "currentPSFBaseRate",
      "currentNetRate",
      "currentAV",
      "currentPossessionDevelopmentCharges",
      "currentInternalAmenities",
      "currentCarParkingAmount",
      "priceEffectiveFrom",
      "remarks"
    ];

    fields.forEach(field => {
      if (update[field] !== undefined) {
        if (["floorNo", "carpetArea", "currentPSFStratum", "currentPSFBaseRate", "currentNetRate", "currentAV", "currentPossessionDevelopmentCharges", "currentInternalAmenities", "currentCarParkingAmount"].includes(field)) {
          unit[field] = update[field] === "" || update[field] === null ? null : Number(update[field]);
          return;
        }

        unit[field] = update[field];
      }
    });

    unit.updatedBy = req.user._id;
    await unit.save();

    const result = await Unit.findById(unit._id).populate("project", "projectName projectCode").populate("createdBy", "name").populate("updatedBy", "name");
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", auth, permission("Units", "delete"), async (req, res, next) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) return res.status(404).json({ message: "Unit not found" });
    await Unit.findByIdAndDelete(req.params.id);
    res.json({ message: "Unit deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
