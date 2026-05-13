import { useState } from "react";

export default function Comment({ comment, onDelete, canDelete }) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div className="comment" onMouseEnter={() => setShowDelete(true)} onMouseLeave={() => setShowDelete(false)}>
      <img src={comment.profile_picture || "https://via.placeholder.com/32"} alt="" className="avatar-small" />
      <div className="comment-content">
        <span className="comment-username">{comment.username}</span>
        <span className="comment-text">{comment.content}</span>
      </div>
      {(showDelete && canDelete) && (
        <button className="btn-delete-comment" onClick={() => onDelete(comment.id)}>Delete</button>
      )}
    </div>
  );
}