// backend/src/routes/insights.js - Fixed Date Range Calculation
const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Ana insights dashboard verilerini al - FIXED DATE RANGE
router.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { period = "weekly", startDate, endDate } = req.query;

    console.log(
      `Getting insights dashboard for user ${userId}, period: ${period}`
    );

    // Tarih aralığını hesapla - IMPROVED
    const dateRange = calculateDateRange(period, startDate, endDate);
    console.log("Date range:", dateRange);

    // Paralel olarak tüm verileri al
    const [calorieData, weightData, waterData, nutritionData, bmiData] =
      await Promise.all([
        getCalorieInsights(userId, dateRange, period),
        getWeightInsights(userId, dateRange, period),
        getWaterInsights(userId, dateRange, period),
        getNutritionInsights(userId, dateRange, period),
        getBMIInsights(userId),
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

// FIXED: Tarih aralığını hesapla - Bugünü dahil ederek
function calculateDateRange(period, startDate, endDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

  let start, end, days;

  switch (period.toLowerCase()) {
    case "weekly":
      // Son 7 günü al (bugün dahil)
      start = new Date(today);
      start.setDate(start.getDate() - 6); // 6 gün geriye git (bugün + 6 gün = 7 gün)
      end = new Date(today);
      days = 7;
      break;

    case "monthly":
      // Son 30 günü al
      start = new Date(today);
      start.setDate(start.getDate() - 29);
      end = new Date(today);
      days = 30;
      break;

    case "yearly":
      // Son 365 günü al
      start = new Date(today);
      start.setDate(start.getDate() - 364);
      end = new Date(today);
      days = 365;
      break;

    default:
      start = new Date(today);
      start.setDate(start.getDate() - 6);
      end = new Date(today);
      days = 7;
  }

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
    days: days,
  };
}

// FIXED: Kalori insights - Tüm verilerin gösterilmesi
async function getCalorieInsights(userId, dateRange, period) {
  try {
    console.log(
      "Fetching calorie insights for user:",
      userId,
      "range:",
      dateRange
    );

    // Önce mevcut verileri al
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

    // FIXED: Eksik günleri doldur VE bugünün gerçek verilerini çek
    const filledData = await fillMissingDatesWithRealData(
      userId,
      dailyData.rows,
      dateRange,
      {
        consumed: 0,
        burned: 0,
        goal: 2000,
      },
      "calories"
    );

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

// FIXED: Su insights
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

    // FIXED: Gerçek verilerle doldur
    const filledData = await fillMissingDatesWithRealData(
      userId,
      dailyData.rows,
      dateRange,
      {
        consumed: 0,
        goal: 2500,
      },
      "water"
    );

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

// FIXED: Weight insights
async function getWeightInsights(userId, dateRange, period) {
  try {
    console.log("Fetching weight insights for user:", userId);

    // Weight logs ve user_daily_data'dan verileri al
    const weightLogs = await db.query(
      `SELECT logged_date as date, weight_kg as weight, bmi 
       FROM weight_logs 
       WHERE user_id = $1 AND logged_date BETWEEN $2 AND $3
       ORDER BY logged_date ASC`,
      [userId, dateRange.start, dateRange.end]
    );

    // user_daily_data'dan da al
    const dailyWeights = await db.query(
      `SELECT date, weight_kg as weight
       FROM user_daily_data 
       WHERE user_id = $1 AND date BETWEEN $2 AND $3 AND weight_kg IS NOT NULL
       ORDER BY date ASC`,
      [userId, dateRange.start, dateRange.end]
    );

    // İki kaynağı birleştir
    const combinedWeights = [...weightLogs.rows, ...dailyWeights.rows];

    // Tarih bazında unique yap
    const uniqueWeights = combinedWeights.reduce((acc, curr) => {
      const existing = acc.find((item) => item.date === curr.date);
      if (!existing) {
        acc.push(curr);
      }
      return acc;
    }, []);

    // User bilgilerini al
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

    console.log("Weight data:", uniqueWeights.length, "entries");

    // Weight verilerini doldur
    const filledData = fillMissingDates(uniqueWeights, dateRange, {
      weight: userWeight.current_weight,
      bmi: calculateBMI(userWeight.current_weight, userWeight.height),
    });

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

// FIXED: Nutrition insights
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

    // FIXED: Gerçek verilerle doldur
    const filledData = await fillMissingDatesWithRealData(
      userId,
      dailyData.rows,
      dateRange,
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        protein_goal: 150,
        carbs_goal: 300,
        fat_goal: 80,
      },
      "nutrition"
    );

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

// IMPROVED: Eksik tarihleri gerçek verilerle doldur
async function fillMissingDatesWithRealData(
  userId,
  data,
  dateRange,
  defaultValues,
  dataType
) {
  const filled = [];
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  const today = new Date().toISOString().split("T")[0];

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const existingData = data.find((item) => item.date === dateStr);

    if (existingData) {
      filled.push(existingData);
    } else {
      // Eksik gün için default değer ver, ama bugünse gerçek veriyi çek
      let dayData = {
        date: dateStr,
        ...defaultValues,
      };

      // Eğer bugünse gerçek time veriyi çek
      if (dateStr === today) {
        try {
          const realData = await getRealTimeData(userId, dateStr, dataType);
          dayData = { ...dayData, ...realData };
        } catch (error) {
          console.error("Error getting real-time data:", error);
        }
      }

      filled.push(dayData);
    }
  }

  return filled;
}

// Gerçek zamanlı veri çek
async function getRealTimeData(userId, date, dataType) {
  try {
    switch (dataType) {
      case "calories":
        const foodData = await db.query(
          `SELECT 
             COALESCE(SUM(total_calories), 0) as consumed,
             COALESCE(SUM(total_protein), 0) as protein,
             COALESCE(SUM(total_carbs), 0) as carbs,
             COALESCE(SUM(total_fat), 0) as fat
           FROM food_entries 
           WHERE user_id = $1 AND entry_date = $2`,
          [userId, date]
        );

        const activityData = await db.query(
          `SELECT COALESCE(SUM(calories_burned), 0) as burned
           FROM activity_logs 
           WHERE user_id = $1 AND entry_date = $2`,
          [userId, date]
        );

        return {
          consumed: parseFloat(foodData.rows[0]?.consumed) || 0,
          burned: parseFloat(activityData.rows[0]?.burned) || 0,
        };

      case "water":
        const waterData = await db.query(
          `SELECT COALESCE(SUM(amount_ml), 0) as consumed
           FROM water_logs 
           WHERE user_id = $1 AND entry_date = $2`,
          [userId, date]
        );

        return {
          consumed: parseInt(waterData.rows[0]?.consumed) || 0,
        };

      case "nutrition":
        const nutritionData = await db.query(
          `SELECT 
             COALESCE(SUM(total_calories), 0) as calories,
             COALESCE(SUM(total_protein), 0) as protein,
             COALESCE(SUM(total_carbs), 0) as carbs,
             COALESCE(SUM(total_fat), 0) as fat
           FROM food_entries 
           WHERE user_id = $1 AND entry_date = $2`,
          [userId, date]
        );

        const data = nutritionData.rows[0];
        return {
          calories: parseFloat(data?.calories) || 0,
          protein: parseFloat(data?.protein) || 0,
          carbs: parseFloat(data?.carbs) || 0,
          fat: parseFloat(data?.fat) || 0,
        };

      default:
        return {};
    }
  } catch (error) {
    console.error("getRealTimeData error:", error);
    return {};
  }
}

// Eksik tarihleri doldur (basit versiyon)
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

// Chart data formatla - SON 7 GÜN
function formatChartData(data, fields, period) {
  // Son 7 günü al
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

// BMI insights - SAME AS BEFORE
async function getBMIInsights(userId) {
  try {
    console.log("Fetching BMI insights for user:", userId);

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
    const bmi = calculateBMI(user.weight, user.height);
    const category = getBMICategory(bmi);
    const goalBMI = user.goal_weight
      ? calculateBMI(user.goal_weight, user.height)
      : null;

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
    };
  } catch (err) {
    console.error("Get BMI insights error:", err);
    throw err;
  }
}

// Utility functions - SAME AS BEFORE
function calculateBMI(weight, height) {
  if (!weight || !height) return 0;
  const heightM = height / 100;
  return weight / (heightM * heightM);
}

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

// İstatistik hesaplama fonksiyonları - SAME AS BEFORE
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
