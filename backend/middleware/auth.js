const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate("role");

    if (!user || user.status !== "Active") {
      return res.status(401).json({ message: "Session is invalid or inactive" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
}

function permission(module, action) {
  return (req, res, next) => {
    if (req.user.role?.name === "Administrator") return next();

    const p = (req.user.role?.permissions || []).find(x => x.module === module);
    if (!p || !p[action]) {
      return res.status(403).json({ message: "You do not have permission to perform this action" });
    }
    next();
  };
}

module.exports = { auth, permission };
