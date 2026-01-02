import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import { FaArrowLeft, FaUsers, FaEllipsisV, FaInfoCircle, FaSignOutAlt, FaImage, FaComments } from "react-icons/fa";
import { getGroupMessages, sendGroupMessage, sendGroupImage, sendGroupAudio, exitGroup, API_URL, getAccessToken } from "../api";
import { useSocket } from "../SocketContext";
import ChatMessageInput from "../components/ChatMessageInput";
import defaultAvatar from '../../assets/user.png';
import defaultGroupAvatar from '../../assets/user.png';
import ticSound from "../../assets/magic2k_message_pip.wav";
import "./GroupChatScreen.css";

function getAvatarUrl(avatar, type = 'avatar') {
  if (!avatar) return type === 'group' ? defaultGroupAvatar : defaultAvatar;
  if (avatar.startsWith('http')) return avatar;
  if (avatar.startsWith('data:image')) return avatar;
  const folder = type === 'group' ? 'group' : 'avatar';
  const cleanAvatar = avatar.replace(/^(avatar|group)\//, '');
  return `${API_URL}/api/${folder}/${cleanAvatar}`;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) return 'Hoy';
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
  return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
}

function getUserIdFromToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user_id || payload.userId || payload.id || payload._id;
  } catch {
    return null;
  }
}

// Normalizar mensaje grupal
function normalizeGroupMessage(msg) {
  if (!msg) return null;
  return {
    id: msg._id || msg.id || `msg-${Date.now()}-${Math.random()}`,
    text: msg.message || msg.text || '',
    image: msg.image,
    audio: msg.audio,
    type: msg.type || msg.messageType || 'TEXT',
    from: msg.user?._id || msg.user?.id || msg.user_id || msg.from,
    fromUser: msg.user || null,
    time: formatTime(msg.createdAt || msg.created_at || new Date()),
    createdAt: msg.createdAt || msg.created_at,
    pending: msg.pending || false,
    failed: msg.failed || false,
  };
}

// Componente de imagen con loading
const GroupChatImage = memo(function GroupChatImage({ src, isMine }) {
  const [status, setStatus] = useState('loading');
  
  return (
    <div style={{ position: 'relative', minWidth: 100, minHeight: 60 }}>
      {status === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isMine ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          borderRadius: 14
        }}>
          <div className="group-chat-loading-spinner" style={{ width: 20, height: 20 }} />
        </div>
      )}
      <img
        src={src}
        alt="imagen"
        className="group-message-image"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        onClick={() => window.open(src, '_blank')}
        style={{ display: status === 'loaded' ? 'block' : 'none' }}
      />
      {status === 'error' && (
        <div style={{ padding: 16, textAlign: 'center', color: '#8696a6' }}>
          <FaImage size={24} style={{ opacity: 0.5 }} />
        </div>
      )}
    </div>
  );
});

