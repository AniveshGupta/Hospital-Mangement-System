const path = require("path");
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const billingRoutes = require("./routes/billingRoutes");

// Check if .env is loaded
console.log("JWT loaded:", Boolean(process.env.JWT_SECRET));

const app = express();

// Security Middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie Parser
app.use(cookieParser());

// Logger
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Rate Limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

app.use("/api/auth", authLimiter);

// Health Route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "HMS API is running",
    time: new Date(),
  });
});
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Hospital Management System API is running",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/billing", billingRoutes);

// Error Middleware
app.use(notFound);
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `🚀 HMS Server running in ${
          process.env.NODE_ENV || "development"
        } mode on port ${PORT}`
      );
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();