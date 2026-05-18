import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Post from "../components/Post";
import Stories from "../components/Stories";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [followedIds, setFollowedIds] = useState(new Set());
  const { user } = useAuth();

  const fetchPosts = async () => {
    try {
      const res = await axios.get("/api/posts/feed");
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await axios.get("/api/users/suggestions");
      setSuggestions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchSuggestions();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    formData.append("caption", caption);
    try {
      await axios.post("/api/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFile(null);
      setCaption("");
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollow = async (userId) => {
    try {
      await axios.post(`/api/users/${userId}/follow`);
      setFollowedIds(prev => new Set([...prev, userId]));
      fetchSuggestions();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="home-page">
      <div className="home-main">
        <Stories />
        <div className="upload-form">
          <h2>Create Post</h2>
          <form onSubmit={handleUpload}>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} accept="image/*" required />
            <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption..." />
            <button type="submit" className="btn-primary">Upload</button>
          </form>
        </div>
        <div className="feed">
          {posts.length === 0 ? <p>No posts yet. Follow users to see their posts!</p> : null}
          {posts.map(post => (
            <Post
              key={post.id}
              post={post}
              isOwner={user?.id === post.user_id}
              onUpdate={fetchPosts}
            />
          ))}
        </div>
      </div>
      <div className="suggestions-sidebar">
        <h3>Suggestions For You</h3>
        {suggestions.length === 0 ? (
          <p className="no-suggestions">No suggestions available</p>
        ) : (
          suggestions.map(suggestion => (
            <div key={suggestion.id} className="suggestion-item">
              <Link to={`/profile/${suggestion.id}`} className="suggestion-user">
                <img 
                  src={suggestion.profile_picture || "https://via.placeholder.com/40"} 
                  alt="" 
                  className="avatar"
                />
                <div className="suggestion-info">
                  <span className="suggestion-username">{suggestion.username}</span>
                  {suggestion.full_name && <span className="suggestion-fullname">{suggestion.full_name}</span>}
                </div>
              </Link>
<button onClick={() => handleFollow(suggestion.id)} className={`btn-follow-small ${followedIds.has(suggestion.id) ? "following" : ""}`}>
                  {followedIds.has(suggestion.id) ? "Following" : "Follow"}
                </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}