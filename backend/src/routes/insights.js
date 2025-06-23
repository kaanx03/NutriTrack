// backend/src/routes/insights.js - COMPLETE HARMONIZED VERSION
const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// ===============================
// INSIGHTS DASHBOARD DATA
// ===============================

// Ana insights dashboard verilerini al
router.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { period = "weekly", startDate, endDate } = req.query;

    console.log(
      `Getting insights dashboard for user ${userId}, period: ${period}`
    );

    // Tarih aralığını hesapla
    const dateRange = calculateDateRange(period, startDate, endDate);
    console.log("Date range:", dateRange);

    // Paralel olarak tüm verileri al
    const [
      calorieData,
      weightData,
      waterData,
      nutritionData,
      bmiData,
      summaryData,
    ] = await Promise.all([
      getCalorieInsights(userId, dateRange, period),
      getWeightInsights(userId, dateRange, period),
      getWaterInsights(userId, dateRange, period),
      getNutritionInsights(userId, dateRange, period),
      getBMIInsights(userId),
      getSummaryData(userId, dateRange),
    ]);

    console.log("All data fetched successfully");

    res.json({
      success: true,
      data: {
        period: period,
        dateRange: dateRange,
        calories: calorieData,
        weight: weightData,
        water: waterData,
        nutrition: nutritionData,
        bmi: bmiData,
        summary: summaryData,
      },
    });
  } catch (err) {
    console.error("Get insights dashboard error:", err);
    res.status(500).json({
      success: false,
      error: "Server error",
      details: err.message,
    });
  }
});

// ===============================
// HELPER FUNCTIONS - UPDATED WITH TODAY'S DATA FIX
// ===============================

// Tarih aralığını hesapla
function calculateDateRange(period, startDate, endDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day

  if (startDate && endDate) {
    return {
      start: startDate,
      end: endDate,
      days:
        Math.ceil(
          (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
        ) + 1,
    };
  }

  let days;
  switch (period.toLowerCase()) {
    case "weekly":
      days = 7;
      break;
    case "monthly":
      days = 30;
      break;
    case "yearly":
      days = 365;
      break;
    default:
      days = 7;
  }

  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));

  return {
    start: start.toISOString().split("T")[0],
    end: today.toISOString().split("T")[0],
    days: days,
  };
}

// Kalori insights verilerini al - UPDATED WITH TODAY'S DATA FIX
async function getCalorieInsights(userId, dateRange, period) {
  try {
    console.log(
      "Fetching calorie insights for user:",
      userId,
      "range:",
      dateRange
    );

    // user_daily_data tablosundan veri al
    const dailyData = await db.query(
      `SELECT date, 
              COALESCE(total_calories_consumed, 0) as consumed,
              COALESCE(total_calories_burned, 0) as burned,
              COALESCE(daily_calorie_goal, 2000) as goal
       FROM user_daily_data 
       WHERE user_id = $1 AND date BETWEEN $2 AND $3
       ORDER BY date ASC`,
      [userId, dateRange.start, dateRange.end]
    );

    console.log("Raw calorie query result:", dailyData.rows);

    // Eksik günleri doldur
    const filledData = fillMissingDates(dailyData.rows, dateRange, {
      consumed: 0,
      burned: 0,
      goal: 2000,
    });

    // BUGÜN TARİHİ İÇİN GERÇEK VERİLERİ ÇEK
    const today = new Date().toISOString().split("T")[0];
    const todayIndex = filledData.findIndex((item) => item.date === today);

    if (todayIndex !== -1) {
      console.log(
        "Today's date found in range, fetching real data for:",
        today
      );

      // Bugünün gerçek food_entries verilerini al
      const todayFoodData = await db.query(
        `SELECT 
           COALESCE(SUM(total_calories), 0) as total_calories_consumed,
           COALESCE(SUM(total_protein), 0) as total_protein_consumed,
           COALESCE(SUM(total_carbs), 0) as total_carbs_consumed,
           COALESCE(SUM(total_fat), 0) as total_fat_consumed
         FROM food_entries 
         WHERE user_id = $1 AND entry_date = $2`,
        [userId, today]
      );

      // Bugünün gerçek activity verilerini al
      const todayActivityData = await db.query(
        `SELECT COALESCE(SUM(calories_burned), 0) as total_calories_burned
         FROM activity_logs 
         WHERE user_id = $1 AND entry_date = $2`,
        [userId, today]
      );

      // Bugünün verilerini güncelle
      if (todayFoodData.rows[0]) {
        filledData[todayIndex].consumed =
          parseFloat(todayFoodData.rows[0].total_calories_consumed) || 0;
      }

      if (todayActivityData.rows[0]) {
        filledData[todayIndex].burned =
          parseFloat(todayActivityData.rows[0].total_calories_burned) || 0;
      }

      console.log("Updated today's calorie data:", filledData[todayIndex]);
    }

    // İstatistikleri hesapla
    const stats = calculateCalorieStats(filledData);

    return {
      period: period,
      dateRange: dateRange,
      daily: filledData,
      stats: stats,
      chart: formatChartData(filledData, ["consumed", "burned"], period),
    };
  } catch (err) {
    console.error("Get calorie insights error:", err);
    throw err;
  }
}

