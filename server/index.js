const express = require("express");
const cors = require("cors");
require("dotenv").config();
const pool = require("./db");

const authRoutes = require("./routes/auth");
const postsRoutes = require("./routes/posts");
const usersRoutes = require("./routes/users");
const commentsRoutes = require("./routes/comments");
const likesRoutes = require("./routes/likes");
const notificationsRoutes = require("./routes/notifications");
const storiesRoutes = require("./routes/stories");
const bookmarksRoutes = require("./routes/bookmarks");
const messagesRoutes = require("./routes/messages");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/likes", likesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/stories", storiesRoutes);
app.use("/api/bookmarks", bookmarksRoutes);
app.use("/api/messages", messagesRoutes);

app.get("/", (req, res) => {
  res.json({ message: "InstaClone API is running!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

module.exports = app;
