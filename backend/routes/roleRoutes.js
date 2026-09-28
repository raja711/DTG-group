const router = require("express").Router();
const Role = require("../models/Role");
const { auth, permission } = require("../middleware/auth");

router.get("/assignment-options", auth, async (req, res, next) => {
  const isAdministrator = req.user.role?.name === "Administrator";
  const canAssignUserRoles = req.user.role?.permissions?.some(item =>
    item.module === "Users" && (item.add || item.edit)
  );
  if (!isAdministrator && !canAssignUserRoles) {
    return res.status(403).json({ message: "You do not have permission to assign user roles" });
  }

  try {
    const roles = await Role.find().select("name status").sort({ name: 1 });
    res.json(roles);
  } catch (error) {
    next(error);
  }
});

router.get("/", auth, permission("Roles", "view"), async (req, res, next) => {
  try {
    const search = (req.query.search || "").trim();
    const filter = search ? {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ]
    } : {};

    const roles = await Role.find(filter)
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .sort({ createdAt: -1 });

    res.json(roles);
  } catch (error) {
    next(error);
  }
});

router.post("/", auth, permission("Roles", "add"), async (req, res, next) => {
  try {
    const { name, description = "", status = "Active", permissions = [] } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Role name is required" });

    const exists = await Role.findOne({ name: name.trim() });
    if (exists) return res.status(409).json({ message: "Role name already exists" });

    const role = await Role.create({
      name: name.trim(), description, status, permissions,
      createdBy: req.user._id, updatedBy: req.user._id
    });

    const result = await Role.findById(role._id).populate("createdBy", "name").populate("updatedBy", "name");
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", auth, permission("Roles", "edit"), async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    const { name, description, status, permissions } = req.body;
    if (name !== undefined && name.trim() !== role.name) {
      const exists = await Role.findOne({ name: name.trim(), _id: { $ne: role._id } });
      if (exists) return res.status(409).json({ message: "Role name already exists" });
      role.name = name.trim();
    }

    if (description !== undefined) role.description = description;
    if (status !== undefined) role.status = status;
    if (permissions !== undefined) role.permissions = permissions;
    role.updatedBy = req.user._id;

    await role.save();

    const result = await Role.findById(role._id).populate("createdBy", "name").populate("updatedBy", "name");
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", auth, permission("Roles", "delete"), async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    const users = await require("../models/User").countDocuments({ role: role._id });
    if (users > 0) return res.status(400).json({ message: "Cannot delete a role assigned to users" });

    await Role.findByIdAndDelete(req.params.id);
    res.json({ message: "Role deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
