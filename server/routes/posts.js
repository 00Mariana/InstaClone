const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const { parser } = require("../config/cloudinary");

const router = express.Router();

const DEFAULT_LIMIT = 20;

const getPostQuery = (whereClause = "") => `
  SELECT p.*, u.username, u.profile_picture,
  (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
  (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
  EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as user_liked,
  EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = $1) as bookmarked
  FROM posts p
  JOIN users u ON p.user_id = u.id
  ${whereClause ? `WHERE ${whereClause}` : ""}
  ORDER BY p.created_at DESC
  LIMIT $2 OFFSET $3
`;

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
    const limit = parseInt(req.query.limit) || DEFAULT_LIMIT;
    const offset = parseInt(req.query.offset) || 0;
    const posts = await pool.query(getPostQuery(""), [req.user.id, limit, offset]);
    res.json(posts.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const posts = await pool.query(getPostQuery("p.id = $4"), [req.user.id, 1, 0, req.params.id]);
    if (posts.rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(posts.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/feed", auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || DEFAULT_LIMIT;
    const offset = parseInt(req.query.offset) || 0;
    const whereClause = "(p.user_id IN (SELECT following_id FROM follows WHERE follower_id = $1) OR p.user_id = $1)";
    const posts = await pool.query(getPostQuery(whereClause), [req.user.id, limit, offset]);
    res.json(posts.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/user/:userId", auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || DEFAULT_LIMIT;
    const offset = parseInt(req.query.offset) || 0;
    const whereClause = "p.user_id = $4";
    const posts = await pool.query(getPostQuery(whereClause), [req.user.id, limit, offset, req.params.userId]);
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

router.put("/:id", auth, async (req, res) => {
  try {
    const { caption } = req.body;
    const post = await pool.query("SELECT * FROM posts WHERE id = $1", [req.params.id]);
    if (post.rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    const updated = await pool.query(
      "UPDATE posts SET caption = $1 WHERE id = $2 RETURNING *",
      [caption || "", req.params.id]
    );
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/explore", auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || DEFAULT_LIMIT;
    const offset = parseInt(req.query.offset) || 0;
    const whereClause = "p.user_id != $1";
    const posts = await pool.query(getPostQuery(whereClause), [req.user.id, limit, offset]);
    res.json(posts.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;