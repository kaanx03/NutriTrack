// backend/__tests__/api.test.js
// Rota davranışı: auth 401 / doğrulama 400 / rate-limit 429 + yeni kullanıcı
// yolculuğu. Çalışan Docker Postgres'e (localhost:5432) karşı entegrasyon testi.
const request = require("supertest");
const app = require("../src/index");
const db = require("../src/db");

// Her koşuda benzersiz test kullanıcısı — tekrar çalıştırmada çakışma olmaz.
const EMAIL = `jest_${Date.now()}@example.com`;
const PASSWORD = "Sup3rSecret!";
let token;
let userId;

afterAll(async () => {
  // CASCADE sayesinde kullanıcıyı silmek tüm bağlı satırları temizler.
  await db.query("DELETE FROM users WHERE email LIKE 'jest_%'");
  await db.pool.end();
});

describe("Health", () => {
  it("GET /api/health -> 200", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("OK");
  });
});

describe("Signup validation (400)", () => {
  it("missing email+password -> 400", async () => {
    const res = await request(app).post("/api/auth/signup").send({});
    expect(res.status).toBe(400);
  });

  it("password too short -> 400", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: `jest_short_${Date.now()}@example.com`, password: "short" });
    expect(res.status).toBe(400);
  });

  it("invalid email format -> 400", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "not-an-email", password: PASSWORD });
    expect(res.status).toBe(400);
  });
});

describe("New-user journey", () => {
  it("signup -> 201 with token + user", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      email: EMAIL,
      password: PASSWORD,
      firstName: "Jest",
      lastName: "Tester",
      gender: "male",
      birthDate: "1995-01-01",
      height: 180,
      weight: 80,
      activityLevel: 3,
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(EMAIL);
    expect(res.body.nutritionTargets.dailyCalories).toBeGreaterThan(0);
    userId = res.body.user.id;
  });

  it("duplicate signup -> 400", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: EMAIL, password: PASSWORD });
    expect(res.status).toBe(400);
  });

  it("login wrong password -> 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: EMAIL, password: "wrongpass!" });
    expect(res.status).toBe(401);
  });

  it("login missing fields -> 400", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: EMAIL });
    expect(res.status).toBe(400);
  });

  it("login correct -> 200 with token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: EMAIL, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it("GET /api/user/profile with token -> 200", async () => {
    const res = await request(app)
      .get("/api/user/profile")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("GET /api/nutrition/daily/:date with token -> 200", async () => {
    const today = new Date().toISOString().split("T")[0];
    const res = await request(app)
      .get(`/api/nutrition/daily/${today}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.summary.goals.calories).toBeGreaterThan(0);
  });
});

describe("Auth required (401)", () => {
  const protectedRoutes = [
    ["get", "/api/user/profile"],
    ["get", `/api/nutrition/daily/${new Date().toISOString().split("T")[0]}`],
    ["get", "/api/food/meals"],
    ["get", "/api/activity/favorites"],
    ["get", "/api/activity-logs"],
  ];
  it.each(protectedRoutes)("%s %s without token -> 401", async (method, path) => {
    const res = await request(app)[method](path);
    expect(res.status).toBe(401);
  });

  it("invalid token -> 401/403", async () => {
    const res = await request(app)
      .get("/api/user/profile")
      .set("Authorization", "Bearer not.a.real.token");
    expect([401, 403]).toContain(res.status);
  });
});

describe("Rate limiting (429)", () => {
  // aiLimiter = 10 / dk; auth gerektirmez (limiter rotadan önce çalışır) →
  // 11. istek 429 dönmeli. Bu, davranışı deterministik doğrular.
  it("11th /api/ai request -> 429", async () => {
    let last;
    for (let i = 0; i < 11; i++) {
      last = await request(app).post("/api/ai/coach").send({ messages: [] });
    }
    expect(last.status).toBe(429);
  });
});
