// backend/jest.setup.js
// Testler HOST üzerinde çalışır ve Docker'daki Postgres'e localhost:5432 ile
// bağlanır. Gizli değerler depoya GİRMEZ: kök .env (gitignore'lu) buradan okunur.
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

process.env.NODE_ENV = process.env.NODE_ENV || "test";

// .env yoksa makul yerel varsayılanlar (compose default'larıyla uyumlu).
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://postgres:nutritrack_dev@localhost:5432/nutritrack";
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test_jwt_secret_local_only";
}
