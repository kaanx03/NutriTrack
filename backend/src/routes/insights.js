// backend/src/routes/insights.js - Raw SQL Approach
const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Ana insights dashboard - RAW SQL YAKLAŞIMI
router.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    console.log(`🔍 Getting insights for user ${userId}`);

    // RAW SQL: Son 7 günün tüm verilerini direkt çek
    const rawData = await db.query(
      `
      SELECT 
        date,
        total_calories_consumed as calories,
        total_protein_consumed as protein,
        total_carbs_consumed as carbs,
        total_fat_consumed as fat,
        total_calories_burned as burned,
        water_consumed as water,
        weight_kg as weight,
        daily_calorie_goal as calorie_goal,
        daily_water_goal as water_goal,
        EXTRACT(DAY FROM date) as day_number
      FROM user_daily_data 
      WHERE user_id = $1 
      AND date >= '2025-06-19' 
      AND date <= '2025-06-25'
      ORDER BY date ASC
    `,
      [userId]
    );

    console.log("📊 Raw data from DB:", rawData.rows);

    // Direkt chart formatına çevir
    const chartData = rawData.rows.map((row) => ({
      date: row.date,
      day: row.day_number.toString(),
      consumed: parseFloat(row.calories) || 0,
      burned: parseFloat(row.burned) || 0,
      water: parseInt(row.water) || 0,
      weight: parseFloat(row.weight) || 0,
      protein: parseFloat(row.protein) || 0,
      carbs: parseFloat(row.carbs) || 0,
      fat: parseFloat(row.fat) || 0,
    }));

    console.log("📈 Chart data:", chartData);

    // BMI bilgilerini al
    const userInfo = await db.query(
      `
      SELECT u.weight, u.height, dt.goal_weight
      FROM users u 
      LEFT JOIN user_daily_targets dt ON u.id = dt.user_id
      WHERE u.id = $1
    `,
      [userId]
    );

    const user = userInfo.rows[0] || {
      weight: 75,
      height: 175,
      goal_weight: 70,
    };
    const bmi = calculateBMI(user.weight, user.height);

    // Response formatla
    const response = {
      success: true,
      data: {
        period: "weekly",
        dateRange: {
          start: "2025-06-19",
          end: "2025-06-25",
          days: 7,
        },
        calories: {
          chart: chartData.map((d) => ({
            date: d.date,
            day: d.day,
            consumed: d.consumed,
            burned: d.burned,
          })),
          stats: {
            average_consumed: Math.round(
              chartData.reduce((sum, d) => sum + d.consumed, 0) /
                chartData.length
            ),
            average_goal: 2948,
            max_consumed: Math.max(...chartData.map((d) => d.consumed)),
            min_consumed: Math.min(...chartData.map((d) => d.consumed)),
          },
        },
        water: {
          chart: chartData.map((d) => ({
            date: d.date,
            day: d.day,
            consumed: d.water,
          })),
          stats: {
            average_consumed: Math.round(
              chartData.reduce((sum, d) => sum + d.water, 0) / chartData.length
            ),
            average_goal: 2500,
          },
        },
        weight: {
          chart: chartData.map((d) => ({
            date: d.date,
            day: d.day,
            weight: d.weight || user.weight,
          })),
          stats: {
            current: user.weight,
            goal: user.goal_weight,
          },
          goalWeight: user.goal_weight,
        },
        nutrition: {
          chart: chartData.map((d) => {
            const totalCals = d.protein * 4 + d.carbs * 4 + d.fat * 9;
            return {
              date: d.date,
              day: d.day,
              protein:
                totalCals > 0
                  ? Math.round(((d.protein * 4) / totalCals) * 100)
                  : 33,
              carbs:
                totalCals > 0
                  ? Math.round(((d.carbs * 4) / totalCals) * 100)
                  : 34,
              fat:
                totalCals > 0
                  ? Math.round(((d.fat * 9) / totalCals) * 100)
                  : 33,
            };
          }),
          stats: {
            average_protein: Math.round(
              chartData.reduce((sum, d) => sum + d.protein, 0) /
                chartData.length
            ),
            average_carbs: Math.round(
              chartData.reduce((sum, d) => sum + d.carbs, 0) / chartData.length
            ),
            average_fat: Math.round(
              chartData.reduce((sum, d) => sum + d.fat, 0) / chartData.length
            ),
          },
        },
        bmi: {
          current: {
            bmi: Math.round(bmi * 10) / 10,
            category: getBMICategory(bmi),
            weight: user.weight,
            height: user.height,
          },
          goal: {
            bmi: user.goal_weight
              ? Math.round(calculateBMI(user.goal_weight, user.height) * 10) /
                10
              : null,
            weight: user.goal_weight,
            category: user.goal_weight
              ? getBMICategory(calculateBMI(user.goal_weight, user.height))
              : null,
          },
        },
      },
    };

    console.log("✅ Response ready:", {
      calorieChartLength: response.data.calories.chart.length,
      waterChartLength: response.data.water.chart.length,
      weightChartLength: response.data.weight.chart.length,
      nutritionChartLength: response.data.nutrition.chart.length,
    });

    res.json(response);
  } catch (err) {
    console.error("❌ Insights error:", err);
    res.status(500).json({
      success: false,
      error: "Server error",
      details: err.message,
    });
  }
});

// Test endpoint - DB verilerini görmek için
router.get("/test", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const result = await db.query(
      `
      SELECT * FROM user_daily_data 
      WHERE user_id = $1 
      ORDER BY date DESC 
      LIMIT 10
    `,
      [userId]
    );

    res.json({
      success: true,
      message: "Test data",
      data: result.rows,
      count: result.rows.length,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Utility functions
function calculateBMI(weight, height) {
  if (!weight || !height) return 22.5;
  const heightM = height / 100;
  return weight / (heightM * heightM);
}

function getBMICategory(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25.0) return "Normal";
  if (bmi < 30.0) return "Overweight";
  return "Obese";
}

module.exports = router;
