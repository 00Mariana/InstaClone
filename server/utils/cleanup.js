const cron = require("node-cron");
const pool = require("./db");

const startCleanup = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      const result = await pool.query(`
        DELETE FROM stories WHERE created_at < NOW() - INTERVAL '24 hours'
      `);
      if (result.rowCount > 0) {
        console.log(`Cleaned up ${result.rowCount} expired stories`);
      }
    } catch (err) {
      console.error("Story cleanup error:", err.message);
    }
  });

  console.log("Story auto-cleanup cron scheduled (runs every hour)");
};

module.exports = { startCleanup };