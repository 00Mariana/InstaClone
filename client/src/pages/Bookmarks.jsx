import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function Bookmarks() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const res = await axios.get("/api/bookmarks");
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bookmarks-page">
      <h1>Saved</h1>
      {posts.length === 0 ? (
        <p className="no-posts">No saved posts yet</p>
      ) : (
        <div className="saved-posts-grid">
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
  );
}