import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function Messages() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [newMessageContent, setNewMessageContent] = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 1) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await axios.get(`/api/users/search/${searchQuery}`);
        setSearchResults(res.data.filter(u => u.id !== user?.id));
      } catch (err) {
        console.error(err);
      }
    };
    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, user?.id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await axios.get("/api/messages");
      setConversations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const res = await axios.get(`/api/messages/${convId}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const startNewConversation = async (e) => {
    e.preventDefault();
    if (!selectedUser || !newMessageContent.trim()) return;
    try {
      await axios.post(`/api/messages/${selectedUser}`, {
        content: newMessageContent
      });
      setShowNewMessage(false);
      setNewMessageContent("");
      setSelectedUser("");
      setSearchQuery("");
      fetchConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const res = await axios.post(`/api/messages/${conversationId}/message`, {
        content: newMessage
      });
      setMessages([...messages, res.data]);
      setNewMessage("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="messages-page">
      <div className="conversations-list">
        <div className="conversations-header">
          <h1>Messages</h1>
          <button onClick={() => setShowNewMessage(!showNewMessage)} className="new-message-btn">+</button>
        </div>
        {showNewMessage && (
          <div className="new-message-form" ref={searchRef}>
            <input
              type="text"
              placeholder="Search for a user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="user-search-input"
            />
            {searchResults.length > 0 && (
              <div className="user-search-results">
                {searchResults.map(u => (
                  <div
                    key={u.id}
                    className="user-search-item"
                    onClick={() => {
                      setSelectedUser(u.id.toString());
                      setSearchQuery(u.username);
                      setSearchResults([]);
                    }}
                  >
                    <img src={u.profile_picture || "https://via.placeholder.com/40"} alt="" className="avatar-small" />
                    <div className="user-search-info">
                      <span className="user-search-username">{u.username}</span>
                      {u.full_name && <span className="user-search-fullname">{u.full_name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {selectedUser && (
              <>
                <input
                  type="text"
                  placeholder="Your message..."
                  value={newMessageContent}
                  onChange={(e) => setNewMessageContent(e.target.value)}
                />
                <button type="submit" onClick={startNewConversation} className="btn-primary">Send</button>
              </>
            )}
          </div>
        )}
        {conversations.length === 0 ? (
          <p className="no-conversations">No conversations yet</p>
        ) : (
          conversations.map(conv => (
            <Link
              to={`/messages/${conv.id}`}
              key={conv.id}
              className={`conversation-item ${conversationId == conv.id ? "active" : ""}`}
            >
              <img
                src={conv.other_profile_picture || "https://via.placeholder.com/40"}
                alt=""
                className="avatar"
              />
              <div className="conversation-info">
                <span className="conversation-username">{conv.other_username}</span>
                {conv.last_message_type === "post_share" && conv.last_message_post ? (
                  <span className="conversation-preview-shared">
                    <img src={conv.last_message_post.image_url} alt="" />
                  </span>
                ) : (
                  <span className="conversation-preview">{conv.last_message}</span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
      <div className="chat-area">
        {!conversationId ? (
          <div className="no-chat-selected">
            <p>Select a conversation or start a new one</p>
          </div>
        ) : (
          <>
            <div className="messages-list">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`message ${msg.sender_id === user?.id ? "sent" : "received"}`}
                >
                  <img
                    src={msg.profile_picture || "https://via.placeholder.com/32"}
                    alt=""
                    className="avatar-small"
                  />
                  <div className="message-content">
                    <span>{msg.content}</span>
                    {msg.type === "post_share" && msg.shared_post && (
                      <Link to={`/post/${msg.shared_post.id}`} className="shared-post-preview">
                        <img src={msg.shared_post.image_url} alt="" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="message-input-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Message..."
              />
              <button type="submit" className="btn-primary">Send</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}