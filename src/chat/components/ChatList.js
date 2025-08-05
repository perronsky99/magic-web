import React, { useEffect, useState } from "react";
import { getChats } from "../api";

export default function ChatList({ token, onSelectChat }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getChats(token)
      .then(data => setChats(data.chats || data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div>Cargando chats...</div>;
  if (error) return <div style={{color:'red'}}>{error}</div>;

  return (
    <div>
      <h2>Chats</h2>
      <ul style={{listStyle:'none', padding:0}}>
        {chats.map(chat => (
          <li key={chat._id} style={{marginBottom:8, cursor:'pointer'}} onClick={() => onSelectChat(chat)}>
            <b>{chat.name || chat.otherUser?.firstName || chat.otherUser?.email}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
