import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function FollowList() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const type = location.pathname.includes("/followers") ? "followers" : "following";

  const targetUserId = userId ? parseInt(userId) : currentUser?.id;

  useEffect(() => {
    fetchUsers();
  }, [targetUserId, type]);

  const fetchUsers = async () => {
    try {
      const endpoint = type === "followers"
        ? `/api/users/${targetUserId}/followers`
        : `/api/users/${targetUserId}/following`;
      const res = await axios.get(endpoint);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleFollow = async (userId) => {
    try {
      const user = users.find(u => u.id === userId);
      if (user?.is_following) {
        await axios.delete(`/api/users/${userId}/follow`);
      } else {
        await axios.post(`/api/users/${userId}/follow`);
      }
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="follow-list-page">
      <div className="follow-list-header">
        <Link to={`/profile/${targetUserId}`} className="back-btn">← Back</Link>
        <h1>{type === "followers" ? "Followers" : "Following"}</h1>
      </div>
      {users.length === 0 ? (
        <p className="no-users">No {type} yet.</p>
      ) : (
        <div className="follow-list">
          {users.map(u => (
            <div key={u.id} className="follow-item">
              <Link to={`/profile/${u.id}`} className="follow-user">
                <img src={u.profile_picture || "https://via.placeholder.com/40"} alt="" className="avatar" />
                <div className="follow-user-info">
                  <span className="follow-username">{u.username}</span>
                  {u.full_name && <span className="follow-fullname">{u.full_name}</span>}
                </div>
              </Link>
              {currentUser?.id !== u.id && (
                <button
                  onClick={() => handleFollow(u.id)}
                  className={`btn-follow-small ${u.is_following ? "following" : ""}`}
                >
                  {u.is_following ? "Unfollow" : "Follow"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}