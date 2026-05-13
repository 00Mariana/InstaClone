import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import Notifications from "./Notifications";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <nav className="navbar">
      <Link to="/" className="logo-text">InstaClone</Link>
      {user && (
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/explore">Explore</Link>
          <Link to="/messages">💬</Link>
          <Link to="/bookmarks">🔖</Link>
          <div className="notification-wrapper">
            <button onClick={() => setShowNotifications(!showNotifications)} className="notification-btn">
              🔔
              {count > 0 && <span className="notification-badge">{count}</span>}
            </button>
            {showNotifications && <Notifications onClose={() => setShowNotifications(false)} />}
          </div>
          <Link to={`/profile/${user.id}`}>Profile</Link>
          <button onClick={logout} className="btn-logout">Logout</button>
        </div>
      )}
    </nav>
  );
}