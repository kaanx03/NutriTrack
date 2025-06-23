// backend/src/routes/settings.js - User settings management
const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Kullanıcı ayarlarını al
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    let settings = await db.query(
      "SELECT * FROM user_settings WHERE user_id = $1",
      [userId]
    );

    // Ayarlar yoksa varsayılan ayarları oluştur
    if (settings.rows.length === 0) {
      console.log(`Creating default settings for user ${userId}`);

      const defaultSettings = await db.query(
        "INSERT INTO user_settings (user_id) VALUES ($1) RETURNING *",
        [userId]
      );
      settings = defaultSettings;
    }

    res.json({
      success: true,
      data: settings.rows[0],
    });
  } catch (err) {
    console.error("Get user settings error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch user settings",
    });
  }
});

// Tüm ayarları güncelle
router.put("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const updates = req.body;

    // İzin verilen alanlar listesi
    const allowedFields = [
      "calorie_intake_goal",
      "calorie_units",
      "meal_logging_reminder",
      "meal_reminder_repeat",
      "meal_reminder_time",
      "meal_ringtone",
      "meal_volume",
      "meal_vibration",
      "meal_stop_when_complete",
      "water_intake_goal",
      "water_units",
      "drink_reminder",
      "drink_reminder_repeat",
      "drink_reminder_mode",
      "drink_ringtone",
      "drink_volume",
      "drink_vibration",
      "drink_stop_when_complete",
      "weight_units",
      "height_units",
      "bmi_enabled",
      "weight_logging_reminder",
      "weight_reminder_repeat",
      "weight_reminder_time",
      "weight_ringtone",
      "weight_volume",
      "weight_vibration",
      "weight_stop_when_goal_achieved",
    ];

    // Güncelleme alanlarını ve değerlerini hazırla
    const updateFields = [];
    const values = [];
    let paramCount = 2; // $1 userId için ayrılmış

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: "No valid fields to update",
        details: "Please provide at least one valid field to update",
        allowedFields: allowedFields,
      });
    }

    updateFields.push(`updated_at = NOW()`);

    const query = `
      UPDATE user_settings 
      SET ${updateFields.join(", ")}
      WHERE user_id = $1 
      RETURNING *
    `;

    const result = await db.query(query, [userId, ...values]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Settings not found",
        details: "User settings record not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: "Settings updated successfully",
    });
  } catch (err) {
    console.error("Update user settings error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to update user settings",
    });
  }
});

// Belirli kategori ayarlarını güncelle
router.put("/:category", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { category } = req.params;
    const updates = req.body;

    let allowedFields = [];

    // Kategoriye göre izin verilen alanları belirle
    switch (category) {
      case "calorie":
        allowedFields = [
          "calorie_intake_goal",
          "calorie_units",
          "meal_logging_reminder",
          "meal_reminder_repeat",
          "meal_reminder_time",
          "meal_ringtone",
          "meal_volume",
          "meal_vibration",
          "meal_stop_when_complete",
        ];
        break;
      case "water":
        allowedFields = [
          "water_intake_goal",
          "water_units",
          "drink_reminder",
          "drink_reminder_repeat",
          "drink_reminder_mode",
          "drink_ringtone",
          "drink_volume",
          "drink_vibration",
          "drink_stop_when_complete",
        ];
        break;
      case "weight":
        allowedFields = [
          "weight_units",
          "height_units",
          "bmi_enabled",
          "weight_logging_reminder",
          "weight_reminder_repeat",
          "weight_reminder_time",
          "weight_ringtone",
          "weight_volume",
          "weight_vibration",
          "weight_stop_when_goal_achieved",
        ];
        break;
      default:
        return res.status(400).json({
          error: "Invalid category",
          details: "Category must be one of: calorie, water, weight",
        });
    }

    // Özel validasyonlar
    if (category === "calorie" && updates.calorie_intake_goal) {
      const goal = parseInt(updates.calorie_intake_goal);
      if (goal < 800 || goal > 5000) {
        return res.status(400).json({
          error: "Invalid calorie goal",
          details: "Calorie goal must be between 800 and 5000",
        });
      }
    }

    if (category === "water" && updates.water_intake_goal) {
      const goal = parseInt(updates.water_intake_goal);
      if (goal < 500 || goal > 10000) {
        return res.status(400).json({
          error: "Invalid water goal",
          details: "Water goal must be between 500 and 10000 ml",
        });
      }
    }

    const updateFields = [];
    const values = [];
    let paramCount = 2;

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: "No valid fields to update",
        details: `No valid fields provided for ${category} category`,
        allowedFields: allowedFields,
      });
    }

    updateFields.push(`updated_at = NOW()`);

    const query = `
      UPDATE user_settings 
      SET ${updateFields.join(", ")}
      WHERE user_id = $1 
      RETURNING *
    `;

    const result = await db.query(query, [userId, ...values]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Settings not found",
        details: "User settings record not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: `${category} settings updated successfully`,
      updatedFields: Object.keys(updates).filter((key) =>
        allowedFields.includes(key)
      ),
    });
  } catch (err) {
    console.error(`Update ${category} settings error:`, err);
    res.status(500).json({
      error: "Server error",
      details: `Failed to update ${category} settings`,
    });
  }
});