// Weight insights verilerini al - ORIGINAL VERSION (no changes needed for today's data)
async function getWeightInsights(userId, dateRange, period) {
  try {
    console.log("Fetching weight insights for user:", userId);

    // Weight logs'dan veri al
    const weightLogs = await db.query(
      `SELECT logged_date as date, weight_kg as weight, bmi 
       FROM weight_logs 
       WHERE user_id = $1 AND logged_date BETWEEN $2 AND $3
       ORDER BY logged_date ASC`,
      [userId, dateRange.start, dateRange.end]
    );

    // User bilgilerini al (current weight ve goal)
    const userInfo = await db.query(
      `SELECT u.weight as current_weight, u.height,
              dt.goal_weight
       FROM users u 
       LEFT JOIN user_daily_targets dt ON u.id = dt.user_id
       WHERE u.id = $1`,
      [userId]
    );

    const userWeight = userInfo.rows[0] || {
      current_weight: 75,
      height: 175,
      goal_weight: 70,
    };

    console.log("Weight logs:", weightLogs.rows.length, "entries");
    console.log("User weight info:", userWeight);

    // Weight verilerini günlük formatla doldur
    const filledData = fillMissingDates(weightLogs.rows, dateRange, {
      weight: userWeight.current_weight,
      bmi: calculateBMI(userWeight.current_weight, userWeight.height),
    });

    // Weight istatistikleri
    const stats = calculateWeightStats(filledData, userWeight);

    return {
      period: period,
      dateRange: dateRange,
      daily: filledData,
      stats: stats,
      currentWeight: userWeight.current_weight,
      goalWeight: userWeight.goal_weight,
      chart: formatChartData(filledData, ["weight"], period),
    };
  } catch (err) {
    console.error("Get weight insights error:", err);
    throw err;
  }
}

// Water insights verilerini al - UPDATED WITH TODAY'S DATA FIX
async function getWaterInsights(userId, dateRange, period) {
  try {
    console.log("Fetching water insights for user:", userId);

    const dailyData = await db.query(
      `SELECT date, 
              COALESCE(water_consumed, 0) as consumed,
              COALESCE(daily_water_goal, 2500) as goal
       FROM user_daily_data 
       WHERE user_id = $1 AND date BETWEEN $2 AND $3
       ORDER BY date ASC`,
      [userId, dateRange.start, dateRange.end]
    );

    console.log("Raw water query result:", dailyData.rows);

    // Eksik günleri doldur
    const filledData = fillMissingDates(dailyData.rows, dateRange, {
      consumed: 0,
      goal: 2500,
    });

    // BUGÜN TARİHİ İÇİN GERÇEK VERİLERİ ÇEK
    const today = new Date().toISOString().split("T")[0];
    const todayIndex = filledData.findIndex((item) => item.date === today);

    if (todayIndex !== -1) {
      console.log("Today's date found, fetching real water data for:", today);

      // Bugünün gerçek water_logs verilerini al
      const todayWaterData = await db.query(
        `SELECT COALESCE(SUM(amount_ml), 0) as total_water_consumed
         FROM water_logs 
         WHERE user_id = $1 AND entry_date = $2`,
        [userId, today]
      );

      // Bugünün verilerini güncelle
      if (todayWaterData.rows[0]) {
        filledData[todayIndex].consumed =
          parseInt(todayWaterData.rows[0].total_water_consumed) || 0;
      }

      console.log("Updated today's water data:", filledData[todayIndex]);
    }

    // Su istatistikleri
    const stats = calculateWaterStats(filledData);

    return {
      period: period,
      dateRange: dateRange,
      daily: filledData,
      stats: stats,
      chart: formatChartData(filledData, ["consumed"], period),
    };
  } catch (err) {
    console.error("Get water insights error:", err);
    throw err;
  }
}

