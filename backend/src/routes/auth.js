// backend/src/routes/auth.js - Updated Authentication Routes
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// BMR ve günlük kalori hesaplama fonksiyonu
const calculateNutritionTargets = (
  weight,
  height,
  age,
  gender,
  activityLevel
) => {
  let bmr;

  // Mifflin-St Jeor Equation
  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // Activity level multipliers
  const activityMultipliers = {
    1: 1.2, // Sedentary (little/no exercise)
    2: 1.375, // Light activity (light exercise 1-3 days/week)
    3: 1.55, // Moderate activity (moderate exercise 3-5 days/week)
    4: 1.725, // Very active (hard exercise 6-7 days/week)
    5: 1.9, // Extra active (very hard exercise & physical job)
  };

  const dailyCalories = Math.round(
    bmr * (activityMultipliers[activityLevel] || 1.55)
  );

  // Makro besin dağılımı (standart öneriler)
  const protein = Math.round((dailyCalories * 0.25) / 4); // %25 protein (4 kcal/g)
  const carbs = Math.round((dailyCalories * 0.5) / 4); // %50 karbonhidrat (4 kcal/g)
  const fat = Math.round((dailyCalories * 0.25) / 9); // %25 yağ (9 kcal/g)

  return {
    dailyCalories,
    protein,
    carbs,
    fat,
    bmr: Math.round(bmr),
  };
};

// Kullanıcı kaydı
router.post("/signup", async (req, res) => {
  const client = await db.beginTransaction();

  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      gender,
      birthDate,
      height,
      weight,
      activityLevel,
    } = req.body;

    // Validasyon
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password required",
        details: "Both email and password fields are mandatory",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password too short",
        details: "Password must be at least 6 characters long",
      });
    }

    // Email kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format",
        details: "Please provide a valid email address",
      });
    }

    // Kullanıcı zaten var mı kontrol et
    const existing = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (existing.rows.length > 0) {
      await db.rollbackTransaction(client);
      return res.status(400).json({
        error: "Email already in use",
        details: "An account with this email address already exists",
      });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 12);

    // Yaş hesaplama
    const age = birthDate
      ? new Date().getFullYear() - new Date(birthDate).getFullYear()
      : 25;

    // Kullanıcıyı veritabanına ekle
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone_number, 
       gender, birth_date, height, weight, activity_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, email, first_name, last_name`,
      [
        email,
        hashedPassword,
        firstName,
        lastName,
        phoneNumber,
        gender,
        birthDate,
        height,
        weight,
        activityLevel,
      ]
    );

    const user = userResult.rows[0];

    // Beslenme hedeflerini hesapla
    const targets = calculateNutritionTargets(
      weight || 70,
      height || 170,
      age,
      gender || "male",
      activityLevel || 3
    );

    // Günlük hedefleri ekle
    await client.query(
      `INSERT INTO user_daily_targets (user_id, daily_calories, daily_protein, daily_carbs, daily_fat, water_target)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        user.id,
        targets.dailyCalories,
        targets.protein,
        targets.carbs,
        targets.fat,
        2500,
      ]
    );

    // Varsayılan kullanıcı ayarlarını ekle
    await client.query(
      `INSERT INTO user_settings (user_id, calorie_intake_goal, water_intake_goal) VALUES ($1, $2, $3)`,
      [user.id, targets.dailyCalories, 2500]
    );

    // Bugün için günlük veri kaydı oluştur
    const today = new Date().toISOString().split("T")[0];
    await client.query(
      `INSERT INTO user_daily_data (user_id, date, daily_calorie_goal, daily_protein_goal, 
       daily_carbs_goal, daily_fat_goal, daily_water_goal)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        user.id,
        today,
        targets.dailyCalories,
        targets.protein,
        targets.carbs,
        targets.fat,
        2500,
      ]
    );

    await db.commitTransaction(client);

    // JWT token oluştur
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "nutritrack_secret",
      { expiresIn: "30d" }
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      nutritionTargets: targets,
    });
  } catch (err) {
    await db.rollbackTransaction(client);
    console.error("Signup error:", err);
    res.status(500).json({
      error: "Server error during signup",
      details: "An internal error occurred while creating your account",
    });
  }
});

// Kullanıcı girişi
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password required",
        details: "Both email and password fields are mandatory",
      });
    }

    // Kullanıcıyı bul
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid credentials",
        details: "Email or password is incorrect",
      });
    }

    const user = result.rows[0];

    // Hesap aktif mi kontrol et
    if (!user.is_active) {
      return res.status(401).json({
        error: "Account deactivated",
        details: "Your account has been deactivated. Please contact support.",
      });
    }

    // Şifre kontrolü
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: "Invalid credentials",
        details: "Email or password is incorrect",
      });
    }

    // JWT token oluştur
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "nutritrack_secret",
      { expiresIn: "30d" }
    );

    // Kullanıcının hedeflerini al
    const targetsResult = await db.query(
      "SELECT * FROM user_daily_targets WHERE user_id = $1",
      [user.id]
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        activityLevel: user.activity_level,
      },
      targets: targetsResult.rows[0] || null,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      error: "Server error during login",
      details: "An internal error occurred while logging you in",
    });
  }
});

// Kullanıcı profili al
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userResult = await db.query(
      `
      SELECT u.*, udt.daily_calories, udt.daily_protein, udt.daily_carbs, 
             udt.daily_fat, udt.water_target, udt.goal_weight
      FROM users u
      LEFT JOIN user_daily_targets udt ON u.id = udt.user_id
      WHERE u.id = $1
    `,
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: "User not found",
        details: "User profile could not be found",
      });
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number,
        gender: user.gender,
        birthDate: user.birth_date,
        height: user.height,
        weight: user.weight,
        activityLevel: user.activity_level,
        profileImageUrl: user.profile_image_url,
        targets: {
          dailyCalories: user.daily_calories,
          dailyProtein: user.daily_protein,
          dailyCarbs: user.daily_carbs,
          dailyFat: user.daily_fat,
          waterTarget: user.water_target,
          goalWeight: user.goal_weight,
        },
      },
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({
      error: "Server error",
      details: "An error occurred while fetching your profile",
    });
  }
});

// Token doğrulama
router.get("/verify", authenticateToken, async (req, res) => {
  res.json({
    success: true,
    message: "Token is valid",
    userId: req.userId,
    userEmail: req.userEmail,
  });
});

// Şifre sıfırlama isteği (placeholder)
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: "Email required",
      details: "Email address is required for password reset",
    });
  }

  // TODO: Implement email sending logic
  res.json({
    success: true,
    message:
      "If an account with this email exists, you will receive password reset instructions",
    email: email,
  });
});

module.exports = router;
