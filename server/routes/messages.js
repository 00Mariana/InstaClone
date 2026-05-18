const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const conversations = await pool.query(`
      SELECT c.id, 
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
        u.id as other_user_id, u.username as other_username, u.profile_picture as other_profile_picture
      FROM conversations c
      JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = $1
      JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id != $1
      JOIN users u ON cp2.user_id = u.id
      ORDER BY last_message_at DESC
    `, [req.user.id]);
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
      SELECT m.*, u.username, u.profile_picture
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
    const { content } = req.body;
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

    const newMessage = await pool.query(
      "INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *",
      [conversationId, req.user.id, content]
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

    const participant = await pool.query(
      "SELECT * FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2",
      [conversationId, userId]
    );

    if (participant.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized to message in this conversation" });
    }

    const newMessage = await pool.query(
      "INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *",
      [conversationId, userId, content]
    );
    res.json(newMessage.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;