const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const { escapeHtml } = require("../utils/sanitize");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const conversations = await pool.query(`
      SELECT c.id,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT type FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_type,
        (SELECT post_id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_post_id,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
        u.id as other_user_id, u.username as other_username, u.profile_picture as other_profile_picture
      FROM conversations c
      JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = $1
      JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id != $1
      JOIN users u ON cp2.user_id = u.id
      ORDER BY last_message_at DESC
    `, [req.user.id]);

    const postIds = conversations.rows
      .filter(r => r.last_message_type === "post_share" && r.last_message_post_id)
      .map(r => r.last_message_post_id);

    if (postIds.length > 0) {
      const posts = await pool.query(
        `SELECT id, image_url FROM posts WHERE id = ANY($1)`,
        [postIds]
      );
      const postMap = {};
      posts.rows.forEach(p => { postMap[p.id] = p; });
      conversations.rows.forEach(r => {
        if (r.last_message_type === "post_share" && r.last_message_post_id) {
          r.last_message_post = postMap[r.last_message_post_id] || null;
        }
      });
    }

    res.json(conversations.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:conversationId", auth, async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = req.user.id;

    const participant = await pool.query(
      "SELECT * FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2",
      [conversationId, userId]
    );

    if (participant.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized to view this conversation" });
    }

    const messages = await pool.query(`
      SELECT m.*, u.username, u.profile_picture,
        CASE WHEN m.type = 'post_share' AND m.post_id IS NOT NULL
          THEN (SELECT json_build_object('id', p.id, 'image_url', p.image_url) FROM posts p WHERE p.id = m.post_id)
          ELSE NULL
        END as shared_post
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
    `, [conversationId]);
    res.json(messages.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/:userId", auth, async (req, res) => {
  try {
    const { content, postId } = req.body;
    let conversation = await pool.query(`
      SELECT c.id FROM conversations c
      JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = $1
      JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = $2
    `, [req.user.id, req.params.userId]);

    let conversationId;
    if (conversation.rows.length === 0) {
      const newConv = await pool.query("INSERT INTO conversations DEFAULT VALUES RETURNING id");
      conversationId = newConv.rows[0].id;
      await pool.query("INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)", [conversationId, req.user.id, req.params.userId]);
    } else {
      conversationId = conversation.rows[0].id;
    }

    const messageType = postId ? "post_share" : "text";
    const newMessage = await pool.query(
      "INSERT INTO messages (conversation_id, sender_id, content, type, post_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [conversationId, req.user.id, content || "", messageType, postId || null]
    );
    res.json(newMessage.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/:conversationId/message", auth, async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }
    const sanitized = escapeHtml(content.trim());

    const participant = await pool.query(
      "SELECT * FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2",
      [conversationId, userId]
    );

    if (participant.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized to message in this conversation" });
    }

    const newMessage = await pool.query(
      "INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *",
      [conversationId, userId, sanitized]
    );
    res.json(newMessage.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/message/:messageId", auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }
    const sanitized = escapeHtml(content.trim());

    const message = await pool.query("SELECT * FROM messages WHERE id = $1", [req.params.messageId]);
    if (message.rows.length === 0) {
      return res.status(404).json({ message: "Message not found" });
    }
    if (message.rows[0].sender_id !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updated = await pool.query(
      "UPDATE messages SET content = $1 WHERE id = $2 RETURNING *",
      [sanitized, req.params.messageId]
    );
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/message/:messageId", auth, async (req, res) => {
  try {
    const message = await pool.query("SELECT * FROM messages WHERE id = $1", [req.params.messageId]);
    if (message.rows.length === 0) {
      return res.status(404).json({ message: "Message not found" });
    }
    if (message.rows[0].sender_id !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    await pool.query("DELETE FROM messages WHERE id = $1", [req.params.messageId]);
    res.json({ message: "Message deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;