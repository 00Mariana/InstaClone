import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [file, setFile] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchStories();
    fetchActiveUsers();
  }, []);

  const fetchStories = async () => {
    try {
      const res = await axios.get("/api/stories/feed");
      setStories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActiveUsers = async () => {
    try {
      const res = await axios.get("/api/stories/active");
      setActiveUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    try {
      await axios.post("/api/stories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFile(null);
      setShowUpload(false);
      fetchStories();
      fetchActiveUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const myStories = stories.filter(s => s.user_id === user?.id);

  return (
    <div className="stories-container">
      <div className="stories-scroll">
        <div className="story-item add-story" onClick={() => setShowUpload(!showUpload)}>
          <div className="story-avatar-wrap">
            <img
              src={user?.profile_picture || "https://via.placeholder.com/64"}
              alt=""
              className="story-avatar"
            />
            <div className="add-story-icon">+</div>
          </div>
          <span className="story-username">Your Story</span>
        </div>
        {stories.filter(s => s.user_id !== user?.id).map(story => (
          <Link to={`/stories/${story.user_id}`} key={story.id} className="story-item">
            <div className={`story-avatar-wrap ${activeUsers.includes(story.user_id) ? "has-ring" : ""}`}>
              <img
                src={story.profile_picture || "https://via.placeholder.com/64"}
                alt=""
                className="story-avatar"
              />
            </div>
            <span className="story-username">{story.username}</span>
          </Link>
        ))}
      </div>
      {showUpload && (
        <form onSubmit={handleUpload} className="story-upload-form">
          <input type="file" onChange={(e) => setFile(e.target.files[0])} accept="image/*" required />
          <button type="submit" className="btn-primary">Add Story</button>
        </form>
      )}
    </div>
  );
}