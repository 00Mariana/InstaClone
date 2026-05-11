import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="logo-text">InstaClone</Link>
      {user && (
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to={`/profile/${user.id}`}>Profile</Link>
          <button onClick={logout} className="btn-logout">Logout</button>
        </div>
      )}
    </nav>
  );
}