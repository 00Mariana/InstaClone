import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function LikesList() {
  const { postId } = useParams();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followedIds, setFollowedIds] = useState(new Set());

  useEffect(() => {
    fetchUsers();
  }, [postId]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`/api/likes/${postId}/users`);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleFollow = async (userId) => {
    try {
      const targetUser = users.find(u => u.id === userId);
      if (targetUser?.is_following) {
        await axios.delete(`/api/users/${userId}/follow`);
      } else {
        await axios.post(`/api/users/${userId}/follow`);
        setFollowedIds(prev => new Set([...prev, userId]));
      }
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="likes-list-page">
      <div className="likes-list-header">
        <Link to={`/post/${postId}`} className="back-btn">← Back</Link>
        <h1>Likes</h1>
      </div>
      {users.length === 0 ? (
        <p className="no-users">No likes yet.</p>
      ) : (
        <div className="likes-list">
          {users.map(u => (
            <div key={u.id} className="likes-item">
              <Link to={`/profile/${u.id}`} className="likes-user">
                <img src={u.profile_picture || "https://via.placeholder.com/40"} alt="" className="avatar" />
                <div className="likes-user-info">
                  <span className="likes-username">{u.username}</span>
                  {u.full_name && <span className="likes-fullname">{u.full_name}</span>}
                </div>
              </Link>
              {user?.id !== u.id && (
                <button onClick={() => handleFollow(u.id)} className={`btn-follow-small ${u.is_following || followedIds.has(u.id) ? "following" : ""}`}>
                  {u.is_following || followedIds.has(u.id) ? "Following" : "Follow"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}