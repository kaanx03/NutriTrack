// backend/src/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const db = require("./db");

// Route imports
const authRoutes = require("./routes/auth");
const nutritionRoutes = require("./routes/nutrition");
const settingsRoutes = require("./routes/settings");
const userRoutes = require("./routes/user");
const foodRoutes = require("./routes/food");
const activityRoutes = require("./routes/activity");
const activityLogsRoutes = require("./routes/activityLogs");
const articlesRoutes = require("./routes/articles");
const trackerRoutes = require("./routes/tracker");
const insightsRoutes = require("./routes/insights");
const aiRoutes = require("./routes/ai");

const app = express();

// Security headers
app.use(helmet());

// CORS: open in development, restricted in production
const corsOrigin =
  process.env.NODE_ENV === "production"
    ? process.env.CORS_ORIGIN || false
    : true;

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts", message: "Please try again in 15 minutes." },
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many accounts created", message: "Please try again in 1 hour." },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests", message: "Please wait a minute." },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/signup", signupLimiter);
app.use("/api/", generalLimiter);

// Safe request logging — never log body; log only method, path, status
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/activity-logs", activityLogsRoutes);
app.use("/api/articles", articlesRoutes);
app.use("/api/tracker", trackerRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/ai", aiLimiter, aiRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "NutriTrack API is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found", path: req.originalUrl });
});

// Yalnızca doğrudan çalıştırıldığında dinle (supertest app'i import ettiğinde
// portu bağlamasın — testler require("../src/index") ile app'i alır).
if (require.main === module) {
  const port = process.env.PORT || 3001;
  const server = app.listen(port, () => {
    console.log(`🚀 NutriTrack API server running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/api/health`);
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      console.log("HTTP server closed.");
      await db.shutdown();
      process.exit(0);
    });

    // Force exit if shutdown takes too long
    setTimeout(() => {
      console.error("Forced shutdown after timeout.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

module.exports = app;
