import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function Comment({ comment, onDelete, canDelete }) {
  const [showDelete, setShowDelete] = useState(false);
  const [liked, setLiked] = useState(comment.liked);
  const [likeCount, setLikeCount] = useState(parseInt(comment.like_count) || 0);

  const handleLike = async () => {
    try {
      await axios.post(`/api/comments/${comment.id}/like`, { liked });
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const renderContent = (text) => {
    if (!text) return null;
    const parts = text.split(/(#\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("#")) {
        return <Link key={i} to={`/explore?tag=${part.slice(1)}`} className="hashtag">{part}</Link>;
      }
      return part;
    });
  };

  return (
    <div className="comment" onMouseEnter={() => setShowDelete(true)} onMouseLeave={() => setShowDelete(false)}>
      <img src={comment.profile_picture || "https://via.placeholder.com/32"} alt="" className="avatar-small" />
      <div className="comment-content">
        <span className="comment-username">{comment.username}</span>
        <span className="comment-text">{renderContent(comment.content)}</span>
        <button className="btn-comment-like" onClick={handleLike}>
          {liked ? "♥" : "♡"} {likeCount > 0 && likeCount}
        </button>
      </div>
      {(showDelete && canDelete) && (
        <button className="btn-delete-comment" onClick={() => onDelete(comment.id)}>Delete</button>
      )}
    </div>
  );
}