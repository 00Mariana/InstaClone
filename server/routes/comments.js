const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const { escapeHtml } = require("../utils/sanitize");

const router = express.Router();

router.post("/:postId", auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }
    const sanitized = escapeHtml(content.trim());
    const post = await pool.query("SELECT user_id FROM posts WHERE id = $1", [req.params.postId]);
    if (post.rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }
    const postOwnerId = post.rows[0].user_id;
    
    const newComment = await pool.query(
      "INSERT INTO comments (user_id, post_id, content) VALUES ($1, $2, $3) RETURNING *",
      [req.user.id, req.params.postId, sanitized]
    );
    
    if (postOwnerId !== req.user.id) {
      await pool.query(
        "INSERT INTO notifications (user_id, type, from_user_id, post_id) VALUES ($1, 'comment', $2, $3)",
        [postOwnerId, req.user.id, req.params.postId]
      );
    }
    
    const user = await pool.query("SELECT username, profile_picture FROM users WHERE id = $1", [req.user.id]);
    res.json({ ...newComment.rows[0], user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:postId", auth, async (req, res) => {
  try {
    const comments = await pool.query(`
      SELECT c.*, u.username, u.profile_picture,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as like_count,
        EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = $1) as liked
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $2
      ORDER BY c.created_at ASC
    `, [req.user.id, req.params.postId]);
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

router.post("/:id/like", auth, async (req, res) => {
  try {
    const { liked } = req.body;
    if (liked) {
      await pool.query(
        "DELETE FROM comment_likes WHERE user_id = $1 AND comment_id = $2",
        [req.user.id, req.params.id]
      );
    } else {
      await pool.query(
        "INSERT INTO comment_likes (user_id, comment_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [req.user.id, req.params.id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id/likes", auth, async (req, res) => {
  try {
    const likes = await pool.query(`
      SELECT u.id, u.username, u.profile_picture
      FROM comment_likes cl
      JOIN users u ON cl.user_id = u.id
      WHERE cl.comment_id = $1
    `, [req.params.id]);
    res.json(likes.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;