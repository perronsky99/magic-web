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

  if (!chat) return <div style={{padding:32, color:'#7a8ca3', fontWeight:500}}>Selecciona un chat</div>;
  if (loading) return <div style={{padding:32, color:'#7a8ca3', fontWeight:500}}>Cargando mensajes...</div>;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'linear-gradient(120deg, #fafdff 60%, #e3eaf2 100%)',
        borderRadius: 24,
        boxShadow: '0 8px 32px 0 #3a8dde22',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Mensajes con fondo glass y burbujas modernas */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '36px 0 22px 0',
          background: 'linear-gradient(120deg,#fafdff 60%,#e3eaf2 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          transition: 'box-shadow .2s',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        {messages.map(msg => {
          const isMine = msg.user?._id === user?._id;
          return (
            <div
              key={msg._id}
              style={{
                display: 'flex',
                justifyContent: isMine ? 'flex-end' : 'flex-start',
                width: '100%',
                boxSizing: 'border-box',
                overflowX: 'visible',
              }}
            >
              <div
                style={{
                  background: isMine ? 'rgba(58,141,222,0.92)' : 'rgba(255,255,255,0.85)',
                  color: isMine ? '#fff' : '#23263a',
                  borderRadius: 20,
                  borderBottomRightRadius: isMine ? 6 : 20,
                  borderBottomLeftRadius: isMine ? 20 : 6,
                  padding: '14px 22px',
                  fontSize: 17,
                  fontWeight: 500,
                  boxShadow: isMine ? '0 2px 12px #3a8dde33' : '0 2px 8px #3a8dde11',
                  maxWidth: 400,
                  minWidth: 36,
                  wordBreak: 'break-word',
                  position: 'relative',
                  marginBottom: 10,
                  marginLeft: isMine ? 28 : 32,
                  marginRight: isMine ? 22 : 0,
                  alignSelf: isMine ? 'flex-end' : 'flex-start',
                  border: `2px solid ${isMine ? 'rgba(58,141,222,0.22)' : '#e3eaf2'}`,
                  opacity: 0.98,
                  transition: 'background .2s',
                }}
              >
                {msg.message}
                <span
                  style={{
                    fontSize: 12,
                    color: isMine ? '#e3eaf2' : '#7a8ca3',
                    marginLeft: 12,
                    fontWeight: 400,
                    opacity: 0.8,
                    position: 'absolute',
                    right: 12,
                    bottom: 2,
                  }}
                >
                  {msg.createdAt && new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      {/* Input de mensaje minimalista y fijo */}
      <form
        onSubmit={handleSend}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 18px',
          borderTop: '1.5px solid #e3eaf2',
          background: 'rgba(255,255,255,0.97)',
          boxShadow: '0 -2px 12px #3a8dde0a',
          position: 'sticky',
          bottom: 0,
          zIndex: 2,
        }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 14,
            border: '1.5px solid #e3eaf2',
            fontSize: 16,
            outline: 'none',
            background: '#fafdff',
            color: '#23263a',
            fontWeight: 500,
            boxShadow: '0 1px 4px #3a8dde11',
            transition: 'border .2s',
          }}
          placeholder="Escribe un mensaje..."
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 22px',
            borderRadius: 12,
            background: 'linear-gradient(90deg,#3a8dde 60%,#6a9cff 100%)',
            color: '#fff',
            fontWeight: 700,
            border: 'none',
            fontSize: 16,
            boxShadow: '0 1px 8px #3a8dde22',
            letterSpacing: 1,
            transition: 'background .2s',
            cursor: 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          Enviar
        </button>
      </form>
      {error && <div style={{color:'#e74c3c', padding:12, fontWeight:600}}>{error}</div>}
    </div>
  );
}
