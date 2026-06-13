// backend/src/routes/insights.js
const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Insights dashboard — uses query params: ?period=weekly&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Determine date range from query params; fall back to current week
    const { period = "weekly" } = req.query;
    let { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

      const monday = new Date(today);
      monday.setDate(today.getDate() + mondayOffset);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      startDate = monday.toISOString().split("T")[0];
      endDate = sunday.toISOString().split("T")[0];
    }

    console.log(`Insights for user ${userId}: ${startDate} → ${endDate}`);

    // Weight data from weight_logs
    const weightLogsData = await db.query(
      `SELECT logged_date AS date, weight_kg AS weight
       FROM weight_logs
       WHERE user_id = $1 AND logged_date >= $2 AND logged_date <= $3
       ORDER BY logged_date ASC`,
      [userId, startDate, endDate]
    );

    // Daily nutrition/activity/water data
    const rawData = await db.query(
      `SELECT date,
              total_calories_consumed  AS calories,
              total_protein_consumed   AS protein,
              total_carbs_consumed     AS carbs,
              total_fat_consumed       AS fat,
              total_calories_burned    AS burned,
              water_consumed           AS water,
              daily_calorie_goal       AS calorie_goal,
              daily_water_goal         AS water_goal
       FROM user_daily_data
       WHERE user_id = $1 AND date >= $2 AND date <= $3
       ORDER BY date ASC`,
      [userId, startDate, endDate]
    );

    // Build a chart entry for every day in the range
    const dailyData = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const dayNum = String(d.getDate());

      const daily = rawData.rows.find(
        (r) => r.date.toISOString().split("T")[0] === dateStr
      );

      const weightEntry = weightLogsData.rows.find(
        (r) => r.date.toISOString().split("T")[0] === dateStr
      );

      dailyData.push({
        date: dateStr,
        day: dayNum,
        consumed: daily ? parseFloat(daily.calories) || 0 : 0,
        burned:   daily ? parseFloat(daily.burned)   || 0 : 0,
        water:    daily ? parseInt(daily.water)       || 0 : 0,
        weight:   weightEntry ? parseFloat(weightEntry.weight) : null,
        protein:  daily ? parseFloat(daily.protein)  || 0 : 0,
        carbs:    daily ? parseFloat(daily.carbs)    || 0 : 0,
        fat:      daily ? parseFloat(daily.fat)      || 0 : 0,
      });
    }

    // Monthly görünümde haftalara, yearly görünümde aylara grupla.
    // Tüketim metrikleri için veri olan günlerin ortalaması alınır;
    // weight için null olmayan kayıtların ortalaması (yoksa null).
    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                         "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const aggregateBy = (days, labelFn) => {
      const groups = new Map();
      for (const d of days) {
        const label = labelFn(d);
        if (!groups.has(label)) groups.set(label, []);
        groups.get(label).push(d);
      }

      const avgPositive = (vals) => {
        const pos = vals.filter((v) => v > 0);
        return pos.length ? pos.reduce((s, v) => s + v, 0) / pos.length : 0;
      };

      return [...groups.entries()].map(([label, items]) => {
        const weights = items.map((i) => i.weight).filter((w) => w !== null);
        return {
          date: items[0].date,
          day: label,
          consumed: Math.round(avgPositive(items.map((i) => i.consumed))),
          burned:   Math.round(avgPositive(items.map((i) => i.burned))),
          water:    Math.round(avgPositive(items.map((i) => i.water))),
          weight:   weights.length
            ? Math.round((weights.reduce((s, w) => s + w, 0) / weights.length) * 10) / 10
            : null,
          protein:  Math.round(avgPositive(items.map((i) => i.protein))),
          carbs:    Math.round(avgPositive(items.map((i) => i.carbs))),
          fat:      Math.round(avgPositive(items.map((i) => i.fat))),
        };
      });
    };

    let chartData = dailyData;
    if (period === "monthly") {
      // Ayı her zaman 4 haftaya böl — son birkaç gün (29-31) 4. haftaya katılır.
      chartData = aggregateBy(
        dailyData,
        (d) =>
          `Week ${Math.min(
            4,
            Math.floor((new Date(d.date).getDate() - 1) / 7) + 1
          )}`
      );
    } else if (period === "yearly") {
      chartData = aggregateBy(
        dailyData,
        (d) => MONTH_NAMES[new Date(d.date).getMonth()]
      );
    }

    // BMI info
    const userInfo = await db.query(
      `SELECT u.weight, u.height, dt.goal_weight, dt.daily_calories
       FROM users u
       LEFT JOIN user_daily_targets dt ON u.id = dt.user_id
       WHERE u.id = $1`,
      [userId]
    );

    const user = userInfo.rows[0] || { weight: 75, height: 175, goal_weight: 70 };
    const bmi = calculateBMI(user.weight, user.height);

    const avgGoal =
      rawData.rows.length > 0
        ? rawData.rows.reduce(
            (s, r) => s + (parseInt(r.calorie_goal) || 2000),
            0
          ) / rawData.rows.length
        : 2000;

    const response = {
      success: true,
      data: {
        period,
        dateRange: { start: startDate, end: endDate, days: chartData.length },
        calories: {
          chart: chartData.map((d) => ({
            date: d.date,
            day: d.day,
            consumed: d.consumed,
            burned: d.burned,
          })),
          stats: {
            average_consumed: Math.round(
              chartData.reduce((s, d) => s + d.consumed, 0) / chartData.length
            ),
            // SSOT: "Goal" = kullanıcının güncel kalori hedefi (user_daily_targets),
            // haftanın günlük hedeflerinin ortalaması DEĞİL. Hedef yoksa eski
            // ortalamaya düş.
            average_goal: parseInt(user.daily_calories) || Math.round(avgGoal),
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
              chartData.reduce((s, d) => s + d.water, 0) / chartData.length
            ),
            average_goal: user.water_target || 2500,
          },
        },
        weight: {
          chart: chartData.map((d) => ({
            date: d.date,
            day: d.day,
            weight: d.weight,
          })),
          stats: { current: user.weight, goal: user.goal_weight },
          goalWeight: user.goal_weight,
        },
        nutrition: {
          chart: chartData.map((d) => {
            const totalCals = d.protein * 4 + d.carbs * 4 + d.fat * 9;
            return {
              date: d.date,
              day: d.day,
              protein: totalCals > 0 ? Math.round(((d.protein * 4) / totalCals) * 100) : 33,
              carbs:   totalCals > 0 ? Math.round(((d.carbs * 4)   / totalCals) * 100) : 34,
              fat:     totalCals > 0 ? Math.round(((d.fat * 9)     / totalCals) * 100) : 33,
            };
          }),
          stats: {
            average_protein: Math.round(chartData.reduce((s, d) => s + d.protein, 0) / chartData.length),
            average_carbs:   Math.round(chartData.reduce((s, d) => s + d.carbs,   0) / chartData.length),
            average_fat:     Math.round(chartData.reduce((s, d) => s + d.fat,     0) / chartData.length),
          },
        },
        bmi: {
          current: {
            bmi:      Math.round(bmi * 10) / 10,
            category: getBMICategory(bmi),
            weight:   user.weight,
            height:   user.height,
          },
          goal: {
            bmi:      user.goal_weight ? Math.round(calculateBMI(user.goal_weight, user.height) * 10) / 10 : null,
            weight:   user.goal_weight,
            category: user.goal_weight ? getBMICategory(calculateBMI(user.goal_weight, user.height)) : null,
          },
        },
      },
    };

    res.json(response);
  } catch (err) {
    console.error("Insights error:", err);
    res.status(500).json({ success: false, error: "Server error", details: err.message });
  }
});

// Test endpoint
router.get("/test", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const dailyResult = await db.query(
      `SELECT 'daily_data' AS source, date, water_consumed, total_calories_consumed
       FROM user_daily_data WHERE user_id = $1 ORDER BY date DESC LIMIT 10`,
      [userId]
    );

    const weightResult = await db.query(
      `SELECT 'weight_logs' AS source, logged_date AS date, weight_kg
       FROM weight_logs WHERE user_id = $1 ORDER BY logged_date DESC LIMIT 10`,
      [userId]
    );

    res.json({
      success: true,
      data: { daily_data: dailyResult.rows, weight_logs: weightResult.rows },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function calculateBMI(weight, height) {
  if (!weight || !height) return 22.5;
  const h = height / 100;
  return weight / (h * h);
}

function getBMICategory(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25.0) return "Normal";
  if (bmi < 30.0) return "Overweight";
  return "Obese";
}

module.exports = router;
