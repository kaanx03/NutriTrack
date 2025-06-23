// backend/src/index.js - Updated Main Server with Insights Route
require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Route imports
const authRoutes = require("./routes/auth");
const nutritionRoutes = require("./routes/nutrition");
const settingsRoutes = require("./routes/settings");
const userRoutes = require("./routes/user");
const foodRoutes = require("./routes/food");
const activityRoutes = require("./routes/activity");
const activityLogsRoutes = require("./routes/activityLogs"); // Activity logs route
const articlesRoutes = require("./routes/articles");
const trackerRoutes = require("./routes/tracker");
const insightsRoutes = require("./routes/insights"); // NEW: Insights route

const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:19006", "http://10.0.2.2:19006"], // Expo development
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/activity-logs", activityLogsRoutes); // Activity logs endpoint
app.use("/api/articles", articlesRoutes);
app.use("/api/tracker", trackerRoutes);
app.use("/api/insights", insightsRoutes); // NEW: Insights endpoint

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "NutriTrack API is running",
    timestamp: new Date().toISOString(),
    routes: [
      "/api/auth",
      "/api/nutrition",
      "/api/settings",
      "/api/user",
      "/api/food",
      "/api/activity",
      "/api/activity-logs",
      "/api/articles",
      "/api/tracker",
      "/api/insights", // Added to health check
    ],
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`🚀 NutriTrack API server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`🏃 Activity routes available at:`);
  console.log(`   - /api/activity (favorites, custom, search)`);
  console.log(`   - /api/activity-logs (daily logs, CRUD operations)`);
  console.log(`   - /api/nutrition/activity (main activity logging)`);
  console.log(`📈 NEW: Insights routes available at:`);
  console.log(`   - /api/insights/dashboard (complete dashboard data)`);
  console.log(`   - /api/insights/calories (calorie insights)`);
  console.log(`   - /api/insights/weight (weight insights)`);
  console.log(`   - /api/insights/water (water insights)`);
  console.log(`   - /api/insights/nutrition (nutrition breakdown)`);
  console.log(`   - /api/insights/bmi (BMI data & recommendations)`);
});

module.exports = app;
