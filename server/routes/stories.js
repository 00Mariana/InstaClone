const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const { parser } = require("../config/cloudinary");

const router = express.Router();

router.get("/active", auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT user_id FROM stories
      WHERE user_id != $1 AND created_at > NOW() - INTERVAL '24 hours'
      AND id NOT IN (
        SELECT DISTINCT story_id FROM story_views WHERE user_id = $1
      )
    `, [req.user.id]);
    res.json(result.rows.map(r => r.user_id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/:id/view", auth, async (req, res) => {
  try {
    await pool.query(
      "INSERT INTO story_views (story_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [req.params.id, req.user.id]
    );
    res.json({ message: "Story viewed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", auth, parser.single("image"), async (req, res) => {
  console.log("POST /api/stories called");
  try {
    const image_url = req.file.path;
    const newStory = await pool.query(
      "INSERT INTO stories (user_id, image_url) VALUES ($1, $2) RETURNING *",
      [req.user.id, image_url]
    );
    res.json(newStory.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/feed", auth, async (req, res) => {
  console.log("GET /api/stories/feed called, user:", req.user?.id);
  try {
    const stories = await pool.query(`
      SELECT s.*, u.username, u.profile_picture
      FROM stories s
      JOIN users u ON s.user_id = u.id
      WHERE (s.user_id IN (
        SELECT following_id FROM follows WHERE follower_id = $1
      ) OR s.user_id = $1)
      AND s.created_at > NOW() - INTERVAL '24 hours'
      ORDER BY s.created_at DESC
    `, [req.user.id]);
    res.json(stories.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/user/:userId", auth, async (req, res) => {
  console.log("GET /api/stories/user/:userId called");
  try {
    const stories = await pool.query(`
      SELECT s.*, u.username, u.profile_picture
      FROM stories s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = $1 AND s.created_at > NOW() - INTERVAL '24 hours'
      ORDER BY s.created_at DESC
    `, [req.params.userId]);
    res.json(stories.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  console.log("DELETE /api/stories/:id called");
  try {
    const story = await pool.query("SELECT * FROM stories WHERE id = $1", [req.params.id]);
    if (story.rows.length === 0) {
      return res.status(404).json({ message: "Story not found" });
    }
    if (story.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    await pool.query("DELETE FROM stories WHERE id = $1", [req.params.id]);
    res.json({ message: "Story deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;