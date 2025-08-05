import React, { useRef, useEffect, useState } from "react";
import ChatMessageInput from "../components/ChatMessageInput";
import ticSound from "../../assets/tic.mp3";
import { getChatMessages, sendMessage } from "../api";
import { getSocket } from "../socket";

// UI de chat profesional y minimalista
export default function ChatScreen({ chat, user, token, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socketError, setSocketError] = useState(false);
  const [loadError, setLoadError] = useState("");
  const ticAudioRef = useRef();
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Cargar historial real al montar
  useEffect(() => {
    if (!chat?._id) return;
    setLoading(true);
    setLoadError("");
    getChatMessages(chat._id)
      .then(data => {
        // Si la respuesta es {messages: [], total: 0}, no es error
        let msgs = Array.isArray(data) ? data : (Array.isArray(data.messages) ? data.messages : []);
        setMessages(msgs.map(msg => ({
          id: msg._id,
          from: msg.sender,
          text: msg.message,
          time: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        })));
      })
      .catch((err) => {
        setMessages([]);
        setLoadError("No se pudieron cargar los mensajes de este chat. Puede que el chat haya sido eliminado o haya un error en el servidor.");
      })
      .finally(() => setLoading(false));
  }, [chat?._id]);

  // Sockets: unirse a la sala y recibir mensajes en tiempo real
  useEffect(() => {
    if (!chat?._id || !token) return;
    setSocketError(false);
    socketRef.current = getSocket(token);
    socketRef.current.on("connect_error", () => {
      setSocketError(true);
    });
    socketRef.current.emit("join", chat._id);
    socketRef.current.on("message", msg => {
      setMessages(prev => prev.some(m => m.id === msg._id) ? prev : [...prev, {
        id: msg._id,
        from: msg.sender,
        text: msg.message,
        time: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      }]);
    });
    return () => {
      socketRef.current.emit("leave", chat._id);
      socketRef.current.disconnect();
    };
  }, [chat?._id, token]);

  // Polling para actualizar mensajes si no hay WebSocket
  useEffect(() => {
    if (!chat?._id) return;
    let interval;
    if (socketError) {
      interval = setInterval(() => {
        getChatMessages(chat._id)
          .then(data => {
            let msgs = Array.isArray(data) ? data : (Array.isArray(data.messages) ? data.messages : []);
            setMessages(msgs.map(msg => ({
              id: msg._id,
              from: msg.sender,
              text: msg.message,
              time: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            })));
          })
          .catch(() => { });
      }, 3000);
    }
    return () => interval && clearInterval(interval);
  }, [chat?._id, socketError]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Enviar texto
  const handleSend = async (text) => {
    if (!text.trim()) return;
    if (!chat?._id) {
      alert('Error: el chat seleccionado no tiene un ID válido. No se puede enviar el mensaje.');
      return;
    }
    setLoading(true);
    try {
      const msg = await sendMessage(chat._id, text);
      setMessages(msgs => ([...msgs, {
        id: msg._id,
        from: msg.sender,
        text: msg.message,
        time: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      }]));
    } catch (e) {
      // Puedes agregar feedback visual de error aquí
      console.error('Error al enviar mensaje:', e);
    }
    setLoading(false);
  };

  // Enviar imagen (a implementar en backend)
  const handleSendImage = (file) => {
    // TODO: implementar subida real
    const url = URL.createObjectURL(file);
    setMessages(msgs => ([...msgs, { id: Date.now(), from: user?._id, image: url, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]));
  };

  // Enviar audio (a implementar en backend)
  const handleSendAudio = (audioBlob) => {
    // TODO: implementar subida real
    const url = URL.createObjectURL(audioBlob);
    setMessages(msgs => ([...msgs, { id: Date.now(), from: user?._id, audio: url, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]));
  };

  // Enviar TIC (zumbido, solo UI por ahora)
  const handleSendTic = () => {
    setMessages(msgs => ([...msgs, { id: Date.now(), from: user?._id, tic: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]));
    ticAudioRef.current?.play();
    const chatArea = document.getElementById('chat-area');
    if (chatArea) {
      chatArea.classList.add('tic-vibrate');
      setTimeout(() => chatArea.classList.remove('tic-vibrate'), 600);
    }
  };

  if (loadError) {
    // Solo mostrar error si realmente hubo un error en la petición, no si la lista está vacía
    if (!loading && messages.length === 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#fff' }}>
          <div style={{ color: '#e74c3c', fontWeight: 700, fontSize: 18, marginBottom: 18 }}>{loadError}</div>
          <button onClick={onBack} style={{ background: 'linear-gradient(90deg,#3a8dde 60%,#6a9cff 100%)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 16, boxShadow: '0 1px 8px #3a8dde22', cursor: 'pointer' }}>Volver a la lista de chats</button>
        </div>
      );
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'transparent', minHeight: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 24px 14px 18px', borderBottom: '1.5px solid #e3eaf2', background: 'rgba(255,255,255,0.92)', boxShadow: '0 2px 12px #3a8dde0a', zIndex: 2 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 26, color: '#3a8dde', cursor: 'pointer', marginRight: 6, marginLeft: -4 }} title="Volver">←</button>
        {chat?.otherUser?.avatar ? (
          <img src={chat.otherUser.avatar} alt="avatar" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 1px 4px #3a8dde22' }} />
        ) : (
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#e3eaf2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a8dde', fontWeight: 700, fontSize: 20 }}>👤</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#23263a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {chat?.otherUser?.firstName ? (
              <>
                {chat.otherUser.firstName} {chat.otherUser.lastName || ''}
                <span style={{ color: '#7a8ca3', fontWeight: 400, fontSize: 13, marginLeft: 8 }}>{chat.otherUser.email}</span>
              </>
            ) : (
              chat?.otherUser?.email || "Usuario"
            )}
          </div>
          <div style={{ fontSize: 13, color: '#7a8ca3', fontWeight: 500 }}>
            En línea
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div id="chat-area" style={{ flex: 1, overflowY: 'auto', padding: '28px 0 18px 0', background: 'linear-gradient(120deg,#fafdff 60%,#e3eaf2 100%)', display: 'flex', flexDirection: 'column', gap: 10, transition: 'box-shadow .2s' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex', justifyContent: msg.from === user?._id ? 'flex-end' : 'flex-start', padding: '0 22px',
          }}>
            {/* Mensaje de texto */}
            {msg.text && (
              <div style={{
                background: msg.from === user?._id ? 'linear-gradient(90deg,#3a8dde 60%,#6a9cff 100%)' : '#e3eaf2',
                color: msg.from === user?._id ? '#fff' : '#23263a',
                borderRadius: 18,
                borderBottomRightRadius: msg.from === user?._id ? 4 : 18,
                borderBottomLeftRadius: msg.from === user?._id ? 18 : 4,
                padding: '10px 16px',
                fontSize: 16,
                fontWeight: 500,
                boxShadow: '0 2px 8px #3a8dde11',
                maxWidth: 340,
                minWidth: 36,
                wordBreak: 'break-word',
                position: 'relative',
                marginBottom: 2,
                marginLeft: msg.from === user?._id ? 24 : 0,
                marginRight: msg.from === user?._id ? 0 : 24,
                transition: 'background .2s',
              }}>
                {msg.text}
                <span style={{ fontSize: 11, color: msg.from === user?._id ? '#eaf2ffb0' : '#7a8ca3', marginLeft: 8, marginRight: -4, position: 'absolute', bottom: 4, right: 10 }}>{msg.time}</span>
              </div>
            )}
            {/* Imagen */}
            {msg.image && (
              <div style={{ background: '#fff', border: '1.5px solid #e3eaf2', borderRadius: 16, padding: 4, boxShadow: '0 2px 8px #3a8dde11', maxWidth: 220 }}>
                <img src={msg.image} alt="img" style={{ maxWidth: 200, maxHeight: 180, borderRadius: 12, objectFit: 'cover', display: 'block' }} />
                <span style={{ fontSize: 11, color: '#7a8ca3', marginLeft: 8 }}>{msg.time}</span>
              </div>
            )}
            {/* Audio */}
            {msg.audio && (
              <div style={{ background: '#fff', border: '1.5px solid #e3eaf2', borderRadius: 16, padding: '8px 12px', boxShadow: '0 2px 8px #3a8dde11', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 220 }}>
                <audio src={msg.audio} controls style={{ width: 160 }} />
                <span style={{ fontSize: 11, color: '#7a8ca3' }}>{msg.time}</span>
              </div>
            )}
            {/* TIC (zumbido) */}
            {msg.tic && (
              <div style={{ background: '#f7b731', color: '#fff', borderRadius: 18, padding: '10px 18px', fontWeight: 700, boxShadow: '0 2px 8px #f7b73133', fontSize: 16, letterSpacing: 1, animation: 'ticShake .6s', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span role="img" aria-label="tic">⚡</span> ¡TIC enviado!
                <span style={{ fontSize: 11, color: '#fff', marginLeft: 8 }}>{msg.time}</span>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
        <audio ref={ticAudioRef} src={ticSound} preload="auto" />
        <style>{`
          @keyframes ticShake {
            10%, 90% { transform: translateX(-2px); }
            20%, 80% { transform: translateX(4px); }
            30%, 50%, 70% { transform: translateX(-8px); }
            40%, 60% { transform: translateX(8px); }
          }
          .tic-vibrate {
            animation: ticShake 0.6s;
          }
        `}</style>
      </div>

      {/* Input mejorado */}
      <ChatMessageInput
        onSend={handleSend}
        onSendImage={handleSendImage}
        onSendAudio={handleSendAudio}
        onSendTic={handleSendTic}
        loading={loading}
      />
      {/* Solo mostrar advertencia si hay error real de red, no solo por falta de WebSocket */}
      {socketError && !loading && (
        <div style={{ color: '#e74c3c', background: '#fff3f3', padding: '10px 18px', borderRadius: 10, margin: '12px 18px 0 18px', fontWeight: 600, fontSize: 15 }}>
          No se pudo conectar al servidor en tiempo real. Los mensajes se actualizarán automáticamente cada pocos segundos.
        </div>
      )}
    </div>
  );
}
