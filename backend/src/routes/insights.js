// backend/src/routes/insights.js - Fixed Date Shift Issue
const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Ana insights dashboard - FIXED DATE ALIGNMENT
router.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    console.log(`🔍 Getting insights for user ${userId}`);

    // CRITICAL: Weight verilerini ayrı olarak al - sadece weight_logs tablosundan
    const weightLogsData = await db.query(
      `
      SELECT 
        logged_date as date,
        weight_kg as weight,
        EXTRACT(DAY FROM logged_date) as day_number
      FROM weight_logs 
      WHERE user_id = $1 
      AND logged_date >= '2025-06-19' 
      AND logged_date <= '2025-06-25'
      ORDER BY logged_date ASC
    `,
      [userId]
    );

    console.log("🏋️ Weight logs from DB:", weightLogsData.rows);

    // RAW SQL: Diğer veriler için user_daily_data'dan çek
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

    // FIXED: Chart data'yı düzgün birleştir - DOĞRU DATE ALIGNMENT
    const chartData = [];

    // Tüm günleri oluştur (19-25 Haziran)
    for (let day = 19; day <= 25; day++) {
      const dateStr = `2025-06-${day.toString().padStart(2, "0")}`;

      // O günün daily data'sını bul - 1 GÜN GERİ KAYDIR (DB'den önceki günü al)
      const dailyRecord = rawData.rows.find((row) => {
        const dbDate = new Date(row.date);
        const targetDate = new Date(dateStr);

        // 1 GÜN GERİ KAYDIR - önceki günün verisini bu günde göster
        const adjustedTargetDate = new Date(targetDate);
        adjustedTargetDate.setDate(adjustedTargetDate.getDate() - 1);

        const dbDateStr = dbDate.toISOString().split("T")[0];
        const adjustedTargetDateStr = adjustedTargetDate
          .toISOString()
          .split("T")[0];

        console.log(
          `  🔍 Daily check: DB=${dbDateStr}, Target=${dateStr}, LookingFor=${adjustedTargetDateStr}, Match=${
            dbDateStr === adjustedTargetDateStr
          }`
        );
        return dbDateStr === adjustedTargetDateStr;
      });

      // O günün weight log'unu bul - 1 GÜN GERİ KAYDIR (DB'den önceki günü al)
      const weightRecord = weightLogsData.rows.find((row) => {
        const dbDate = new Date(row.date);
        const targetDate = new Date(dateStr);

        // 1 GÜN GERİ KAYDIR - önceki günün verisini bu günde göster
        const adjustedTargetDate = new Date(targetDate);
        adjustedTargetDate.setDate(adjustedTargetDate.getDate() - 1);

        const dbDateStr = dbDate.toISOString().split("T")[0];
        const adjustedTargetDateStr = adjustedTargetDate
          .toISOString()
          .split("T")[0];

        console.log(
          `  🏋️ Weight check: DB=${dbDateStr}, Target=${dateStr}, LookingFor=${adjustedTargetDateStr}, Match=${
            dbDateStr === adjustedTargetDateStr
          }`
        );
        return dbDateStr === adjustedTargetDateStr;
      });

      console.log(
        `📅 Date ${dateStr} (day ${day}): dailyRecord=${!!dailyRecord}, weightRecord=${!!weightRecord}`
      );

      chartData.push({
        date: dateStr,
        day: day.toString(),
        consumed: dailyRecord ? parseFloat(dailyRecord.calories) || 0 : 0,
        burned: dailyRecord ? parseFloat(dailyRecord.burned) || 0 : 0,
        water: dailyRecord ? parseInt(dailyRecord.water) || 0 : 0,
        weight: weightRecord ? parseFloat(weightRecord.weight) : null, // CRITICAL: null if no weight log
        protein: dailyRecord ? parseFloat(dailyRecord.protein) || 0 : 0,
        carbs: dailyRecord ? parseFloat(dailyRecord.carbs) || 0 : 0,
        fat: dailyRecord ? parseFloat(dailyRecord.fat) || 0 : 0,
      });
    }

    console.log("📈 Final chart data:", chartData);

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
            consumed: d.water, // Su verisi user_daily_data'dan
          })),
          stats: {
            average_consumed: Math.round(
              chartData.reduce((sum, d) => sum + d.water, 0) / chartData.length
            ),
            average_goal: 2500,
          },
        },
        weight: {
          chart: chartData.map((d) => {
            console.log(`🏋️ Weight chart day ${d.day}: weight=${d.weight}`);
            return {
              date: d.date,
              day: d.day,
              weight: d.weight, // FIXED: null if no weight log for that day
            };
          }),
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
      weightNullCount: response.data.weight.chart.filter(
        (item) => item.weight === null
      ).length,
      weightDataCount: response.data.weight.chart.filter(
        (item) => item.weight !== null
      ).length,
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

// Test endpoint - IMPROVED to show both tables
router.get("/test", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Daily data table
    const dailyResult = await db.query(
      `
      SELECT 'daily_data' as source, date, weight_kg, water_consumed, total_calories_consumed 
      FROM user_daily_data 
      WHERE user_id = $1 
      ORDER BY date DESC 
      LIMIT 10
    `,
      [userId]
    );

    // Weight logs table
    const weightResult = await db.query(
      `
      SELECT 'weight_logs' as source, logged_date as date, weight_kg, null as water_consumed, null as total_calories_consumed
      FROM weight_logs 
      WHERE user_id = $1 
      ORDER BY logged_date DESC 
      LIMIT 10
    `,
      [userId]
    );

    res.json({
      success: true,
      message: "Test data comparison",
      data: {
        daily_data: dailyResult.rows,
        weight_logs: weightResult.rows,
        note: "Water from daily_data, Weight from weight_logs ONLY",
      },
      count: {
        daily_data: dailyResult.rows.length,
        weight_logs: weightResult.rows.length,
      },
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
