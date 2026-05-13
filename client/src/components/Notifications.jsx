import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function Notifications({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/notifications");
      setNotifications(res.data);
      await axios.put("http://localhost:5000/api/notifications/read");
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const getMessage = (notification) => {
    switch (notification.type) {
      case "like":
        return "liked your post";
      case "comment":
        return "commented on your post";
      case "follow":
        return "started following you";
      default:
        return "";
    }
  };

  return (
    <div className="notifications-dropdown">
      <div className="notifications-header">
        <h3>Notifications</h3>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>
      <div className="notifications-list">
        {loading ? (
          <p className="no-notifications">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="no-notifications">No notifications yet</p>
        ) : (
          notifications.map((n) => (
            <Link 
              to={n.post_id ? `/post/${n.post_id}` : `/profile/${n.from_user_id}`} 
              key={n.id} 
              className={`notification-item ${!n.read ? "unread" : ""}`}
              onClick={onClose}
            >
              <img 
                src={n.profile_picture || "https://via.placeholder.com/40"} 
                alt="" 
                className="avatar"
              />
              <div className="notification-content">
                <span className="notification-username">{n.username}</span> 
                <span className="notification-text">{getMessage(n)}</span>
              </div>
              {n.post_image && (
                <img src={n.post_image} alt="" className="notification-post-thumb" />
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}