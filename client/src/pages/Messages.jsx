import { useState, useEffect } from "react";
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
  const [selectedUser, setSelectedUser] = useState("");
  const [newMessageContent, setNewMessageContent] = useState("");

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    }
  }, [conversationId]);

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
          <button onClick={() => setShowNewMessage(true)} className="new-message-btn">+</button>
        </div>
        {showNewMessage && (
          <form onSubmit={startNewConversation} className="new-message-form">
            <input 
              type="number" 
              placeholder="Enter user ID" 
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Message" 
              value={newMessageContent}
              onChange={(e) => setNewMessageContent(e.target.value)}
            />
            <button type="submit" className="btn-primary">Send</button>
          </form>
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
                <span className="conversation-preview">{conv.last_message}</span>
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
                  <div className="message-content">{msg.content}</div>
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