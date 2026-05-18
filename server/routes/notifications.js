const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const notifications = await pool.query(`
      SELECT n.*, u.username, u.profile_picture, p.image_url as post_image
      FROM notifications n
      JOIN users u ON n.from_user_id = u.id
      LEFT JOIN posts p ON n.post_id = p.id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT 20
    `, [req.user.id]);
    res.json(notifications.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/count", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = FALSE",
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/read", auth, async (req, res) => {
  try {
    await pool.query(
      "UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE",
      [req.user.id]
    );
    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;