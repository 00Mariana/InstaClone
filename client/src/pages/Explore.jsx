import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function Explore() {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const fetchPosts = async () => {
    try {
      const res = await axios.get("/api/posts/explore");
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await axios.get(`/api/users/search/${searchQuery}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  return (
    <div className="explore-page">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map(user => (
              <Link to={`/profile/${user.id}`} key={user.id} className="search-result-item">
                <img 
                  src={user.profile_picture || "https://via.placeholder.com/40"} 
                  alt="" 
                  className="avatar-small" 
                />
                <div className="search-user-info">
                  <span className="search-username">{user.username}</span>
                  {user.full_name && <span className="search-fullname">{user.full_name}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="explore-grid">
        {posts.length === 0 ? <p className="no-posts">No posts to explore yet.</p> : 
          posts.map(post => (
            <Link to={`/post/${post.id}`} key={post.id} className="explore-post">
              <img src={post.image_url} alt="" />
              <div className="explore-overlay">
                <span>♥ {post.like_count}</span>
                <span>💬 {post.comment_count}</span>
              </div>
            </Link>
          ))
        }
      </div>
    </div>
  );
}