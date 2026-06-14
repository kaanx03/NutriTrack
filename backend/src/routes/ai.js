// backend/src/routes/ai.js — Groq proxy (key asla frontend'e sızmaz)
const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const CHAT_MODEL = "llama-3.3-70b-versatile";

async function callGroq(model, messages, { json = false } = {}) {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    const err = new Error("AI not configured");
    err.status = 503;
    throw err;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: 1024,
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Groq error:", res.status, body.slice(0, 300));
      const err = new Error("AI provider error");
      err.status = 502;
      throw err;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } finally {
    clearTimeout(timer);
  }
}

const clamp = (v, min, max, fallback = 0) => {
  const n = parseFloat(v);
  if (isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

// Fotoğraftan yemek tanıma
router.post("/food-photo", authenticateToken, async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({
        error: "Invalid request",
        details: "imageBase64 is required",
      });
    }
    if (imageBase64.length > 6_000_000) {
      return res.status(413).json({
        error: "Image too large",
        details: "Please use a smaller photo",
      });
    }

    const content = await callGroq(
      VISION_MODEL,
      [
        {
          role: "system",
          content:
            'You are a nutrition estimation assistant. Look at the food photo and respond ONLY with a JSON object: {"name": string (short dish name), "calories": number (kcal for the visible portion), "protein": number (g), "carbs": number (g), "fat": number (g), "portionGrams": number (estimated grams of the visible portion), "confidence": number (0-1, how sure you are)}. Numbers only, no units inside values. If you cannot identify any food, set confidence to 0.',
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Estimate the nutrition of this food." },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
          ],
        },
      ],
      { json: true }
    );

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      return res
        .status(502)
        .json({ error: "AI returned invalid response" });
    }

    res.json({
      success: true,
      data: {
        name: String(parsed.name || "Unknown food").slice(0, 80),
        calories: Math.round(clamp(parsed.calories, 0, 3000)),
        protein: Math.round(clamp(parsed.protein, 0, 300) * 10) / 10,
        carbs: Math.round(clamp(parsed.carbs, 0, 500) * 10) / 10,
        fat: Math.round(clamp(parsed.fat, 0, 300) * 10) / 10,
        portionGrams: Math.round(clamp(parsed.portionGrams, 1, 2000, 100)),
        confidence: clamp(parsed.confidence, 0, 1),
      },
    });
  } catch (err) {
    console.error("AI food-photo error:", err.message);
    res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : "Server error" });
  }
});

// Beslenme koçu sohbeti — kullanıcının son verileri bağlam olarak eklenir
router.post("/coach", authenticateToken, async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Invalid request",
        details: "messages array is required",
      });
    }

    const sanitized = messages
      .slice(-12)
      .filter(
        (m) =>
          m &&
          ["user", "assistant"].includes(m.role) &&
          typeof m.content === "string"
      )
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

    if (sanitized.length === 0) {
      return res.status(400).json({ error: "No valid messages" });
    }

    // Kullanıcı bağlamı: profil + son 7 gün + son kilo
    const [profile, recentDays, lastWeight] = await Promise.all([
      db.query(
        "SELECT first_name, gender, height, weight, activity_level FROM users WHERE id = $1",
        [req.userId]
      ),
      db.query(
        `SELECT date, total_calories_consumed, daily_calorie_goal,
                total_protein_consumed, water_consumed
         FROM user_daily_data WHERE user_id = $1
         ORDER BY date DESC LIMIT 7`,
        [req.userId]
      ),
      db.query(
        `SELECT weight_kg, logged_date FROM weight_logs
         WHERE user_id = $1 ORDER BY logged_date DESC LIMIT 1`,
        [req.userId]
      ),
    ]);

    const u = profile.rows[0] || {};
    const days = recentDays.rows
      .map(
        (d) =>
          `${d.date.toISOString().split("T")[0]}: ${Math.round(
            d.total_calories_consumed
          )}/${d.daily_calorie_goal} kcal, ${Math.round(
            d.total_protein_consumed
          )}g protein, ${d.water_consumed}ml water`
      )
      .join("; ");

    const systemPrompt = `You are NutriTrack's friendly nutrition coach. Be concise (max ~120 words), practical, and encouraging. Never make medical claims or diagnose; suggest consulting a professional for medical questions. Use the user's data when relevant.
User: ${u.first_name || "User"}, ${u.gender || "unknown"}, ${
      u.height || "?"
    }cm, ${u.weight || "?"}kg, activity level ${u.activity_level || "?"}/5.
Latest logged weight: ${
      lastWeight.rows[0]
        ? `${lastWeight.rows[0].weight_kg}kg`
        : "none"
    }.
Last 7 days: ${days || "no data yet"}.`;

    const reply = await callGroq(CHAT_MODEL, [
      { role: "system", content: systemPrompt },
      ...sanitized,
    ]);

    res.json({ success: true, reply });
  } catch (err) {
    console.error("AI coach error:", err.message);
    res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : "Server error" });
  }
});

module.exports = router;
