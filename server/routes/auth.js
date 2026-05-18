const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ message: "Username must be between 3 and 30 characters" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      "INSERT INTO users (username, email, password, full_name) VALUES ($1, $2, $3, $4) RETURNING id, username, email, full_name, profile_picture, bio, created_at",
      [username.trim(), email.trim().toLowerCase(), hashedPassword, full_name || ""]
    );
    const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    res.json({ token, user: newUser.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ message: "Username or email already exists" });
    }
    res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    const { password: _, ...userData } = user.rows[0];
    res.json({ token, user: userData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT id, username, email, full_name, profile_picture, bio, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;