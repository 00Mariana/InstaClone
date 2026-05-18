const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/trending", auth, async (req, res) => {
  try {
    const tags = await pool.query(`
      SELECT h.id, h.name, COUNT(pt.post_id) as post_count
      FROM hashtags h
      JOIN post_tags pt ON pt.hashtag_id = h.id
      GROUP BY h.id, h.name
      ORDER BY post_count DESC
      LIMIT 20
    `);
    res.json(tags.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/search/:query", auth, async (req, res) => {
  try {
    const tags = await pool.query(`
      SELECT id, name FROM hashtags WHERE name ILIKE $1 LIMIT 20
    `, [`%${req.params.query}%`]);
    res.json(tags.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:tagId/posts", auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const posts = await pool.query(`
      SELECT p.*, u.username, u.profile_picture,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
      EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as user_liked,
      EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = $1) as bookmarked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN post_tags pt ON pt.post_id = p.id
      WHERE pt.hashtag_id = $2
      ORDER BY p.created_at DESC
      LIMIT $3 OFFSET $4
    `, [req.user.id, req.params.tagId, limit, offset]);
    res.json(posts.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const parseHashtags = (text) => {
  const regex = /#(\w+)/g;
  const matches = text.match(regex) || [];
  return [...new Set(matches.map(t => t.slice(1).toLowerCase()))];
};

const insertHashtags = async (postId, caption) => {
  const tags = parseHashtags(caption);
  for (const tag of tags) {
    try {
      const result = await pool.query(
        "INSERT INTO hashtags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id",
        [tag]
      );
      await pool.query(
        "INSERT INTO post_tags (post_id, hashtag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [postId, result.rows[0].id]
      );
    } catch (err) {
      console.error("Error inserting hashtag:", err);
    }
  }
};

const updateHashtags = async (postId, caption) => {
  await pool.query("DELETE FROM post_tags WHERE post_id = $1", [postId]);
  if (caption) {
    await insertHashtags(postId, caption);
  }
};

module.exports = router;
module.exports.parseHashtags = parseHashtags;
module.exports.insertHashtags = insertHashtags;
module.exports.updateHashtags = updateHashtags;