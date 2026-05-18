import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Post from "../components/Post";

export default function Bookmarks() {
  const [posts, setPosts] = useState([]);
  const { user } = useAuth();

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

  const handleRemoveBookmark = async (postId) => {
    try {
      await axios.delete(`/api/bookmarks/${postId}`);
      setPosts(posts.filter(p => p.id !== postId));
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
            <div key={post.id} className="saved-post-wrapper">
              <Post
                post={post}
                isOwner={user?.id === post.user_id}
                onUpdate={fetchBookmarks}
              />
              <button 
                onClick={() => handleRemoveBookmark(post.id)}
                className="remove-bookmark-btn"
              >
                Remove from Saved
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}