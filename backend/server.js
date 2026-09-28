const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { seedAdmin } = require("./utils/seedAdmin");

dotenv.config();

const app = express();
app.disable("x-powered-by");

const frontendOrigins = new Set((process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean));

app.use(cors({
  origin(origin, callback) {
    const localDevelopmentOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || "");
    if (!origin || localDevelopmentOrigin || frontendOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin not allowed by CORS"));
  }
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "DTG Group Role Management System API is running" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/roles", require("./routes/roleRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/units", require("./routes/unitRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error"
  });
});

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  await seedAdmin();
  app.listen(PORT, () => console.log(`DTG Group API running on port ${PORT}`));
}

start().catch((error) => {
  console.error("Startup failed:", error);
  process.exit(1);
});
