import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";

export default function Explore() {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [tagPosts, setTagPosts] = useState([]);
  const [activeTag, setActiveTag] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tag = searchParams.get("tag");
    if (tag) {
      setActiveTag(tag);
      fetchTagPosts(tag);
    } else {
      fetchPosts();
    }
  }, [searchParams]);

  const fetchPosts = async () => {
    try {
      const res = await axios.get("/api/posts/explore");
      setPosts(res.data);
      setTagPosts([]);
      setActiveTag("");
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTagPosts = async (tag) => {
    try {
      const res = await axios.get(`/api/hashtags/search/${tag}`);
      if (res.data.length > 0) {
        const tagId = res.data[0].id;
        const postsRes = await axios.get(`/api/hashtags/${tagId}/posts`);
        setTagPosts(postsRes.data);
      } else {
        setTagPosts([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  const displayPosts = activeTag ? tagPosts : posts;

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
      {activeTag && (
        <div className="explore-tag-header">
          <h2>#{activeTag}</h2>
          <button onClick={fetchPosts} className="clear-tag-btn">✕</button>
        </div>
      )}
      <div className="explore-grid">
        {displayPosts.length === 0 ? (
          <p className="no-posts">{activeTag ? "No posts with this hashtag." : "No posts to explore yet."}</p>
        ) : 
          displayPosts.map(post => (
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