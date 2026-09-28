const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { auth, permission } = require("../middleware/auth");

router.get("/", auth, permission("Users", "view"), async (req, res, next) => {
  try {
    const search = (req.query.search || "").trim();
    const filter = search ? {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ]
    } : {};

    const users = await User.find(filter)
      .populate("role", "name")
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.post("/", auth, permission("Users", "add"), async (req, res, next) => {
  try {
    const { name, email, password, role, status = "Active" } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required" });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name, email: email.toLowerCase().trim(), password: hashed, role, status,
      createdBy: req.user._id, updatedBy: req.user._id
    });

    const result = await User.findById(user._id).populate("role", "name").select("-password");
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", auth, permission("Users", "edit"), async (req, res, next) => {
  try {
    const { name, email, role, status, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (status === "Inactive" && String(user._id) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot deactivate your own account" });
    }
    if (password !== undefined && password !== "" && (typeof password !== "string" || password.length < 8)) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    if (email && email.toLowerCase().trim() !== user.email) {
      const exists = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: user._id } });
      if (exists) return res.status(409).json({ message: "Email already exists" });
      user.email = email.toLowerCase().trim();
    }

    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;
    if (password) user.password = await bcrypt.hash(password, 12);
    user.updatedBy = req.user._id;

    await user.save();

    const result = await User.findById(user._id)
      .populate("role", "name")
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .select("-password");

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", auth, permission("Users", "delete"), async (req, res, next) => {
  try {
    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
