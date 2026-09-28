const router = require("express").Router();
const User = require("../models/User");
const Role = require("../models/Role");
const { auth } = require("../middleware/auth");

router.get("/counts", auth, async (req, res, next) => {
  try {
    const isAdministrator = req.user.role?.name === "Administrator";
    const canViewUsers = isAdministrator || req.user.role?.permissions?.some(item => item.module === "Users" && item.view);
    const canViewRoles = isAdministrator || req.user.role?.permissions?.some(item => item.module === "Roles" && item.view);
    const canViewProjects = isAdministrator || req.user.role?.permissions?.some(item => item.module === "Projects" && item.view);
    const canViewUnits = isAdministrator || req.user.role?.permissions?.some(item => item.module === "Units" && item.view);
    const canViewBookings = isAdministrator || req.user.role?.permissions?.some(item => item.module === "Bookings" && item.view);
    const Project = require("../models/Project");
    const Unit = require("../models/Unit");
    const Booking = require("../models/Booking");
    const [users, roles, projects, units, bookings] = await Promise.all([
      canViewUsers ? User.countDocuments() : null,
      canViewRoles ? Role.countDocuments() : null,
      canViewProjects ? Project.countDocuments() : null,
      canViewUnits ? Unit.countDocuments() : null,
      canViewBookings ? Booking.countDocuments() : null
    ]);
    res.json({ users, roles, projects, units, bookings });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
