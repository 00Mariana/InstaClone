const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const bookmarks = await pool.query(`
      SELECT p.*, u.username, u.profile_picture,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
      EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as user_liked
      FROM bookmarks b
      JOIN posts p ON b.post_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [req.user.id]);
    res.json(bookmarks.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/:postId", auth, async (req, res) => {
  try {
    await pool.query(
      "INSERT INTO bookmarks (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [req.user.id, req.params.postId]
    );
    res.json({ message: "Post bookmarked" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:postId", auth, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM bookmarks WHERE user_id = $1 AND post_id = $2",
      [req.user.id, req.params.postId]
    );
    res.json({ message: "Bookmark removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;