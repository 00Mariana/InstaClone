import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Comment from "../components/Comment";

export default function PostPage() {
  const { postId } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const renderCaption = (text) => {
    if (!text) return null;
    const parts = text.split(/(#\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("#")) {
        return <Link key={i} to={`/explore?tag=${part.slice(1)}`} className="hashtag">{part}</Link>;
      }
      return part;
    });
  };

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const res = await axios.get(`/api/posts/${postId}`);
      if (res.data) {
        setPost(res.data);
        setLiked(res.data.user_liked || false);
        setLikeCount(parseInt(res.data.like_count || 0));
        setBookmarked(res.data.bookmarked || false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await axios.get(`/api/comments/${postId}`);
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async () => {
    try {
      if (liked) {
        const res = await axios.delete(`/api/likes/${postId}`);
        setLiked(false);
        setLikeCount(res.data.count);
      } else {
        const res = await axios.post(`/api/likes/${postId}`);
        setLiked(true);
        setLikeCount(res.data.count);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookmark = async () => {
    try {
      if (bookmarked) {
        await axios.delete(`/api/bookmarks/${postId}`);
        setBookmarked(false);
      } else {
        await axios.post(`/api/bookmarks/${postId}`);
        setBookmarked(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await axios.post(`/api/comments/${postId}`, { content: newComment });
      setComments([...comments, res.data]);
      setNewComment("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`/api/comments/${commentId}`);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await axios.get(`/api/users/search/${query}`);
      setSearchResults(res.data.filter(u => u.id !== user?.id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareToUser = async (userId) => {
    try {
      await axios.post(`/api/messages/${userId}`, {
        content: `Shared a post: ${post.caption || ""}`,
        postId: post.id
      });
      setShowShareModal(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      console.error(err);
    }
  };

  if (!post) return <div className="loading">Loading...</div>;

  return (
    <div className="post-page">
      <div className="post-page-main">
        <img src={post.image_url} alt="" className="post-page-image" />
      </div>
      <div className="post-page-sidebar">
        <div className="post-header">
          <img src={post.profile_picture || "https://via.placeholder.com/32"} alt="" className="avatar" />
          <Link to={`/profile/${post.user_id}`} className="username">{post.username}</Link>
        </div>
        <div className="comments-list">
          {post.caption && (
            <div className="caption-section">
              <img src={post.profile_picture || "https://via.placeholder.com/32"} alt="" className="avatar" />
              <div className="caption-content">
                <span className="caption-username">{post.username}</span>
                <span className="caption-text">{renderCaption(post.caption)}</span>
                {post.created_at !== post.updated_at && <span className="edited-label">Edited</span>}
              </div>
            </div>
          )}
          {post.location && <div className="post-location-caption">📍 {post.location}</div>}
          {comments.map(c => (
            <Comment key={c.id} comment={c} onDelete={handleDeleteComment} canDelete={c.user_id === user?.id} />
          ))}
        </div>
        <div className="post-actions">
          <Link to={`/post/${postId}/likes`} onClick={(e) => { if (liked) { e.preventDefault(); handleLike(); } }} className={`btn-like ${liked ? "liked" : ""}`}>
            {liked ? "♥" : "♡"} {likeCount}
          </Link>
          <button onClick={handleBookmark} className={`btn-bookmark ${bookmarked ? "bookmarked" : ""}`}>
            {bookmarked ? "🔖" : "📄"}
          </button>
          <button onClick={() => setShowShareModal(true)} className="btn-share">↗</button>
        </div>
        {showShareModal && (
          <div className="share-modal">
            <div className="share-modal-content">
              <h3>Share to</h3>
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => handleShareSearch(e.target.value)}
              />
              <div className="share-results">
                {searchResults.map(u => (
                  <div key={u.id} className="share-result-item" onClick={() => handleShareToUser(u.id)}>
                    <img src={u.profile_picture || "https://via.placeholder.com/32"} alt="" />
                    <span>{u.username}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowShareModal(false)} className="btn-close-share">Cancel</button>
            </div>
          </div>
        )}
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
    </div>
  );
}