// Belirli bir ayar değerini al
router.get("/:category/:field", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { category, field } = req.params;

    // Alan adını veritabanı formatına çevir
    const dbField = `${category}_${field}`;

    const result = await db.query(
      `SELECT ${dbField} FROM user_settings WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Settings not found",
        details: "User settings record not found",
      });
    }

    res.json({
      success: true,
      data: {
        field: field,
        value: result.rows[0][dbField],
      },
    });
  } catch (err) {
    console.error("Get setting field error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch setting value",
    });
  }
});

// Ayarları varsayılana sıfırla
router.post("/reset", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { category } = req.body;

    let resetQuery;
    let resetMessage;

    if (category === "calorie") {
      resetQuery = `
        UPDATE user_settings 
        SET calorie_intake_goal = 2000,
            calorie_units = 'kcal',
            meal_logging_reminder = true,
            meal_reminder_repeat = 'Everyday',
            meal_reminder_time = '08:00 AM',
            meal_ringtone = 'Lollipop',
            meal_volume = 0.7,
            meal_vibration = false,
            meal_stop_when_complete = false,
            updated_at = NOW()
        WHERE user_id = $1 RETURNING *
      `;
      resetMessage = "Calorie settings reset to defaults";
    } else if (category === "water") {
      resetQuery = `
        UPDATE user_settings 
        SET water_intake_goal = 2500,
            water_units = 'mL',
            drink_reminder = true,
            drink_reminder_repeat = 'Everyday',
            drink_reminder_mode = 'Static',
            drink_ringtone = 'Harmony',
            drink_volume = 0.6,
            drink_vibration = false,
            drink_stop_when_complete = false,
            updated_at = NOW()
        WHERE user_id = $1 RETURNING *
      `;
      resetMessage = "Water settings reset to defaults";
    } else if (category === "weight") {
      resetQuery = `
        UPDATE user_settings 
        SET weight_units = 'kg',
            height_units = 'cm',
            bmi_enabled = true,
            weight_logging_reminder = true,
            weight_reminder_repeat = 'Everyday',
            weight_reminder_time = '10:00',
            weight_ringtone = 'Jingle Jam',
            weight_volume = 0.8,
            weight_vibration = false,
            weight_stop_when_goal_achieved = false,
            updated_at = NOW()
        WHERE user_id = $1 RETURNING *
      `;
      resetMessage = "Weight settings reset to defaults";
    } else if (category === "all") {
      resetQuery = `
        UPDATE user_settings 
        SET calorie_intake_goal = 2000,
            calorie_units = 'kcal',
            meal_logging_reminder = true,
            meal_reminder_repeat = 'Everyday',
            meal_reminder_time = '08:00 AM',
            meal_ringtone = 'Lollipop',
            meal_volume = 0.7,
            meal_vibration = false,
            meal_stop_when_complete = false,
            water_intake_goal = 2500,
            water_units = 'mL',
            drink_reminder = true,
            drink_reminder_repeat = 'Everyday',
            drink_reminder_mode = 'Static',
            drink_ringtone = 'Harmony',
            drink_volume = 0.6,
            drink_vibration = false,
            drink_stop_when_complete = false,
            weight_units = 'kg',
            height_units = 'cm',
            bmi_enabled = true,
            weight_logging_reminder = true,
            weight_reminder_repeat = 'Everyday',
            weight_reminder_time = '10:00',
            weight_ringtone = 'Jingle Jam',
            weight_volume = 0.8,
            weight_vibration = false,
            weight_stop_when_goal_achieved = false,
            updated_at = NOW()
        WHERE user_id = $1 RETURNING *
      `;
      resetMessage = "All settings reset to defaults";
    } else {
      return res.status(400).json({
        error: "Invalid category",
        details: "Category must be one of: calorie, water, weight, all",
      });
    }

    const result = await db.query(resetQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Settings not found",
        details: "User settings record not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: resetMessage,
    });
  } catch (err) {
    console.error("Reset settings error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to reset settings",
    });
  }
});

// Ayar geçmişini al (değişikliklerin logunu tutmak için - ileride kullanılabilir)
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Şu anda sadece mevcut ayarları döndürüyoruz
    // İleride settings_history tablosu eklenebilir
    const settings = await db.query(
      "SELECT *, created_at, updated_at FROM user_settings WHERE user_id = $1",
      [userId]
    );

    if (settings.rows.length === 0) {
      return res.status(404).json({
        error: "Settings not found",
        details: "User settings record not found",
      });
    }

    res.json({
      success: true,
      data: {
        currentSettings: settings.rows[0],
        lastModified: settings.rows[0].updated_at,
        created: settings.rows[0].created_at,
      },
    });
  } catch (err) {
    console.error("Get settings history error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch settings history",
    });
  }
});

// Ayar kategorilerini listele (frontend için yardımcı endpoint)
router.get("/categories", authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        categories: [
          {
            name: "calorie",
            displayName: "Calorie Counter",
            description: "Settings for calorie tracking and meal reminders",
            fields: [
              "calorie_intake_goal",
              "calorie_units",
              "meal_logging_reminder",
              "meal_reminder_repeat",
              "meal_reminder_time",
              "meal_ringtone",
              "meal_volume",
              "meal_vibration",
              "meal_stop_when_complete",
            ],
          },
          {
            name: "water",
            displayName: "Water Tracker",
            description:
              "Settings for water intake tracking and drink reminders",
            fields: [
              "water_intake_goal",
              "water_units",
              "drink_reminder",
              "drink_reminder_repeat",
              "drink_reminder_mode",
              "drink_ringtone",
              "drink_volume",
              "drink_vibration",
              "drink_stop_when_complete",
            ],
          },
          {
            name: "weight",
            displayName: "Weight Tracker",
            description: "Settings for weight tracking and BMI calculations",
            fields: [
              "weight_units",
              "height_units",
              "bmi_enabled",
              "weight_logging_reminder",
              "weight_reminder_repeat",
              "weight_reminder_time",
              "weight_ringtone",
              "weight_volume",
              "weight_vibration",
              "weight_stop_when_goal_achieved",
            ],
          },
        ],
      },
    });
  } catch (err) {
    console.error("Get categories error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch setting categories",
    });
  }
});

module.exports = router;
