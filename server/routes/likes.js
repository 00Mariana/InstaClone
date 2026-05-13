const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/:postId", auth, async (req, res) => {
  try {
    const post = await pool.query("SELECT user_id FROM posts WHERE id = $1", [req.params.postId]);
    if (post.rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }
    const postOwnerId = post.rows[0].user_id;
    
    await pool.query(
      "INSERT INTO likes (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [req.user.id, req.params.postId]
    );
    
    if (postOwnerId !== req.user.id) {
      await pool.query(
        "INSERT INTO notifications (user_id, type, from_user_id, post_id) VALUES ($1, 'like', $2, $3)",
        [postOwnerId, req.user.id, req.params.postId]
      );
    }
    
    const count = await pool.query("SELECT COUNT(*) FROM likes WHERE post_id = $1", [req.params.postId]);
    res.json({ liked: true, count: parseInt(count.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:postId", auth, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM likes WHERE user_id = $1 AND post_id = $2",
      [req.user.id, req.params.postId]
    );
    const count = await pool.query("SELECT COUNT(*) FROM likes WHERE post_id = $1", [req.params.postId]);
    res.json({ liked: false, count: parseInt(count.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:postId", auth, async (req, res) => {
  try {
    const like = await pool.query(
      "SELECT * FROM likes WHERE user_id = $1 AND post_id = $2",
      [req.user.id, req.params.postId]
    );
    const count = await pool.query("SELECT COUNT(*) FROM likes WHERE post_id = $1", [req.params.postId]);
    res.json({ liked: like.rows.length > 0, count: parseInt(count.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;