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

const app = express();

app.use(helmet());

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Postman, Render health checks, mobile apps, etc.
    if (!origin) {
      return callback(null, true);
    }

    const isAllowedOrigin = allowedOrigins.includes(origin);

    // Allows Vercel preview deployment domains
    const isVercelDomain =
      origin.startsWith("https://") &&
      origin.endsWith(".vercel.app");

    if (isAllowedOrigin || isVercelDomain) {
      return callback(null, true);
    }

    console.error("Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: "Too many requests. Please try again after 15 minutes.",
  },
});

app.use("/api/auth", authLimiter);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Hospital Management System API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "HMS API is running",
    time: new Date(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/billing", billingRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `HMS Server running in ${
          process.env.NODE_ENV || "development"
        } mode on port ${PORT}`
      );

      console.log("Allowed frontend URL:", process.env.CLIENT_URL);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();