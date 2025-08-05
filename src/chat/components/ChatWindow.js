import React, { useEffect, useRef, useState } from "react";
import { getChatMessages, sendMessage } from "../api";
import { getSocket } from "../socket";

export default function ChatWindow({ chat, token, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!chat || !token) return;
    setLoading(true);
    getChatMessages(chat._id, token)
      .then(data => setMessages(data.messages || data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [chat, token]);

  useEffect(() => {
    if (!chat || !token) return;
    socketRef.current = getSocket(token);
    socketRef.current.emit("join", chat._id);
    socketRef.current.on("message", msg => {
      setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
    });
    return () => {
      socketRef.current.emit("leave", chat._id);
      socketRef.current.disconnect();
    };
  }, [chat, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async e => {
    e.preventDefault();
    if (!input.trim()) return;
    try {
      await sendMessage(chat._id, input, token);
      setInput("");
    } catch (e) {
      setError(e.message);
    }
  };

  if (!chat) return <div>Selecciona un chat</div>;
  if (loading) return <div>Cargando mensajes...</div>;

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100%'}}>
      <div style={{flex:1, overflowY:'auto', padding:8, background:'#f5f5f5'}}>
        {messages.map(msg => (
          <div key={msg._id} style={{marginBottom:6, textAlign: msg.user?._id === user?._id ? 'right' : 'left'}}>
            <span style={{background: msg.user?._id === user?._id ? '#b2f5ea' : '#e2e8f0', borderRadius:8, padding:'4px 10px', display:'inline-block'}}>
              {msg.message}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} style={{display:'flex', borderTop:'1px solid #ddd', padding:8, background:'#fff'}}>
        <input value={input} onChange={e => setInput(e.target.value)} style={{flex:1, border:'none', outline:'none', fontSize:16}} placeholder="Escribe un mensaje..." />
        <button type="submit" style={{marginLeft:8}}>Enviar</button>
      </form>
      {error && <div style={{color:'red'}}>{error}</div>}
    </div>
  );
}
