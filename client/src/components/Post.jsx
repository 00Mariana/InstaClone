import { useState } from "react";
import axios from "axios";
import Comment from "./Comment";

export default function Post({ post, onUpdate, isOwner }) {
  const [liked, setLiked] = useState(post.user_liked || false);
  const [likeCount, setLikeCount] = useState(parseInt(post.like_count || 0));
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [caption, setCaption] = useState(post.caption || "");

  const handleLike = async () => {
    try {
      if (liked) {
        const res = await axios.delete(`http://localhost:5000/api/likes/${post.id}`);
        setLiked(false);
        setLikeCount(res.data.count);
      } else {
        const res = await axios.post(`http://localhost:5000/api/likes/${post.id}`);
        setLiked(true);
        setLikeCount(res.data.count);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await axios.post(`http://localhost:5000/api/comments/${post.id}`, { content: newComment });
      setComments([...comments, res.data]);
      setNewComment("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`http://localhost:5000/api/comments/${commentId}`);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm("Delete this post?")) {
      try {
        await axios.delete(`http://localhost:5000/api/posts/${post.id}`);
        if (onUpdate) onUpdate();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdateCaption = async () => {
    try {
      await axios.put(`http://localhost:5000/api/posts/${post.id}`, { caption });
      alert("Caption updated!");
    } catch (err) {
      console.error(err);
    }
  };

  const loadComments = async () => {
    if (!showComments) {
      try {
        const res = await axios.get(`http://localhost:5000/api/comments/${post.id}`);
        setComments(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    setShowComments(!showComments);
  };

  return (
    <div className="post">
      <div className="post-header">
        <img src={post.profile_picture || "https://via.placeholder.com/32"} alt="" className="avatar" />
        <span className="username">{post.username}</span>
        {isOwner && (
          <div className="post-actions">
            <button onClick={handleDeletePost} className="btn-delete-post">Delete</button>
          </div>
        )}
      </div>
      <img src={post.image_url} alt="" className="post-image" />
      <div className="post-actions">
        <button onClick={handleLike} className={`btn-like ${liked ? "liked" : ""}`}>
          {liked ? "Unlike" : "Like"} ({likeCount})
        </button>
        <button onClick={loadComments} className="btn-comment">Comment ({post.comment_count || 0})</button>
      </div>
      {isOwner && (
        <div className="edit-caption">
          <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Edit caption..." />
          <button onClick={handleUpdateCaption}>Update</button>
        </div>
      )}
      {post.caption && <p className="post-caption"><strong>{post.username}</strong> {post.caption}</p>}
      {showComments && (
        <div className="comments-section">
          {comments.map(c => (
            <Comment key={c.id} comment={c} onDelete={handleDeleteComment} />
          ))}
          <form onSubmit={handleAddComment} className="comment-form">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
            />
            <button type="submit">Post</button>
          </form>
        </div>
      )}
    </div>
  );
}