// Nutrition breakdown insights - UPDATED WITH TODAY'S DATA FIX
async function getNutritionInsights(userId, dateRange, period) {
  try {
    console.log("Fetching nutrition insights for user:", userId);

    const dailyData = await db.query(
      `SELECT date,
              COALESCE(total_calories_consumed, 0) as calories,
              COALESCE(total_protein_consumed, 0) as protein,
              COALESCE(total_carbs_consumed, 0) as carbs,
              COALESCE(total_fat_consumed, 0) as fat,
              COALESCE(daily_protein_goal, 150) as protein_goal,
              COALESCE(daily_carbs_goal, 300) as carbs_goal,
              COALESCE(daily_fat_goal, 80) as fat_goal
       FROM user_daily_data 
       WHERE user_id = $1 AND date BETWEEN $2 AND $3
       ORDER BY date ASC`,
      [userId, dateRange.start, dateRange.end]
    );

    console.log("Raw nutrition query result:", dailyData.rows);

    // Eksik günleri doldur
    const filledData = fillMissingDates(dailyData.rows, dateRange, {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      protein_goal: 150,
      carbs_goal: 300,
      fat_goal: 80,
    });

    // BUGÜN TARİHİ İÇİN GERÇEK VERİLERİ ÇEK
    const today = new Date().toISOString().split("T")[0];
    const todayIndex = filledData.findIndex((item) => item.date === today);

    if (todayIndex !== -1) {
      console.log(
        "Today's date found, fetching real nutrition data for:",
        today
      );

      // Bugünün gerçek nutrition verilerini al
      const todayNutritionData = await db.query(
        `SELECT 
           COALESCE(SUM(total_calories), 0) as total_calories_consumed,
           COALESCE(SUM(total_protein), 0) as total_protein_consumed,
           COALESCE(SUM(total_carbs), 0) as total_carbs_consumed,
           COALESCE(SUM(total_fat), 0) as total_fat_consumed
         FROM food_entries 
         WHERE user_id = $1 AND entry_date = $2`,
        [userId, today]
      );

      // Bugünün verilerini güncelle
      if (todayNutritionData.rows[0]) {
        const data = todayNutritionData.rows[0];
        filledData[todayIndex].calories =
          parseFloat(data.total_calories_consumed) || 0;
        filledData[todayIndex].protein =
          parseFloat(data.total_protein_consumed) || 0;
        filledData[todayIndex].carbs =
          parseFloat(data.total_carbs_consumed) || 0;
        filledData[todayIndex].fat = parseFloat(data.total_fat_consumed) || 0;
      }

      console.log("Updated today's nutrition data:", filledData[todayIndex]);
    }

    // Her gün için yüzdeleri hesapla
    const nutritionData = filledData.map((day) => {
      const totalMacros =
        parseFloat(day.protein) + parseFloat(day.carbs) + parseFloat(day.fat);

      if (totalMacros === 0) {
        return {
          ...day,
          protein_percentage: 33,
          carbs_percentage: 34,
          fat_percentage: 33,
        };
      }

      // Kalori bazında yüzde hesapla
      const proteinCalories = parseFloat(day.protein) * 4;
      const carbsCalories = parseFloat(day.carbs) * 4;
      const fatCalories = parseFloat(day.fat) * 9;
      const totalCalories = proteinCalories + carbsCalories + fatCalories;

      return {
        ...day,
        protein_percentage:
          totalCalories > 0
            ? Math.round((proteinCalories / totalCalories) * 100)
            : 33,
        carbs_percentage:
          totalCalories > 0
            ? Math.round((carbsCalories / totalCalories) * 100)
            : 34,
        fat_percentage:
          totalCalories > 0
            ? Math.round((fatCalories / totalCalories) * 100)
            : 33,
      };
    });

    // Nutrition istatistikleri
    const stats = calculateNutritionStats(nutritionData);

    return {
      period: period,
      dateRange: dateRange,
      daily: nutritionData,
      stats: stats,
      chart: formatNutritionChartData(nutritionData, period),
    };
  } catch (err) {
    console.error("Get nutrition insights error:", err);
    throw err;
  }
}

