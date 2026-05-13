const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/:userId", auth, async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT id, username, email, full_name, profile_picture, bio, created_at FROM users WHERE id = $1",
      [req.params.userId]
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const postsCount = await pool.query("SELECT COUNT(*) FROM posts WHERE user_id = $1", [req.params.userId]);
    const followersCount = await pool.query("SELECT COUNT(*) FROM follows WHERE following_id = $1", [req.params.userId]);
    const followingCount = await pool.query("SELECT COUNT(*) FROM follows WHERE follower_id = $1", [req.params.userId]);
    const isFollowing = await pool.query(
      "SELECT * FROM follows WHERE follower_id = $1 AND following_id = $2",
      [req.user.id, req.params.userId]
    );
    res.json({
      ...user.rows[0],
      posts_count: parseInt(postsCount.rows[0].count),
      followers_count: parseInt(followersCount.rows[0].count),
      following_count: parseInt(followingCount.rows[0].count),
      is_following: isFollowing.rows.length > 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/", auth, async (req, res) => {
  try {
    const { username, full_name, bio, profile_picture } = req.body;
    const updated = await pool.query(
      "UPDATE users SET username = COALESCE(NULLIF($1, ''), username), full_name = COALESCE(NULLIF($2, ''), full_name), bio = COALESCE(NULLIF($3, ''), bio), profile_picture = COALESCE(NULLIF($4, ''), profile_picture) WHERE id = $5 RETURNING id, username, email, full_name, profile_picture, bio, created_at",
      [username, full_name, bio, profile_picture, req.user.id]
    );
    res.json(updated.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ message: "Username already taken" });
    }
    res.status(500).json({ message: err.message });
  }
});

router.post("/:userId/follow", auth, async (req, res) => {
  try {
    if (req.params.userId === req.user.id.toString()) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }
    await pool.query(
      "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [req.user.id, req.params.userId]
    );
    res.json({ message: "Followed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:userId/follow", auth, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
      [req.user.id, req.params.userId]
    );
    res.json({ message: "Unfollowed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/search/:query", auth, async (req, res) => {
  try {
    const { query } = req.params;
    const users = await pool.query(
      "SELECT id, username, full_name, profile_picture FROM users WHERE username ILIKE $1 LIMIT 20",
      [`%${query}%`]
    );
    res.json(users.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;