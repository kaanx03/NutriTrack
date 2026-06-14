// backend/src/middleware/auth.js
const jwt = require("jsonwebtoken");
const db = require("../db");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is not set.");
  process.exit(1);
}

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Access token required",
        message: "Authorization header with Bearer token is required",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const userResult = await db.query(
      "SELECT id, email, is_active FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: "Account deactivated" });
    }

    req.userId = user.id;
    req.userEmail = user.email;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ error: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(403).json({ error: "Token expired" });
    }
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Authentication error" });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      req.userId = null;
      req.userEmail = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const userResult = await db.query(
      "SELECT id, email, is_active FROM users WHERE id = $1 AND is_active = true",
      [decoded.userId]
    );

    if (userResult.rows.length > 0) {
      req.userId = userResult.rows[0].id;
      req.userEmail = userResult.rows[0].email;
    } else {
      req.userId = null;
      req.userEmail = null;
    }

    next();
  } catch {
    req.userId = null;
    req.userEmail = null;
    next();
  }
};

module.exports = { authenticateToken, optionalAuth };
