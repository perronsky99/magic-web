import React, { useRef, useEffect, useState } from "react";
import ChatMessageInput from "../components/ChatMessageInput";
import ticSound from "../../assets/tic.mp3";
import { getChatMessages, sendMessage, sendImage, sendAudio, getStatusMsg } from "../api";
import { useSocket } from "../SocketContext";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import defaultAvatar from '../../assets/user.png';
import { API_URL } from '../api';

function getAvatarUrl(avatar) {
  if (!avatar) return defaultAvatar;
  if (avatar.startsWith('http')) return avatar;
  if (avatar.startsWith('data:image')) return avatar; // base64
  const cleanAvatar = avatar.replace(/^avatar\//, '');
  return `${API_URL}/api/avatar/${cleanAvatar}`;
}

// UI de chat profesional y minimalista
export default function ChatScreen({ chat, user, token, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socketError, setSocketError] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [typingUser, setTypingUser] = useState("");
  const ticAudioRef = useRef();
  const messagesEndRef = useRef(null);
  const socket = useSocket();
  const messageRefs = useRef({}); // refs persistentes por id

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
          from: (msg.user && (msg.user._id || msg.user.id)) ? (msg.user._id || msg.user.id) : (msg.sender || msg.from || msg.userId),
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
    if (!chat?._id || !socket) return;
    setSocketError(false);
    socket.emit("join", chat._id);
    const handleMessage = msg => {
      setMessages(prev => prev.some(m => m.id === msg._id)
        ? prev
        : [
          ...prev,
          {
            id: msg._id,
            from: (msg.user && (msg.user._id || msg.user.id)) ? (msg.user._id || msg.user.id) : (msg.sender || msg.from || msg.userId),
            text: msg.message,
            time: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          }
        ]
      );
    };
    const handleTic = data => {
      setMessages(msgs => ([...msgs, {
        id: Date.now() + Math.random(),
        from: data.userId,
        tic: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]));
    };
    const handleTyping = (userName) => {
      setTypingUser(userName);
      setTimeout(() => setTypingUser(""), 2000);
    };
    socket.on("message", handleMessage);
    socket.on("tic", handleTic);
    socket.on("typing", handleTyping);
    socket.on("connect_error", () => setSocketError(true));
    return () => {
      socket.emit("leave", chat._id);
      socket.off("message", handleMessage);
      socket.off("tic", handleTic);
      socket.off("typing", handleTyping);
      socket.off("connect_error");
    };
  }, [chat?._id, socket]);

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
      await sendMessage(chat._id, text); // Ya no agrego el mensaje localmente
    } catch (e) {
      // Puedes agregar feedback visual de error aquí
      console.error('Error al enviar mensaje:', e);
    }
    setLoading(false);
  };

  // Enviar imagen
  const handleSendImage = async (file) => {
    if (!chat?._id) return;
    setLoading(true);
    try {
      await sendImage(chat._id, file); // El mensaje aparecerá cuando llegue por WebSocket
    } catch (e) {
      console.error('Error al enviar imagen:', e);
      // Aquí puedes mostrar feedback visual de error
    }
    setLoading(false);
  };

  // Enviar audio
  const handleSendAudio = async (audioBlob) => {
    if (!chat?._id) return;
    setLoading(true);
    try {
      await sendAudio(chat._id, audioBlob); // El mensaje aparecerá cuando llegue por WebSocket
    } catch (e) {
      console.error('Error al enviar audio:', e);
      // Aquí puedes mostrar feedback visual de error
    }
    setLoading(false);
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
    // Emitir TIC al backend para que lo reciba el receptor
    if (socket && chat?._id) {
      socket.emit("tic", { chatId: chat._id, userId: user?._id });
    }
  };

  // Efecto de vibración y onda global al recibir un Tic
  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (last && last.tic) {
      // Vibrar toda la ventana del chat
      const mainWindow = document.querySelector('.magic2k-main-window') || document.body;
      mainWindow.classList.add('tic-vibrate-global');
      // Onda/destello visual
      const chatArea = document.getElementById('chat-area');
      if (chatArea) {
        chatArea.classList.add('tic-flash');
        setTimeout(() => chatArea.classList.remove('tic-flash'), 700);
      }
      setTimeout(() => mainWindow.classList.remove('tic-vibrate-global'), 700);
    }
  }, [messages]);

  // Pseudo/nickname editable
  const otherUserId = chat?.otherUser?._id || chat?.otherUser?.id || chat?.otherUser?.userId || chat?.otherUser?.uid;
  const pseudoKey = otherUserId ? `pseudo_${otherUserId}` : null;
  const [pseudo, setPseudo] = useState(() => {
    if (pseudoKey) {
      return localStorage.getItem(pseudoKey) || "";
    }
    return "";
  });
  const [editingPseudo, setEditingPseudo] = useState(false);
  const pseudoInputRef = useRef();

  useEffect(() => {
    if (editingPseudo && pseudoInputRef.current) {
      pseudoInputRef.current.focus();
    }
  }, [editingPseudo]);

  const handlePseudoSave = () => {
    if (pseudoKey) {
      localStorage.setItem(pseudoKey, pseudo.slice(0, 50));
    }
    setEditingPseudo(false);
  };

  // Nickname real del otro usuario
  const [otherStatusMsg, setOtherStatusMsg] = useState("");
  useEffect(() => {
    const otherId = chat?.otherUser?._id || chat?.otherUser?.id || chat?.otherUser?.userId || chat?.otherUser?.uid;
    if (otherId) {
      getStatusMsg(otherId).then(res => setOtherStatusMsg(res.statusMsg || "")).catch(() => setOtherStatusMsg(""));
    }
  }, [chat?.otherUser?._id, chat?.otherUser?.id, chat?.otherUser?.userId, chat?.otherUser?.uid]);

  const USER_STATES = [
    { key: 'online', label: 'En línea', color: '#3ac47d', icon: '🟢' },
    { key: 'away', label: 'Ausente', color: '#ffe066', icon: '🟡' },
    { key: 'busy', label: 'Ocupado', color: '#e74c3c', icon: '🔴' },
    { key: 'invisible', label: 'Invisible', color: '#b0b8c9', icon: '⚪' },
  ];

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
  <div className="chat-header-sticky" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 24px 14px 18px', borderBottom: '1.5px solid #e3eaf2', background: 'rgba(255,255,255,0.92)', boxShadow: '0 2px 12px #3a8dde0a', zIndex: 2 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 26, color: '#3a8dde', cursor: 'pointer', marginRight: 6, marginLeft: -4 }} title="Volver">←</button>
        {chat?.otherUser?.avatar ? (
          <img src={getAvatarUrl(chat.otherUser.avatar)} alt="avatar" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 1px 4px #3a8dde22' }} />
        ) : (
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#e3eaf2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a8dde', fontWeight: 700, fontSize: 20 }}>👤</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#23263a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', gap: 10, flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {chat?.otherUser?.firstName ? (
                <>
                  {chat.otherUser.firstName} {chat.otherUser.lastName || ''}
                  <span style={{ color: '#7a8ca3', fontWeight: 400, fontSize: 13, marginLeft: 8 }}>{chat.otherUser.email}</span>
                </>
              ) : (
                chat?.otherUser?.email || "Usuario"
              )}
              {/* Estado visual del usuario actual */}
              {(() => {
                const state = localStorage.getItem('magic2k_user_state') || 'online';
                const s = USER_STATES.find(x => x.key === state);
                return s ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600, fontSize: 13, color: s.color }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, display: 'inline-block', boxShadow: `0 0 4px ${s.color}88` }} />
                    {s.label}
                  </span>
                ) : null;
              })()}
            </span>
            {/* Nickname/mensaje de estado solo lectura */}
            {otherStatusMsg ? (
              <span style={{ fontSize: 13, color: '#7a8ca3', fontWeight: 500, marginTop: 1, maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{otherStatusMsg}</span>
            ) : null}
          </div>
          <div style={{ fontSize: 13, color: '#7a8ca3', fontWeight: 500 }}>
            {/*{socketError ? 'Desconectado' : 'En línea'} */}
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div id="chat-area" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '28px 0 18px 0', background: 'linear-gradient(120deg,#fafdff 60%,#e3eaf2 100%)', display: 'flex', flexDirection: 'column', gap: 10, transition: 'box-shadow .2s', boxSizing: 'border-box', width: '100%' }}>
        <TransitionGroup>
          {messages.map((msg, idx) => {
            const myId = user && (user._id || user.id || user.uid || user.idUser) ? String(user._id || user.id || user.uid || user.idUser) : '';
            const msgFrom = msg && (
              (msg.user && (msg.user._id || msg.user.id)) ? String(msg.user._id || msg.user.id) :
                msg.from ? String(msg.from) :
                  msg.sender ? String(msg.sender) :
                    msg.userId ? String(msg.userId) :
                      ''
            );
            const isMine = myId && msgFrom && myId === msgFrom;
            const key = msg.id ? String(msg.id) : `${idx}`;
            // refs persistentes por id
            if (!messageRefs.current[key]) messageRefs.current[key] = React.createRef();
            // Colores Magic2k
            const bubbleColor = isMine ? 'var(--primary)' : '#fff';
            const textColor = isMine ? '#fff' : '#23263a';
            const borderColor = isMine ? 'var(--primary)' : '#e3eaf2';
            const align = isMine ? 'flex-end' : 'flex-start';
            // Normalización y fallback
            let content = null;
            if (msg.image) {
              content = (
                <div className={`chat-bubble ${isMine ? 'me' : 'other'}`} style={{ background: '#fff', border: '1.5px solid #e3eaf2', borderRadius: 16, padding: 4, boxShadow: isMine ? '0 2px 8px #00cfff33' : '0 2px 8px #3a8dde11', maxWidth: 220, alignSelf: align, marginBottom: 8, marginRight: isMine ? 18 : 0, marginLeft: !isMine ? 28 : 0 }}>
                  <img src={msg.image} alt="img" style={{ maxWidth: 200, maxHeight: 180, borderRadius: 12, objectFit: 'cover', display: 'block' }} />
                  <span className="msg-time">{msg.time}</span>
                </div>
              );
            } else if (msg.audio) {
              content = (
                <div className={`chat-bubble ${isMine ? 'me' : 'other'}`} style={{ background: '#fff', border: '1.5px solid #e3eaf2', borderRadius: 16, padding: '8px 12px', boxShadow: isMine ? '0 2px 8px #00cfff33' : '0 2px 8px #3a8dde11', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 220, alignSelf: align, marginBottom: 8, marginRight: isMine ? 18 : 0, marginLeft: !isMine ? 28 : 0 }}>
                  <audio src={msg.audio} controls style={{ width: 160 }} />
                  <span className="msg-time">{msg.time}</span>
                </div>
              );
            } else if (msg.tic) {
              content = (
                <div className={`chat-bubble ${isMine ? 'me' : 'other'}`} style={{ background: 'var(--accent)', color: '#23263a', borderRadius: 18, padding: '10px 18px', fontWeight: 700, boxShadow: '0 2px 8px #caff8733', fontSize: 16, letterSpacing: 1, animation: 'ticShake .6s', display: 'flex', alignItems: 'center', gap: 8, alignSelf: align, justifyContent: align, marginBottom: 8, marginRight: isMine ? 18 : 0, marginLeft: !isMine ? 28 : 0 }}>
                  <span role="img" aria-label="tic">⚡</span> ¡TIC enviado!
                  <span className="msg-time">{msg.time}</span>
                </div>
              );
            } else if (msg.text) {
              content = (
                <div className={`chat-bubble ${isMine ? 'me' : 'other'}`} style={{
                  background: bubbleColor,
                  color: textColor,
                  borderRadius: 18,
                  borderBottomRightRadius: isMine ? 4 : 18,
                  borderBottomLeftRadius: isMine ? 18 : 4,
                  padding: '12px 18px',
                  fontSize: 16,
                  fontWeight: 500,
                  boxShadow: isMine ? '0 2px 8px #00cfff33' : '0 2px 8px #3a8dde11',
                  maxWidth: 340,
                  minWidth: 36,
                  wordBreak: 'break-word',
                  position: 'relative',
                  marginBottom: 8,
                  marginLeft: isMine ? 24 : 28,
                  marginRight: isMine ? 18 : 0,
                  alignSelf: align,
                  border: `2px solid ${borderColor}`,
                  opacity: 0.98,
                  transition: 'background .2s',
                }}>
                  {msg.text}
                  <span className="msg-time">{msg.time}</span>
                  {/* Pico de la burbuja */}
                  <span style={{
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    ...(isMine ? { right: -10 } : { left: -10 }),
                    width: 0,
                    height: 0,
                    borderTop: '10px solid transparent',
                    borderBottom: '10px solid transparent',
                    borderLeft: isMine ? '10px solid var(--primary)' : 'none',
                    borderRight: !isMine ? '10px solid #fff' : 'none',
                    zIndex: 1,
                    display: 'inline-block',
                  }} />
                </div>
              );
            } else {
              // Fallback visual para mensajes inesperados
              content = (
                <div className="chat-bubble other" style={{ background: '#ffeded', color: '#c0392b', borderRadius: 14, padding: '10px 16px', fontWeight: 600, fontSize: 15, marginBottom: 8, border: '1.5px solid #e57373', alignSelf: align }}>
                  [Mensaje no soportado]
                </div>
              );
            }
            if (!content) return null;
            return (
              <CSSTransition key={key} timeout={320} classNames="msg-bubble" nodeRef={messageRefs.current[key]}>
                <div ref={messageRefs.current[key]} style={{ display: 'flex', justifyContent: align, width: '100%', boxSizing: 'border-box', overflowX: 'visible' }}>
                  <div style={{ maxWidth: '70vw', minWidth: 0, width: 'fit-content', boxSizing: 'border-box', margin: 0, padding: 0 }}>
                    {content}
                  </div>
                </div>
              </CSSTransition>
            );
          })}
        </TransitionGroup>
        {typingUser && (
          <div style={{ color: '#7a8ca3', fontSize: 15, fontWeight: 500, marginLeft: 32, marginBottom: 8, fontStyle: 'italic', transition: 'opacity .2s' }}>
            {`${typingUser} está escribiendo...`}
          </div>
        )}
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
          @keyframes ticShakeGlobal {
            10%, 90% { transform: translate(-2px, 0); }
            20%, 80% { transform: translate(4px, 0); }
            30%, 50%, 70% { transform: translate(-12px, 0); }
            40%, 60% { transform: translate(12px, 0); }
          }
          .tic-vibrate-global {
            animation: ticShakeGlobal 0.7s cubic-bezier(.36,.07,.19,.97) both;
          }
          @keyframes ticFlash {
            0% { box-shadow: 0 0 0 0 #ffe06688; }
            40% { box-shadow: 0 0 32px 12px #ffe066cc; }
            100% { box-shadow: 0 0 0 0 #ffe06600; }
          }
          .tic-flash {
            animation: ticFlash 0.7s;
          }
        `}</style>
      </div>

      {/* Input de mensaje */}
      <div className="chat-input-bar">
        <ChatMessageInput
          onSend={handleSend}
          onSendImage={handleSendImage}
          onSendAudio={handleSendAudio}
          onSendTic={handleSendTic}
          onTyping={() => {
            if (socket && chat?._id && user) {
              const nombre = user.firstName || user.email || "Usuario";
              socket.emit("typing", { roomId: chat._id, user: nombre });
            }
          }}
          loading={loading}
          user={user}
        />
      </div>
    </div>
  );
}