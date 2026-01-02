import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { FaArrowLeft, FaPaperPlane, FaImage, FaBolt, FaEllipsisV } from 'react-icons/fa';
import { getChatMessages, sendMessage, sendImage } from '../api';
import { useSocket } from '../SocketContext';
import { API_URL } from '../api';
import defaultAvatar from '../../assets/user.png';
import { 
  normalizeMessage, 
  normalizeMessages, 
  extractMessagesFromResponse, 
  addMessageIfNotExists,
  normalizeId,
  getUserIdFromToken 
} from '../utils/messageUtils';
import { getAccessToken } from '../api';
import './MobileChatView.css';

const USER_STATES = [
  { key: 'online', label: 'Online', color: '#3ac47d' },
  { key: 'away', label: 'Away', color: '#f5a623' },
  { key: 'busy', label: 'Busy', color: '#e74c3c' },
  { key: 'invisible', label: 'Offline', color: '#b0b8c9' },
];

function getAvatarUrl(avatar) {
  if (!avatar) return defaultAvatar;
  if (avatar.startsWith('http')) return avatar;
  if (avatar.startsWith('data:image')) return avatar;
  const cleanAvatar = avatar.replace(/^avatar\//, '');
  return `${API_URL}/api/avatar/${cleanAvatar}`;
}

function getMyUserId() {
  const token = getAccessToken();
  return getUserIdFromToken(token);
}

// Componente de imagen con loading
const ChatImage = memo(function ChatImage({ src, isMine }) {
  const [status, setStatus] = useState('loading');
  
  return (
    <div className={`mobile-chat-image-container ${status}`}>
      {status === 'loading' && (
        <div className="mobile-chat-image-loading">
          <div className="mobile-spinner" />
        </div>
      )}
      {status === 'error' && (
        <div className="mobile-chat-image-error">
          <FaImage />
          <span>Error</span>
        </div>
      )}
      <img 
        src={src} 
        alt="imagen"
        loading="lazy"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className={`mobile-chat-image ${status === 'loaded' ? 'visible' : ''}`}
        onClick={() => window.open(src, '_blank')}
      />
    </div>
  );
});

export default function MobileChatView({ chat, user, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [onlineUsersState, setOnlineUsersState] = useState(() => window.magic2k_onlineUsers || []);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const socket = useSocket();

  // Cargar mensajes
  useEffect(() => {
    if (!chat?._id) return;
    setLoading(true);
    
    getChatMessages(chat._id)
      .then(data => {
        const msgs = extractMessagesFromResponse(data);
        setMessages(normalizeMessages(msgs));
      })
      .catch(err => {
        console.error('Error cargando mensajes:', err);
        setMessages([]);
      })
      .finally(() => setLoading(false));
  }, [chat?._id]);

  // Socket listeners
  useEffect(() => {
    if (!chat?._id || !socket) return;
    
    socket.emit("join", chat._id);
    
    const handleMessage = (msg) => {
      const newMsg = normalizeMessage(msg);
      setMessages(prev => addMessageIfNotExists(prev, newMsg));
    };
    
    socket.on("message", handleMessage);
    
    return () => {
      socket.emit("leave", chat._id);
      socket.off("message", handleMessage);
    };
  }, [chat?._id, socket]);

  // Escuchar usuarios online
  useEffect(() => {
    const handleUsersUpdated = (event) => {
      setOnlineUsersState(event.detail || []);
    };
    window.addEventListener('magic2k_users_updated', handleUsersUpdated);
    return () => window.removeEventListener('magic2k_users_updated', handleUsersUpdated);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enviar mensaje
  const handleSend = useCallback(async () => {
    if (!input.trim() || !chat?._id) return;
    
    const text = input.trim();
    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg = {
      id: optimisticId,
      text,
      from: user?._id || user?.id,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pending: true,
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setInput('');
    setSending(true);
    
    try {
      await sendMessage(chat._id, text);
    } catch (e) {
      setMessages(prev => prev.map(m => 
        m.id === optimisticId ? { ...m, pending: false, failed: true } : m
      ));
    }
    
    setSending(false);
    inputRef.current?.focus();
  }, [input, chat?._id, user]);

  // Enviar imagen
  const handleImageSelect = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file || !chat?._id) return;
    
    const optimisticId = `opt-img-${Date.now()}`;
    const reader = new FileReader();
    
    reader.onload = async (ev) => {
      const optimisticMsg = {
        id: optimisticId,
        image: ev.target.result,
        from: user?._id || user?.id,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pending: true,
      };
      
      setMessages(prev => [...prev, optimisticMsg]);
      
      try {
        await sendImage(chat._id, file);
      } catch (err) {
        setMessages(prev => prev.map(m => 
          m.id === optimisticId ? { ...m, pending: false, failed: true } : m
        ));
      }
    };
    
    reader.readAsDataURL(file);
    fileInputRef.current.value = '';
  }, [chat?._id, user]);

  // Enviar TIC
  const handleTic = useCallback(() => {
    if (socket && chat?._id) {
      socket.emit("tic", { chatId: chat._id, userId: user?._id });
    }
  }, [socket, chat?._id, user?._id]);

  // Estado del otro usuario
  const otherId = chat?.otherUser?._id || chat?.otherUser?.id;
  const otherUserOnline = onlineUsersState.find(u => String(u.id) === String(otherId));
  const otherState = USER_STATES.find(s => s.key === otherUserOnline?.state) || USER_STATES[3];

  const myId = normalizeId(getMyUserId() || user?._id || user?.id);

  return (
    <div className="mobile-chat-container">
      {/* Header */}
      <header className="mobile-chat-header">
        <button className="mobile-chat-back" onClick={onBack}>
          <FaArrowLeft />
        </button>
        
        <div className="mobile-chat-user-info" onClick={() => setMenuOpen(!menuOpen)}>
          <div className="mobile-chat-avatar-wrap">
            {chat?.otherUser?.avatar ? (
              <img 
                src={getAvatarUrl(chat.otherUser.avatar)} 
                alt="avatar"
                className="mobile-chat-avatar"
                onError={e => { e.target.src = defaultAvatar; }}
              />
            ) : (
              <div className="mobile-chat-avatar-placeholder">
                {(chat?.otherUser?.firstName?.[0] || '?').toUpperCase()}
              </div>
            )}
            <span 
              className="mobile-chat-status-dot"
              style={{ background: otherState.color }}
            />
          </div>
          
          <div className="mobile-chat-user-text">
            <span className="mobile-chat-username">
              {chat?.otherUser?.firstName 
                ? `${chat.otherUser.firstName} ${chat.otherUser.lastName || ''}`
                : chat?.otherUser?.email || 'Usuario'}
            </span>
            <span className="mobile-chat-status" style={{ color: otherState.color }}>
              {otherState.label}
            </span>
          </div>
        </div>
        
        <button className="mobile-chat-menu" onClick={() => setMenuOpen(!menuOpen)}>
          <FaEllipsisV />
        </button>
      </header>

      {/* Messages Area */}
      <div className="mobile-chat-messages">
        {loading ? (
          <div className="mobile-chat-loading">
            <div className="mobile-spinner-large" />
            <span>Cargando mensajes...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="mobile-chat-empty">
            <span className="empty-emoji">💬</span>
            <span>¡Envía el primer mensaje!</span>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const msgFrom = normalizeId(msg.from);
            const isMine = myId && msgFrom && myId === msgFrom;
            
            return (
              <div 
                key={msg.id || idx}
                className={`mobile-msg ${isMine ? 'mine' : 'other'} ${msg.pending ? 'pending' : ''} ${msg.failed ? 'failed' : ''}`}
              >
                {msg.image ? (
                  <div className="mobile-msg-bubble image-bubble">
                    <ChatImage src={msg.image} isMine={isMine} />
                    <span className="mobile-msg-time">{msg.time}</span>
                  </div>
                ) : msg.tic ? (
                  <div className="mobile-msg-bubble tic-bubble">
                    <span className="tic-icon">⚡</span>
                    <span className="tic-text">¡TIC!</span>
                    <span className="mobile-msg-time">{msg.time}</span>
                  </div>
                ) : (
                  <div className="mobile-msg-bubble">
                    <span className="mobile-msg-text">{msg.text}</span>
                    <div className="mobile-msg-meta">
                      {msg.pending && <span className="pending-icon">⏳</span>}
                      {msg.failed && <span className="failed-icon">⚠️</span>}
                      <span className="mobile-msg-time">{msg.time}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="mobile-chat-input-area">
        <button 
          className="mobile-chat-action-btn"
          onClick={handleTic}
          title="Enviar TIC"
        >
          <FaBolt />
        </button>
        
        <button 
          className="mobile-chat-action-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Enviar imagen"
        >
          <FaImage />
        </button>
        <input 
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />
        
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Escribe un mensaje..."
          className="mobile-chat-input"
          disabled={sending}
        />
        
        <button 
          className="mobile-chat-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || sending}
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
}
