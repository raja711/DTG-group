const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Role = require("../models/Role");

const defaultPermissions = [
  { module: "Users", view: true, add: true, edit: true, delete: true },
  { module: "Roles", view: true, add: true, edit: true, delete: true },
  { module: "Projects", view: true, add: true, edit: true, delete: true },
  { module: "Units", view: true, add: true, edit: true, delete: true },
  { module: "Bookings", view: true, add: true, edit: true, delete: true }
];

async function seedAdmin() {
  let role = await Role.findOne({ name: "Administrator" });
  if (!role) {
    role = await Role.create({
      name: "Administrator",
      description: "Full system administrator",
      status: "Active",
      permissions: defaultPermissions
    });
  }

  const email = "admin@dtggroup.com";
  const existing = await User.findOne({ email });

  if (!existing) {
    const password = await bcrypt.hash("Admin@12345", 12);
    await User.create({
      name: "DTG Administrator",
      email,
      password,
      role: role._id,
      status: "Active"
    });
    console.log("Default administrator created: admin@dtggroup.com / Admin@12345");
  }
}

module.exports = { seedAdmin, defaultPermissions };
