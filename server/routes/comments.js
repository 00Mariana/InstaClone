const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/:postId", auth, async (req, res) => {
  try {
    const { content } = req.body;
    const newComment = await pool.query(
      "INSERT INTO comments (user_id, post_id, content) VALUES ($1, $2, $3) RETURNING *",
      [req.user.id, req.params.postId, content]
    );
    const user = await pool.query("SELECT username, profile_picture FROM users WHERE id = $1", [req.user.id]);
    res.json({ ...newComment.rows[0], user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:postId", auth, async (req, res) => {
  try {
    const comments = await pool.query(`
      SELECT c.*, u.username, u.profile_picture
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [req.params.postId]);
    res.json(comments.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const comment = await pool.query("SELECT * FROM comments WHERE id = $1", [req.params.id]);
    if (comment.rows.length === 0) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (comment.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    await pool.query("DELETE FROM comments WHERE id = $1", [req.params.id]);
    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;