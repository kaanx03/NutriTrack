// backend/src/middleware/auth.js - Authentication Middleware
const jwt = require("jsonwebtoken");
const db = require("../db");

// JWT token doğrulama middleware'i
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: "Access token required",
        message: "Authorization header with Bearer token is required",
      });
    }

    // Token'ı doğrula
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "nutritrack_secret"
    );

    // Kullanıcının aktif olup olmadığını kontrol et
    const userResult = await db.query(
      "SELECT id, email, is_active FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: "User not found",
        message: "Token is valid but user does not exist",
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        error: "Account deactivated",
        message: "User account has been deactivated",
      });
    }

    // Request objesine kullanıcı bilgilerini ekle
    req.userId = user.id;
    req.userEmail = user.email;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({
        error: "Invalid token",
        message: "The provided token is malformed or invalid",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(403).json({
        error: "Token expired",
        message: "The provided token has expired",
      });
    }

    return res.status(500).json({
      error: "Authentication error",
      message: "An error occurred during authentication",
    });
  }
};

// Optional auth - kullanıcı giriş yapmışsa bilgilerini al, yapmamışsa devam et
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      req.userId = null;
      req.userEmail = null;
      return next();
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "nutritrack_secret"
    );

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
  } catch (error) {
    // Hata durumunda da devam et, sadece kullanıcı bilgilerini null yap
    req.userId = null;
    req.userEmail = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
};