// Componente principal
export default function GroupChatScreen({ group, user, token, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const ticAudioRef = useRef(null);
  const socket = useSocket();
  
  const groupId = group?._id || group?.id;
  const myUserId = user?._id || user?.id || getUserIdFromToken(getAccessToken());
  const participantCount = group?.participants?.length || 0;

  // Cargar mensajes
  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    setError('');
    
    getGroupMessages(groupId)
      .then(data => {
        const msgs = data.messages || data || [];
        setMessages(msgs.map(normalizeGroupMessage).filter(Boolean));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [groupId]);

  // Sockets: unirse al room del grupo y escuchar mensajes (usar eventos genéricos del servidor)
  useEffect(() => {
    if (!groupId || !socket) return;

    // Unirse al room del grupo usando el evento genérico 'join'
    try {
      socket.emit("join", groupId);
    } catch (e) {
      console.warn('[GroupChatScreen] Error emitiendo join:', e);
    }

    // Escuchar mensajes nuevos (el servidor emite 'message' para grupos)
    const handleMessage = (msg) => {
      console.debug('[GroupChatScreen] message received:', msg);
      const newMsg = normalizeGroupMessage(msg);
      if (!newMsg) return;
      setMessages(prev => {
        // Evitar duplicados
        if (prev.some(m => m.id === newMsg.id)) return prev;
        // Remover mensaje optimista si existe (comparando texto)
        const filtered = prev.filter(m => !(m.pending && m.text === newMsg.text));
        return [...filtered, newMsg];
      });
    
        // Sonido SOLO si es TIC y no es mío
        if ((newMsg.type === 'TIC' || newMsg.tic) && newMsg.from !== myUserId && ticAudioRef.current) {
          ticAudioRef.current.currentTime = 0;
          ticAudioRef.current.play().catch(() => {});
        }
    };

    // Escuchar typing (el servidor reemite 'typing' a la sala)
    const handleTyping = (user) => {
      const userId = user?.userId || user?.id || user?.user_id;
      const userName = user?.userName || user?.name || user?.firstName || user?.username || 'Usuario';
      if (userId && userId !== myUserId) {
        setTypingUsers(prev => {
          if (prev.some(u => u.userId === userId)) return prev;
          return [...prev, { userId, userName }];
        });
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.userId !== userId));
        }, 2000);
      }
    };

    socket.on("message", handleMessage);
    socket.on("typing", handleTyping);

    return () => {
      try { socket.emit("leave", groupId); } catch (e) { /* noop */ }
      socket.off("message", handleMessage);
      socket.off("typing", handleTyping);
    };
  }, [groupId, socket, myUserId]);

  // Enviar TIC al grupo
  const handleSendTic = useCallback(() => {
    if (!socket || !groupId || !myUserId) return;
    try {
      socket.emit('tic', { groupId, userId: myUserId });
    } catch (e) {
      console.warn('[GroupChatScreen] error emitting tic', e);
    }
  }, [socket, groupId, myUserId]);

  // Scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Enviar mensaje de texto
  const handleSendText = useCallback(async (text) => {
    if (!text.trim() || !groupId) return;
    
    // Mensaje optimista
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMsg = {
      id: optimisticId,
      text: text.trim(),
      from: myUserId,
      fromUser: user,
      time: formatTime(new Date()),
      pending: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    
    try {
      await sendGroupMessage(groupId, text.trim());
    } catch (e) {
      setMessages(prev => prev.map(m => 
        m.id === optimisticId ? { ...m, pending: false, failed: true } : m
      ));
    }
  }, [groupId, myUserId, user]);

  // Enviar imagen
  const handleSendImage = useCallback(async (file) => {
    if (!file || !groupId) return;
    try {
      await sendGroupImage(groupId, file);
    } catch (e) {
      alert('Error al enviar imagen: ' + e.message);
    }
  }, [groupId]);

  // Enviar audio
  const handleSendAudio = useCallback(async (file) => {
    if (!file || !groupId) return;
    try {
      await sendGroupAudio(groupId, file);
    } catch (e) {
      alert('Error al enviar audio: ' + e.message);
    }
  }, [groupId]);

  // Typing: emitir evento estándar 'typing' con { roomId, user }
  const handleTyping = useCallback(() => {
    if (socket && groupId) {
      const payload = { roomId: groupId, user: { userId: myUserId, userName: user?.firstName || user?.username } };
      try { socket.emit("typing", payload); } catch (e) { console.warn('typing emit error', e); }
    }
  }, [socket, groupId, myUserId, user?.firstName, user?.username]);

  // Salir del grupo
  const handleExitGroup = async () => {
    if (!confirm('¿Seguro que quieres salir del grupo?')) return;
    try {
      await exitGroup(groupId);
      onBack();
    } catch (e) {
      alert('Error al salir del grupo: ' + e.message);
    }
  };

  // Agrupar mensajes por fecha
  const messagesWithDates = messages.reduce((acc, msg, i) => {
    const prevMsg = messages[i - 1];
    const currentDate = formatDate(msg.createdAt);
    const prevDate = prevMsg ? formatDate(prevMsg.createdAt) : null;
    
    if (currentDate !== prevDate) {
      acc.push({ type: 'date', date: currentDate, id: `date-${currentDate}` });
    }
    acc.push({ type: 'message', ...msg });
    return acc;
  }, []);

  return (
    <div className="group-chat-screen">
      <audio ref={ticAudioRef} src={ticSound} preload="auto" />
      
      {/* Header */}
      <header className="group-chat-header">
        <button className="group-chat-back" onClick={onBack}>
          <FaArrowLeft />
        </button>
        <img 
          src={getAvatarUrl(group?.image, 'group')} 
          alt={group?.name} 
          className="group-chat-avatar"
        />
        <div className="group-chat-info" onClick={() => setShowInfo(true)} style={{ cursor: 'pointer' }}>
          <div className="group-chat-name">{group?.name}</div>
          <div className="group-chat-status">
            <FaUsers size={12} /> {participantCount} participantes
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <button className="group-chat-menu-btn" onClick={() => setShowMenu(!showMenu)}>
            <FaEllipsisV />
          </button>
          {showMenu && (
            <div className="group-menu-dropdown">
              <button className="group-menu-item" onClick={() => { setShowMenu(false); setShowInfo(true); }}>
                <FaInfoCircle /> Info del grupo
              </button>
              <button className="group-menu-item danger" onClick={() => { setShowMenu(false); handleExitGroup(); }}>
                <FaSignOutAlt /> Salir del grupo
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Área de mensajes */}
      <div className="group-chat-messages" onClick={() => showMenu && setShowMenu(false)}>
        {loading ? (
          <div className="group-chat-loading">
            <div className="group-chat-loading-spinner" />
            <span>Cargando mensajes...</span>
          </div>
        ) : error ? (
          <div className="group-chat-error">
            <span>{error}</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="group-chat-empty">
            <FaComments className="group-chat-empty-icon" />
            <p>No hay mensajes aún.<br />¡Sé el primero en escribir!</p>
          </div>
        ) : (
          messagesWithDates.map(item => {
            if (item.type === 'date') {
              return (
                <div key={item.id} className="group-message-date">
                  <span>{item.date}</span>
                </div>
              );
            }
            
            const isMine = String(item.from) === String(myUserId);
            const senderName = item.fromUser?.firstName || item.fromUser?.nickname || 'Usuario';
            const senderAvatar = getAvatarUrl(item.fromUser?.avatar);
            
            return (
              <div 
                key={item.id} 
                className={`group-message ${isMine ? 'mine' : 'other'} ${item.pending ? 'pending' : ''} ${item.failed ? 'failed' : ''}`}
              >
                {!isMine && (
                  <img src={senderAvatar} alt={senderName} className="group-message-avatar" />
                )}
                <div className="group-message-content">
                  {!isMine && <span className="group-message-sender">{senderName}</span>}
                  <div className="group-message-bubble">
                    {item.image && (
                      <GroupChatImage 
                        src={item.image.startsWith('http') ? item.image : `${API_URL}/${item.image}`}
                        isMine={isMine}
                      />
                    )}
                    {item.audio && (
                      <audio 
                        controls 
                        className="group-message-audio"
                        src={item.audio.startsWith('http') ? item.audio : `${API_URL}/${item.audio}`}
                      />
                    )}
                    {item.text && <span>{item.text}</span>}
                  </div>
                  <span className="group-message-time">
                    {item.time}
                    {item.pending && ' • Enviando...'}
                    {item.failed && ' • Error'}
                  </span>
                </div>
              </div>
            );
          })
        )}
        
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="group-typing-indicator">
            <div className="group-typing-dots">
              <span></span><span></span><span></span>
            </div>
            {typingUsers.map(u => u.userName).join(', ')} escribiendo...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="group-chat-input-area">
        <ChatMessageInput
          onSend={handleSendText}
          onSendImage={handleSendImage}
          onSendAudio={handleSendAudio}
          onTyping={handleTyping}
          onSendTic={handleSendTic}
          loading={loading || !socket}
          chatId={groupId}
        />
      </div>

      {/* Modal de info del grupo */}
      {showInfo && (
        <div className="group-info-overlay" onClick={() => setShowInfo(false)}>
          <div className="group-info-modal" onClick={e => e.stopPropagation()}>
            <div className="group-info-header">
              <img 
                src={getAvatarUrl(group?.image, 'group')} 
                alt={group?.name}
                className="group-info-avatar"
              />
              <h2 className="group-info-name">{group?.name}</h2>
            </div>
            
            <div className="group-info-section">
              <h3 className="group-info-section-title">Participantes ({participantCount})</h3>
              <div className="group-info-participants">
                {(group?.participants || []).map(p => {
                  const participant = p.user || p;
                  const pId = participant._id || participant.id;
                  const isCreator = pId === (group.creator?._id || group.creator?.id || group.creator);
                  
                  return (
                    <div key={pId} className="group-info-participant">
                      <img 
                        src={getAvatarUrl(participant.avatar)} 
                        alt={participant.firstName}
                        className="group-info-participant-avatar"
                      />
                      <span className="group-info-participant-name">
                        {participant.firstName} {participant.lastName}
                        {pId === myUserId && ' (Tú)'}
                      </span>
                      {isCreator && (
                        <span className="group-info-participant-role">Admin</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <button className="group-info-close" onClick={() => setShowInfo(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
