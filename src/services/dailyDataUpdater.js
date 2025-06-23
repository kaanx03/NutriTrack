// backend/src/services/dailyDataUpdater.js - Service to update user_daily_data
const db = require("../db");

class DailyDataUpdater {
  // Kullanıcının bugünkü verilerini güncelle
  static async updateUserDailyData(userId, date = null) {
    const client = await db.beginTransaction();

    try {
      const targetDate = date || new Date().toISOString().split("T")[0];
      console.log(`Updating daily data for user ${userId} on ${targetDate}`);

      // Food entries'dan toplam besin değerlerini al
      const foodData = await client.query(
        `
        SELECT 
          COALESCE(SUM(total_calories), 0) as total_calories_consumed,
          COALESCE(SUM(total_protein), 0) as total_protein_consumed,
          COALESCE(SUM(total_carbs), 0) as total_carbs_consumed,
          COALESCE(SUM(total_fat), 0) as total_fat_consumed
        FROM food_entries 
        WHERE user_id = $1 AND entry_date = $2
      `,
        [userId, targetDate]
      );

      // Activity logs'dan toplam yakılan kaloriyi al
      const activityData = await client.query(
        `
        SELECT COALESCE(SUM(calories_burned), 0) as total_calories_burned
        FROM activity_logs 
        WHERE user_id = $1 AND entry_date = $2
      `,
        [userId, targetDate]
      );

      // Water logs'dan toplam su tüketimini al
      const waterData = await client.query(
        `
        SELECT COALESCE(SUM(amount_ml), 0) as water_consumed
        FROM water_logs 
        WHERE user_id = $1 AND entry_date = $2
      `,
        [userId, targetDate]
      );

      // Weight logs'dan o günkü kiloyu al (varsa)
      const weightData = await client.query(
        `
        SELECT weight_kg, bmi 
        FROM weight_logs 
        WHERE user_id = $1 AND logged_date = $2
        ORDER BY created_at DESC
        LIMIT 1
      `,
        [userId, targetDate]
      );

      // Kullanıcının hedeflerini al
      const targetsData = await client.query(
        `
        SELECT 
          daily_calories, daily_protein, daily_carbs, daily_fat, water_target
        FROM user_daily_targets 
        WHERE user_id = $1
      `,
        [userId]
      );

      const food = foodData.rows[0];
      const activity = activityData.rows[0];
      const water = waterData.rows[0];
      const weight = weightData.rows[0];
      const targets = targetsData.rows[0] || {};

      // user_daily_data tablosuna upsert yap
      const upsertQuery = `
        INSERT INTO user_daily_data (
          user_id, 
          date,
          total_calories_consumed,
          total_protein_consumed,
          total_carbs_consumed,
          total_fat_consumed,
          total_calories_burned,
          water_consumed,
          weight_kg,
          daily_calorie_goal,
          daily_protein_goal,
          daily_carbs_goal,
          daily_fat_goal,
          daily_water_goal,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW()
        )
        ON CONFLICT (user_id, date) 
        DO UPDATE SET
          total_calories_consumed = EXCLUDED.total_calories_consumed,
          total_protein_consumed = EXCLUDED.total_protein_consumed,
          total_carbs_consumed = EXCLUDED.total_carbs_consumed,
          total_fat_consumed = EXCLUDED.total_fat_consumed,
          total_calories_burned = EXCLUDED.total_calories_burned,
          water_consumed = EXCLUDED.water_consumed,
          weight_kg = COALESCE(EXCLUDED.weight_kg, user_daily_data.weight_kg),
          daily_calorie_goal = EXCLUDED.daily_calorie_goal,
          daily_protein_goal = EXCLUDED.daily_protein_goal,
          daily_carbs_goal = EXCLUDED.daily_carbs_goal,
          daily_fat_goal = EXCLUDED.daily_fat_goal,
          daily_water_goal = EXCLUDED.daily_water_goal,
          updated_at = NOW()
        RETURNING *
      `;

      const result = await client.query(upsertQuery, [
        userId,
        targetDate,
        parseFloat(food.total_calories_consumed) || 0,
        parseFloat(food.total_protein_consumed) || 0,
        parseFloat(food.total_carbs_consumed) || 0,
        parseFloat(food.total_fat_consumed) || 0,
        parseFloat(activity.total_calories_burned) || 0,
        parseInt(water.water_consumed) || 0,
        weight ? parseFloat(weight.weight_kg) : null,
        targets.daily_calories || 2000,
        targets.daily_protein || 150,
        targets.daily_carbs || 300,
        targets.daily_fat || 80,
        targets.water_target || 2500,
      ]);

      await db.commitTransaction(client);

      console.log(`Daily data updated for user ${userId}:`, result.rows[0]);
      return result.rows[0];
    } catch (error) {
      await db.rollbackTransaction(client);
      console.error("Daily data update error:", error);
      throw error;
    }
  }