// BMI insights - ORIGINAL VERSION (no changes needed)
async function getBMIInsights(userId) {
  try {
    console.log("Fetching BMI insights for user:", userId);

    // Kullanıcı bilgilerini al
    const userInfo = await db.query(
      `SELECT u.weight, u.height, u.birth_date,
              dt.goal_weight
       FROM users u 
       LEFT JOIN user_daily_targets dt ON u.id = dt.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (userInfo.rows.length === 0) {
      throw new Error("User not found");
    }

    const user = userInfo.rows[0];
    console.log("User BMI info:", user);

    const bmi = calculateBMI(user.weight, user.height);
    const category = getBMICategory(bmi);
    const goalBMI = user.goal_weight
      ? calculateBMI(user.goal_weight, user.height)
      : null;

    // Son 30 günün weight geçmişi
    const recentWeights = await db.query(
      `SELECT logged_date, weight_kg, bmi 
       FROM weight_logs 
       WHERE user_id = $1 AND logged_date >= CURRENT_DATE - INTERVAL '30 days'
       ORDER BY logged_date ASC`,
      [userId]
    );

    return {
      current: {
        bmi: Math.round(bmi * 10) / 10,
        category: category,
        weight: user.weight,
        height: user.height,
      },
      goal: {
        bmi: goalBMI ? Math.round(goalBMI * 10) / 10 : null,
        weight: user.goal_weight,
        category: goalBMI ? getBMICategory(goalBMI) : null,
      },
      history: recentWeights.rows,
      recommendations: getBMIRecommendations(bmi, category),
    };
  } catch (err) {
    console.error("Get BMI insights error:", err);
    throw err;
  }
}

// Özet veriler - ORIGINAL VERSION (no changes needed)
async function getSummaryData(userId, dateRange) {
  try {
    console.log("Fetching summary data for user:", userId);

    const summary = await db.query(
      `SELECT 
         AVG(COALESCE(total_calories_consumed, 0)) as avg_calories,
         AVG(COALESCE(water_consumed, 0)) as avg_water,
         COUNT(CASE WHEN total_calories_consumed >= daily_calorie_goal THEN 1 END) as calorie_goal_days,
         COUNT(CASE WHEN water_consumed >= daily_water_goal THEN 1 END) as water_goal_days,
         COUNT(*) as total_days,
         SUM(COALESCE(total_calories_burned, 0)) as total_calories_burned
       FROM user_daily_data 
       WHERE user_id = $1 AND date BETWEEN $2 AND $3`,
      [userId, dateRange.start, dateRange.end]
    );

    const data = summary.rows[0];
    console.log("Summary data:", data);

    return {
      averages: {
        calories: Math.round(data.avg_calories || 0),
        water: Math.round(data.avg_water || 0),
      },
      achievements: {
        calorie_goal_percentage:
          data.total_days > 0
            ? Math.round((data.calorie_goal_days / data.total_days) * 100)
            : 0,
        water_goal_percentage:
          data.total_days > 0
            ? Math.round((data.water_goal_days / data.total_days) * 100)
            : 0,
      },
      totals: {
        calories_burned: Math.round(data.total_calories_burned || 0),
        active_days: data.total_days,
      },
    };
  } catch (err) {
    console.error("Get summary data error:", err);
    throw err;
  }
}

// ===============================
// UTILITY FUNCTIONS - ORIGINAL VERSIONS
// ===============================

// Eksik tarihleri doldur
function fillMissingDates(data, dateRange, defaultValues) {
  const filled = [];
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const existingData = data.find((item) => item.date === dateStr);

    if (existingData) {
      filled.push(existingData);
    } else {
      filled.push({
        date: dateStr,
        ...defaultValues,
      });
    }
  }

  return filled;
}

// Chart data formatla
function formatChartData(data, fields, period) {
  // Son 7 günü al (period'a göre değişebilir)
  const chartData = data.slice(-7);

  return chartData.map((day) => {
    const result = {
      date: day.date,
      day: new Date(day.date).getDate().toString(),
    };

    fields.forEach((field) => {
      result[field] = parseFloat(day[field]) || 0;
    });

    return result;
  });
}

// Nutrition chart data formatla
function formatNutritionChartData(data, period) {
  const chartData = data.slice(-7);

  return chartData.map((day) => ({
    date: day.date,
    day: new Date(day.date).getDate().toString(),
    carbs: day.carbs_percentage,
    protein: day.protein_percentage,
    fat: day.fat_percentage,
  }));
}

// BMI hesapla
function calculateBMI(weight, height) {
  if (!weight || !height) return 0;
  const heightM = height / 100;
  return weight / (heightM * heightM);
}

// BMI kategorisi
function getBMICategory(bmi) {
  if (bmi < 16.0) return "Very Severely Underweight";
  if (bmi < 17.0) return "Severely Underweight";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25.0) return "Normal";
  if (bmi < 30.0) return "Overweight";
  if (bmi < 35.0) return "Obese Class I";
  if (bmi < 40.0) return "Obese Class II";
  return "Obese Class III";
}

// BMI önerileri
function getBMIRecommendations(bmi, category) {
  const recommendations = [];

  if (bmi < 18.5) {
    recommendations.push(
      "Consider increasing caloric intake with nutrient-dense foods"
    );
    recommendations.push(
      "Consult with a healthcare provider about healthy weight gain"
    );
  } else if (bmi >= 25.0 && bmi < 30.0) {
    recommendations.push("Focus on balanced nutrition and regular exercise");
    recommendations.push("Consider reducing portion sizes gradually");
  } else if (bmi >= 30.0) {
    recommendations.push(
      "Consult with a healthcare provider for a weight management plan"
    );
    recommendations.push("Focus on sustainable lifestyle changes");
  } else {
    recommendations.push("Maintain your current healthy lifestyle");
    recommendations.push("Continue balanced nutrition and regular exercise");
  }

  return recommendations;
}

// İstatistik hesaplama fonksiyonları
function calculateCalorieStats(data) {
  const consumed = data.map((d) => parseFloat(d.consumed) || 0);
  const burned = data.map((d) => parseFloat(d.burned) || 0);

  return {
    average_consumed: Math.round(
      consumed.reduce((a, b) => a + b, 0) / consumed.length
    ),
    average_burned: Math.round(
      burned.reduce((a, b) => a + b, 0) / burned.length
    ),
    max_consumed: Math.max(...consumed),
    min_consumed: Math.min(...consumed),
    total_burned: burned.reduce((a, b) => a + b, 0),
    average_goal: data.length > 0 ? parseFloat(data[0].goal) || 2000 : 2000,
  };
}

function calculateWeightStats(data, userInfo) {
  const weights = data.map((d) => parseFloat(d.weight) || 0);
  const latest = weights[weights.length - 1];
  const earliest = weights[0];

  return {
    current: latest,
    change: Math.round((latest - earliest) * 10) / 10,
    goal: userInfo.goal_weight,
    goal_remaining: userInfo.goal_weight
      ? Math.round((userInfo.goal_weight - latest) * 10) / 10
      : 0,
  };
}

function calculateWaterStats(data) {
  const consumed = data.map((d) => parseFloat(d.consumed) || 0);
  const goals = data.map((d) => parseFloat(d.goal) || 2500);
  const goalAchieved = data.filter(
    (d) => parseFloat(d.consumed) >= parseFloat(d.goal)
  ).length;

  return {
    average_consumed: Math.round(
      consumed.reduce((a, b) => a + b, 0) / consumed.length
    ),
    average_goal: Math.round(goals.reduce((a, b) => a + b, 0) / goals.length),
    goal_achievement_rate: Math.round((goalAchieved / data.length) * 100),
    total_consumed: consumed.reduce((a, b) => a + b, 0),
  };
}

function calculateNutritionStats(data) {
  const protein = data.map((d) => parseFloat(d.protein) || 0);
  const carbs = data.map((d) => parseFloat(d.carbs) || 0);
  const fat = data.map((d) => parseFloat(d.fat) || 0);

  return {
    average_protein: Math.round(
      protein.reduce((a, b) => a + b, 0) / protein.length
    ),
    average_carbs: Math.round(carbs.reduce((a, b) => a + b, 0) / carbs.length),
    average_fat: Math.round(fat.reduce((a, b) => a + b, 0) / fat.length),
    average_protein_percentage: Math.round(
      data.reduce((sum, d) => sum + (d.protein_percentage || 0), 0) /
        data.length
    ),
    average_carbs_percentage: Math.round(
      data.reduce((sum, d) => sum + (d.carbs_percentage || 0), 0) / data.length
    ),
    average_fat_percentage: Math.round(
      data.reduce((sum, d) => sum + (d.fat_percentage || 0), 0) / data.length
    ),
  };
}

module.exports = router;
