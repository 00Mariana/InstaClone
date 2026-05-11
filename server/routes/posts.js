const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const { parser } = require("../config/cloudinary");

const router = express.Router();

router.post("/", auth, parser.single("image"), async (req, res) => {
  try {
    const { caption } = req.body;
    const image_url = req.file.path;
    const newPost = await pool.query(
      "INSERT INTO posts (user_id, image_url, caption) VALUES ($1, $2, $3) RETURNING *",
      [req.user.id, image_url, caption || ""]
    );
    res.json(newPost.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const posts = await pool.query(`
      SELECT p.*, u.username, u.profile_picture,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);
    res.json(posts.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/feed", auth, async (req, res) => {
  try {
    const posts = await pool.query(`
      SELECT p.*, u.username, u.profile_picture,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id IN (
        SELECT following_id FROM follows WHERE follower_id = $1
      ) OR p.user_id = $1
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    res.json(posts.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/user/:userId", auth, async (req, res) => {
  try {
    const posts = await pool.query(`
      SELECT p.*, u.username, u.profile_picture,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
    `, [req.params.userId]);
    res.json(posts.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await pool.query("SELECT * FROM posts WHERE id = $1", [req.params.id]);
    if (post.rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    await pool.query("DELETE FROM posts WHERE id = $1", [req.params.id]);
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;