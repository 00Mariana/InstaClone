import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

export default function StoryViewer() {
  const { userId } = useParams();
  const [stories, setStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, [userId]);

  const fetchStories = async () => {
    try {
      const res = await axios.get(`/api/stories/user/${userId}`);
      setStories(res.data);
      if (res.data.length > 0) setCurrentIndex(0);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (stories.length === 0) return;
    const timer = setTimeout(() => {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        window.history.back();
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [currentIndex, stories.length]);

  useEffect(() => {
    if (stories.length > 0 && stories[currentIndex]) {
      axios.post(`/api/stories/${stories[currentIndex].id}/view`).catch(console.error);
    }
  }, [currentIndex, stories]);

  if (loading) return <div className="loading">Loading...</div>;
  if (stories.length === 0) return <div className="error">No stories found</div>;

  const current = stories[currentIndex];

  return (
    <div className="story-viewer">
      <div className="story-progress-bar">
        {stories.map((_, i) => (
          <div key={i} className={`progress-segment ${i < currentIndex ? "done" : i === currentIndex ? "active" : ""}`} />
        ))}
      </div>
      <div className="story-header">
        <img src={current.profile_picture || "https://via.placeholder.com/40"} alt="" className="story-avatar" />
        <Link to={`/profile/${current.user_id}`} className="story-username">{current.username}</Link>
        <Link to="/" className="story-close">✕</Link>
      </div>
      <img src={current.image_url} alt="" className="story-image" />
      <div className="story-nav prev" onClick={() => currentIndex > 0 && setCurrentIndex(prev => prev - 1)} />
      <div className="story-nav next" onClick={() => currentIndex < stories.length - 1 && setCurrentIndex(prev => prev + 1)} />
    </div>
  );
}