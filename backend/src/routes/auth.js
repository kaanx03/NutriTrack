// backend/src/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// ── Helpers ──────────────────────────────────────────────────────────────────

function calculateAge(birthDate) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) {
    age--;
  }
  return age;
}

function calculateNutritionTargets(weight, height, age, gender, activityLevel) {
  let bmr;
  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const activityMultipliers = { 1: 1.2, 2: 1.375, 3: 1.55, 4: 1.725, 5: 1.9 };
  const dailyCalories = Math.round(bmr * (activityMultipliers[activityLevel] || 1.55));

  return {
    dailyCalories,
    protein: Math.round((dailyCalories * 0.25) / 4),
    carbs:   Math.round((dailyCalories * 0.50) / 4),
    fat:     Math.round((dailyCalories * 0.25) / 9),
    bmr:     Math.round(bmr),
  };
}

function createMailTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// ── Signup ────────────────────────────────────────────────────────────────────

router.post("/signup", async (req, res) => {
  const client = await db.beginTransaction();
  try {
    const {
      email, password, firstName, lastName, phoneNumber,
      gender, birthDate, height, weight, activityLevel,
    } = req.body;

    if (!email || !password) {
      await db.rollbackTransaction(client);
      return res.status(400).json({ error: "Email and password required" });
    }

    if (password.length < 8) {
      await db.rollbackTransaction(client);
      return res.status(400).json({
        error: "Password too short",
        details: "Password must be at least 8 characters long",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      await db.rollbackTransaction(client);
      return res.status(400).json({ error: "Invalid email format" });
    }

    const existing = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (existing.rows.length > 0) {
      await db.rollbackTransaction(client);
      return res.status(400).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const age = birthDate ? calculateAge(birthDate) : 25;

    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone_number,
       gender, birth_date, height, weight, activity_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, email, first_name, last_name`,
      [email, hashedPassword, firstName, lastName, phoneNumber,
       gender, birthDate, height, weight, activityLevel]
    );

    const user = userResult.rows[0];
    const targets = calculateNutritionTargets(
      weight || 70, height || 170, age, gender || "male", activityLevel || 3
    );

    await client.query(
      `INSERT INTO user_daily_targets
         (user_id, daily_calories, daily_protein, daily_carbs, daily_fat, water_target)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, targets.dailyCalories, targets.protein, targets.carbs, targets.fat, 2500]
    );

    await client.query(
      `INSERT INTO user_settings (user_id, calorie_intake_goal, water_intake_goal)
       VALUES ($1, $2, $3)`,
      [user.id, targets.dailyCalories, 2500]
    );

    const today = new Date().toISOString().split("T")[0];
    await client.query(
      `INSERT INTO user_daily_data
         (user_id, date, daily_calorie_goal, daily_protein_goal,
          daily_carbs_goal, daily_fat_goal, daily_water_goal)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.id, today, targets.dailyCalories, targets.protein,
       targets.carbs, targets.fat, 2500]
    );

    await db.commitTransaction(client);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });

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
    res.status(500).json({ error: "Server error during signup" });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const result = await db.query(
      "SELECT id, email, first_name, last_name, gender, height, weight, activity_level, password_hash, is_active FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: "Account deactivated" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });

    const targetsResult = await db.query(
      "SELECT * FROM user_daily_targets WHERE user_id = $1",
      [user.id]
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id:            user.id,
        email:         user.email,
        firstName:     user.first_name,
        lastName:      user.last_name,
        gender:        user.gender,
        height:        user.height,
        weight:        user.weight,
        activityLevel: user.activity_level,
      },
      targets: targetsResult.rows[0] || null,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

// ── Profile ───────────────────────────────────────────────────────────────────

router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userResult = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone_number,
              u.gender, u.birth_date, u.height, u.weight, u.activity_level,
              u.profile_image_url,
              udt.daily_calories, udt.daily_protein, udt.daily_carbs,
              udt.daily_fat, udt.water_target, udt.goal_weight
       FROM users u
       LEFT JOIN user_daily_targets udt ON u.id = udt.user_id
       WHERE u.id = $1`,
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];
    res.json({
      success: true,
      user: {
        id:              user.id,
        email:           user.email,
        firstName:       user.first_name,
        lastName:        user.last_name,
        phoneNumber:     user.phone_number,
        gender:          user.gender,
        birthDate:       user.birth_date,
        height:          user.height,
        weight:          user.weight,
        activityLevel:   user.activity_level,
        profileImageUrl: user.profile_image_url,
        targets: {
          dailyCalories: user.daily_calories,
          dailyProtein:  user.daily_protein,
          dailyCarbs:    user.daily_carbs,
          dailyFat:      user.daily_fat,
          waterTarget:   user.water_target,
          goalWeight:    user.goal_weight,
        },
      },
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Verify token ──────────────────────────────────────────────────────────────

router.get("/verify", authenticateToken, (req, res) => {
  res.json({ success: true, userId: req.userId, userEmail: req.userEmail });
});

// ── Forgot password ───────────────────────────────────────────────────────────

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  // Always return success to prevent email enumeration
  res.json({
    success: true,
    message: "If an account with this email exists, you will receive password reset instructions.",
  });

  // Fire-and-forget after response is sent
  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE email = $1 AND is_active = true",
      [email]
    );

    if (userResult.rows.length === 0) return;

    const userId = userResult.rows[0].id;

    // Invalidate existing tokens for this user
    await db.query(
      "DELETE FROM password_reset_tokens WHERE user_id = $1",
      [userId]
    );

    // Generate a cryptographically random token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.query(
      "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [userId, tokenHash, expiresAt]
    );

    if (!process.env.SMTP_HOST) {
      console.warn("SMTP not configured — password reset token generated but email not sent. Token:", rawToken);
      return;
    }

    const transporter = createMailTransport();
    const resetUrl = `${process.env.APP_BASE_URL || "nutritrack://reset-password"}?token=${rawToken}&email=${encodeURIComponent(email)}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to:   email,
      subject: "NutriTrack — Password Reset",
      text: `You requested a password reset. Use this link within 1 hour:\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
      html: `<p>You requested a password reset. Click the link below (valid for 1 hour):</p><p><a href="${resetUrl}">Reset Password</a></p><p>If you did not request this, ignore this email.</p>`,
    });
  } catch (err) {
    console.error("Forgot password background error:", err);
  }
});

// ── Reset password ────────────────────────────────────────────────────────────

router.post("/reset-password", async (req, res) => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    return res.status(400).json({ error: "email, token, and newPassword are required" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const result = await db.query(
      `SELECT prt.user_id FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE u.email = $1
         AND prt.token_hash = $2
         AND prt.expires_at > NOW()
         AND prt.used = false`,
      [email, tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const userId = result.rows[0].user_id;
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [hashedPassword, userId]
    );

    await db.query(
      "UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND token_hash = $2",
      [userId, tokenHash]
    );

    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
