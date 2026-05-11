import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Post from "../components/Post";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const { user } = useAuth();

  const fetchPosts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/posts/feed");
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    formData.append("caption", caption);
    try {
      await axios.post("http://localhost:5000/api/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFile(null);
      setCaption("");
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="home-page">
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
  );
}