  // Tüm aktif kullanıcılar için bugünkü verileri güncelle
  static async updateAllUsersDailyData(date = null) {
    try {
      const targetDate = date || new Date().toISOString().split("T")[0];
      console.log(`Updating daily data for all users on ${targetDate}`);

      // Aktif kullanıcıları al
      const activeUsers = await db.query(`
        SELECT id FROM users WHERE is_active = true
      `);

      let updateCount = 0;
      let errorCount = 0;

      for (const user of activeUsers.rows) {
        try {
          await this.updateUserDailyData(user.id, targetDate);
          updateCount++;
        } catch (error) {
          console.error(
            `Failed to update daily data for user ${user.id}:`,
            error
          );
          errorCount++;
        }
      }

      console.log(
        `Daily data update completed. Updated: ${updateCount}, Errors: ${errorCount}`
      );
      return { updateCount, errorCount };
    } catch (error) {
      console.error("Bulk daily data update error:", error);
      throw error;
    }
  }

  // Middleware: Food entry eklendikten sonra daily data'yı güncelle
  static async afterFoodEntry(req, res, next) {
    try {
      const userId = req.userId;
      const entryDate =
        req.body.entry_date || new Date().toISOString().split("T")[0];

      // Daily data'yı güncelle
      await this.updateUserDailyData(userId, entryDate);

      next();
    } catch (error) {
      console.error("After food entry daily data update error:", error);
      // Hata olsa bile devam et
      next();
    }
  }

  // Middleware: Activity log eklendikten sonra daily data'yı güncelle
  static async afterActivityLog(req, res, next) {
    try {
      const userId = req.userId;
      const entryDate =
        req.body.entry_date || new Date().toISOString().split("T")[0];

      // Daily data'yı güncelle
      await this.updateUserDailyData(userId, entryDate);

      next();
    } catch (error) {
      console.error("After activity log daily data update error:", error);
      // Hata olsa bile devam et
      next();
    }
  }

  // Middleware: Water log eklendikten sonra daily data'yı güncelle
  static async afterWaterLog(req, res, next) {
    try {
      const userId = req.userId;
      const entryDate =
        req.body.entry_date || new Date().toISOString().split("T")[0];

      // Daily data'yı güncelle
      await this.updateUserDailyData(userId, entryDate);

      next();
    } catch (error) {
      console.error("After water log daily data update error:", error);
      // Hata olsa bile devam et
      next();
    }
  }

  // Middleware: Weight log eklendikten sonra daily data'yı güncelle
  static async afterWeightLog(req, res, next) {
    try {
      const userId = req.userId;
      const loggedDate =
        req.body.logged_date || new Date().toISOString().split("T")[0];

      // Daily data'yı güncelle
      await this.updateUserDailyData(userId, loggedDate);

      next();
    } catch (error) {
      console.error("After weight log daily data update error:", error);
      // Hata olsa bile devam et
      next();
    }
  }

  // Son 30 günün eksik verilerini doldur
  static async backfillMissingData(userId, days = 30) {
    try {
      console.log(`Backfilling ${days} days of data for user ${userId}`);

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        try {
          await this.updateUserDailyData(userId, dateStr);
          successCount++;
        } catch (error) {
          console.error(`Failed to backfill data for ${dateStr}:`, error);
          errorCount++;
        }
      }

      console.log(
        `Backfill completed for user ${userId}. Success: ${successCount}, Errors: ${errorCount}`
      );
      return { successCount, errorCount };
    } catch (error) {
      console.error("Backfill error:", error);
      throw error;
    }
  }
}

module.exports = DailyDataUpdater;
