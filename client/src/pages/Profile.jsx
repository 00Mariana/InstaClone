import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: "", full_name: "", bio: "" });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId ? parseInt(userId) : currentUser?.id;

  useEffect(() => {
    fetchProfile();
  }, [targetUserId]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`/api/users/${targetUserId}`);
      setProfile(res.data);
      setForm({ username: res.data.username, full_name: res.data.full_name || "", bio: res.data.bio || "" });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`/api/posts/user/${targetUserId}`);
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (targetUserId) fetchPosts();
  }, [targetUserId]);

  const handleFollow = async () => {
    try {
      if (profile.is_following) {
        await axios.delete(`/api/users/${targetUserId}/follow`);
      } else {
        await axios.post(`/api/users/${targetUserId}/follow`);
      }
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      let profile_picture = profile.profile_picture;
      if (file) {
        const formData = new FormData();
        formData.append("image", file);
        const res = await axios.post("/api/users/avatar", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        profile_picture = res.data.profile_picture;
      }
      await axios.put("/api/users", { ...form, profile_picture });
      setEditing(false);
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!profile) return <div className="error">User not found</div>;

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img src={profile.profile_picture || "https://via.placeholder.com/150"} alt="" className="profile-avatar" />
        <div className="profile-info">
          <div className="profile-username-row">
            <h1>{profile.username}</h1>
            {isOwnProfile ? (
              <button onClick={() => setEditing(!editing)} className="btn-secondary">{editing ? "Cancel" : "Edit Profile"}</button>
            ) : (
              <button onClick={handleFollow} className={`btn-follow ${profile.is_following ? "following" : ""}`}>
                {profile.is_following ? "Unfollow" : "Follow"}
              </button>
            )}
          </div>
          <div className="profile-stats">
            <span><strong>{profile.posts_count}</strong> posts</span>
            <Link to={`/profile/${targetUserId}/followers`}><strong>{profile.followers_count}</strong> followers</Link>
            <Link to={`/profile/${targetUserId}/following`}><strong>{profile.following_count}</strong> following</Link>
          </div>
          {profile.full_name && <p className="profile-fullname">{profile.full_name}</p>}
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
        </div>
      </div>
      {editing && (
        <form onSubmit={handleUpdateProfile} className="edit-profile-form">
          <h2>Edit Profile</h2>
          <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Username" />
          <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Full Name" />
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Bio" />
          <input type="file" onChange={(e) => setFile(e.target.files[0])} accept="image/*" />
          <button type="submit" className="btn-primary">Save Changes</button>
        </form>
      )}
      <div className="profile-posts">
        {posts.length === 0 ? <p>No posts yet.</p> : (
          <div className="posts-grid">
            {posts.map(post => (
              <Link to={`/post/${post.id}`} key={post.id} className="post-thumbnail">
                <img src={post.image_url} alt="" />
                <div className="post-thumbnail-overlay">
                  <span>♥ {post.like_count}</span>
                  <span>💬 {post.comment_count}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}