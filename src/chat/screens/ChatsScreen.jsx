import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getUsers, createChat, getChats, markChatAsRead } from "../api";
import { useSocket } from "../SocketContext";
import { API_URL } from '../api';
import defaultAvatar from '../../assets/user.png';
import { FaPlus, FaCircle } from "react-icons/fa";

// Utilidad simple de debounce
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function getAvatarUrl(avatar) {
  if (!avatar) return defaultAvatar;
  if (avatar.startsWith('http')) return avatar;
  if (avatar.startsWith('data:image')) return avatar; // base64
  const cleanAvatar = avatar.replace(/^avatar\//, '');
  return `${API_URL}/api/avatar/${cleanAvatar}`;
}

const USER_STATES = [
  { key: 'online', label: 'En línea', color: '#3ac47d', icon: '🟢' },
  { key: 'away', label: 'Ausente', color: '#ffe066', icon: '🟡' },
  { key: 'busy', label: 'Ocupado', color: '#e74c3c', icon: '🔴' },
  { key: 'invisible', label: 'Invisible', color: '#b0b8c9', icon: '⚪' },
];

// UI para lista de chats y creación de nuevo chat
//import { FaPlus } from "react-icons/fa";

export default function ChatsScreen({ user, token, onSelectChat, onSelectGroup, onProfile }) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [chats, setChats] = useState([]);
  const [results, setResults] = useState([]);
  const [chatError, setChatError] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [apiError, setApiError] = useState("");
  // loading para búsqueda de usuarios
  const [loading, setLoading] = useState(false);

  // Cargar chats
  const loadChats = useCallback(() => {
    if (!token) return;
    setLoadingChats(true);
    setApiError("");
    getChats(token)
      .then(data => setChats(data.chats || data))
      .catch(e => setApiError(e.message))
      .finally(() => setLoadingChats(false));
  }, [token]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Buscar usuarios (simulado, deberías conectar a tu API real)
  const handleSearch = e => {
    setSearch(e.target.value);
    setLoading(true);
    setTimeout(() => {
      // Simulación: filtra usuarios por email
      setResults([]); // Aquí deberías poner los resultados reales
      setLoading(false);
    }, 800);
  };

  // ...existing code...

  // Avatar o inicial del usuario
  const getUserInitial = email => {
    if (!email) return "U";
    return email[0].toUpperCase();
  };


  // ...existing code...
  // Crear chat real
  const handleCreateChat = async (userToChat) => {
    setShowModal(false);
    setSearch("");
    setResults([]);
    setChatError("");
    try {
      const chat = await createChat(user._id, userToChat._id);
      if (chat && chat.msg && !chat._id) {
        const existing = chats.find(c => {
          const ids = [c.participant_one?._id || c.participant_one, c.participant_two?._id || c.participant_two];
          return ids.includes(user._id) && ids.includes(userToChat._id);
        });
        if (existing) {
          const normalizedChat = {
            ...existing,
            _id: existing._id || existing.id,
            otherUser: (existing.participants || []).find(u => u._id !== user._id && u.email !== user.email) || existing.otherUser
          };
          onSelectChat(normalizedChat);
        } else {
          setChatError("Ya existe una conversación, pero no se pudo encontrar el chat en la lista.");
        }
        return;
      }
      const normalizedChat = {
        ...chat,
        _id: chat._id || chat.id,
        otherUser: (chat.participants || []).find(u => u._id !== user._id && u.email !== user.email) || chat.otherUser
      };
      onSelectChat(normalizedChat);
    } catch (err) {
      setChatError("No se pudo crear el chat: " + (err.message || "Error desconocido"));
    }
  };

  // Rediseño profesional y minimalista de la lista de chats
  const chatList = useMemo(() => (
    chats.map(chat => {
      let participants = chat.participants;
      if (!participants && chat.participant_one && chat.participant_two) {
        participants = [chat.participant_one, chat.participant_two];
      }
      const other = (participants || []).find(u => u && u._id !== user._id && u.email !== user.email) || chat.otherUser;
      const normalizedChat = {
        ...chat,
        participants: participants,
        _id: chat._id || chat.id,
        otherUser: other
      };
      const isOnline = other?._id && String(other._id) !== String(user._id) && onlineUsers.includes(String(other._id));
      return (
        <button key={normalizedChat._id} onClick={async () => {
          try {
            if (normalizedChat.unread_count > 0) {
              await markChatAsRead(normalizedChat._id);
              setChats(prev => prev.map(c => c._id === normalizedChat._id ? { ...c, unread_count: 0 } : c));
            }
          } catch (e) {}
          onSelectChat(normalizedChat);
        }}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.82)',
            border: isOnline ? '2.5px solid #3ac47d' : '2px solid #e3eaf2',
            borderRadius: 24,
            padding: '18px 28px',
            marginBottom: 22,
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            cursor: 'pointer',
            transition: 'box-shadow .18s, transform .18s',
            fontWeight: 600,
            color: '#23263a',
            boxShadow: normalizedChat.unread_count > 0 ? '0 12px 48px #00cfff33' : '0 4px 32px #3a8dde0a',
            backdropFilter: 'blur(14px)',
            position: 'relative',
            minHeight: 88,
            fontFamily: 'Inter, Roboto, system-ui',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 20px 64px #00cfff44'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = normalizedChat.unread_count > 0 ? '0 12px 48px #00cfff33' : '0 4px 32px #3a8dde0a'}
        >
          {/* Avatar */}
          <span style={{ position: 'relative', marginRight: 8 }}>
            {other?.avatar ? (
              <img src={getAvatarUrl(other.avatar)} alt="avatar" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', background: '#fff', display: 'block', boxShadow: '0 2px 12px #3a8dde22', border: isOnline ? '3px solid #3ac47d' : '3px solid #e3eaf2', transition: 'border .18s' }} onError={e => { e.target.onerror = null; e.target.src = defaultAvatar; }} />
            ) : (
              <span style={{ width: 56, height: 56, borderRadius: '50%', background: '#e3eaf2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#3a8dde', fontWeight: 700 }}>{(other?.firstName && other.firstName[0]) || (other?.email && other.email[0]) || '?'}</span>
            )}
            {/* Estado online */}
            {isOnline && <FaCircle style={{ position: 'absolute', bottom: 4, right: 4, color: '#3ac47d', fontSize: 18, background: '#fff', borderRadius: '50%', border: '2px solid #fff' }} />}
          </span>
          {/* Info */}
          <span style={{ flex: 1, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}>
            <span style={{ fontWeight: 800, fontSize: 20, color: '#1a1c3a', letterSpacing: 0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Inter, Roboto, system-ui' }}>{other?.firstName || other?.email || 'Usuario'}</span>
            <span style={{ color: '#6b7280', fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500, fontFamily: 'Inter, Roboto, system-ui' }}>{normalizedChat.last_message_text || 'Sin mensajes'}</span>
          </span>
          {/* Hora y badge */}
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 70 }}>
            <span style={{ color: '#a0aec0', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, Roboto, system-ui' }}>{normalizedChat.last_message_date ? new Date(normalizedChat.last_message_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
            {normalizedChat.unread_count > 0 && (
              <span style={{ marginTop: 8, background: 'linear-gradient(90deg,#00cfff 60%,#3a8dde 100%)', color: '#fff', borderRadius: 14, fontWeight: 800, fontSize: 15, minWidth: 28, minHeight: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px #00cfff44', padding: '0 10px', letterSpacing: 0.5, fontFamily: 'Inter, Roboto, system-ui', border: '2px solid #fff' }}>
                {normalizedChat.unread_count > 99 ? '99+' : normalizedChat.unread_count}
              </span>
            )}
          </span>
        </button>
      );
    })
  ), [chats, user, onSelectChat, onlineUsers]);

  return (
    <div style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', background: '#fafdff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 18px 10px 18px', borderBottom: '1.5px solid #e3eaf2', background: '#fafdff', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h2 style={{ fontWeight: 800, fontSize: 22, color: '#7a8ca3', margin: 0 }}>Chats</h2>
          <span style={{ fontSize: 15, color: '#3a8dde', fontWeight: 700, background: '#e3eaf2', borderRadius: 8, padding: '4px 12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email || 'Usuario'}
              {/* Estado visual */}
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
            {/* Nickname/mensaje de estado */}
            {(() => {
              const msg = localStorage.getItem('magic2k_user_status_msg') || '';
              return msg ? (
                <span style={{ fontSize: 13, color: '#7a8ca3', fontWeight: 500, marginTop: 1, maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg}</span>
              ) : null;
            })()}
          </span>
        </div>
        <button onClick={() => setShowModal(true)} style={{ background: 'linear-gradient(90deg,#3a8dde 60%,#6a9cff 100%)', color: '#fff', border: 'none', borderRadius: 12, padding: '8px 18px', fontWeight: 700, fontSize: 15, boxShadow: '0 1px 8px #3a8dde22', cursor: 'pointer', transition: 'background .2s' }}>+ Nuevo chat</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 24px 0', margin: 0, display: 'flex', flexDirection: 'column', background: '#fafdff', zIndex: 1 }}>
        {loadingChats ? (
          <div style={{ width: '100%', maxWidth: 480, margin: '48px auto 0 auto' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, padding: '14px 18px', borderRadius: 12, background: '#f3f7fb', boxShadow: '0 1px 8px #3a8dde08', border: '1.5px solid #e3eaf2', width: '100%', minHeight: 56 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(90deg,#e3eaf2 25%,#fafdff 50%,#e3eaf2 75%)', animation: 'skeletonShimmer 1.2s infinite linear', backgroundSize: '200% 100%' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ width: '60%', height: 16, borderRadius: 8, background: 'linear-gradient(90deg,#e3eaf2 25%,#fafdff 50%,#e3eaf2 75%)', animation: 'skeletonShimmer 1.2s infinite linear', backgroundSize: '200% 100%' }} />
                  <div style={{ width: '40%', height: 12, borderRadius: 6, background: 'linear-gradient(90deg,#e3eaf2 25%,#fafdff 50%,#e3eaf2 75%)', animation: 'skeletonShimmer 1.2s infinite linear', backgroundSize: '200% 100%' }} />
                </div>
              </div>
            ))}
            <style>{`
              @keyframes skeletonShimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
            `}</style>
          </div>
        ) : apiError ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: '#fafdff' }}>
            <div style={{ color: '#e74c3c', fontWeight: 600, padding: '24px 0', textAlign: 'center', fontSize: 18, marginBottom: 18 }}>{apiError}</div>
            <button onClick={loadChats} style={{ background: 'linear-gradient(90deg,#3a8dde 60%,#6a9cff 100%)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 16, boxShadow: '0 1px 8px #3a8dde22', cursor: 'pointer', marginTop: 10 }}>Reintentar</button>
          </div>
        ) : chats.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: '#fafdff' }}>
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#3a8dde', marginBottom: 16 }}>M2k</div>
              <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>¡Bienvenido a <span style={{ color: '#3a8dde' }}>Magic2k</span>!</div>
              <div style={{ fontSize: 17, color: '#7a8ca3', marginBottom: 10 }}>Selecciona un chat o grupo para comenzar a conversar.<br />Disfruta una experiencia nostálgica, moderna y única.</div>
              <div style={{ fontWeight: 700, color: '#3a8dde', fontSize: 15, marginTop: 8 }}>Simple. Privado. Mágico.</div>
            </div>
            {chatError && (
              <div style={{ color: '#e74c3c', fontWeight: 600, padding: '16px 0', textAlign: 'center', fontSize: 16 }}>{chatError}</div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '32px 0 0 0', background: '#fafdff' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#3a8dde', marginBottom: 18 }}>Tus chats</div>
            <div style={{ width: '100%', maxWidth: 480 }}>
              {chatList}
            </div>
          </div>
        )}
      </div>
      {/* Botón 'Mi perfil' eliminado por solicitud del usuario */}

      {/* Modal para crear chat */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 2000, background: 'rgba(20,22,34,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 8px 32px #3a8dde22', padding: '32px 24px', minWidth: 320, maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 26, color: '#3a8dde', cursor: 'pointer' }}>×</button>
            <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 18, color: '#3a8dde' }}>Nuevo chat</h3>
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Buscar usuario por nombre o email..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e3eaf2', fontSize: 15, marginBottom: 14, outline: 'none' }}
              autoFocus
            />
            {loading && <div style={{ color: '#7a8ca3', fontWeight: 500 }}>Buscando...</div>}
            {!loading && results.length === 0 && search.length > 1 && <div style={{ color: '#7a8ca3', fontWeight: 500 }}>Sin resultados</div>}
            <div style={{ width: '100%', marginTop: 6 }}>
              {results.map(u => (
                <button key={u._id} onClick={() => handleCreateChat(u)} style={{ width: '100%', background: '#fafdff', border: '1.5px solid #e3eaf2', borderRadius: 10, padding: '10px 12px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'background .2s', fontWeight: 600, color: '#23263a' }}>
                  <span style={{ background: '#e3eaf2', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: '#3a8dde', fontWeight: 700 }}>
                    {(u.firstName && u.firstName[0]) || (u.email && u.email[0]) || '?'}
                  </span>
                  <span style={{ flex: 1, textAlign: 'left' }}>
                    {u.firstName ? (
                      <>
                        {u.firstName} {u.lastName || ''}
                        <span style={{ color: '#7a8ca3', fontWeight: 400, fontSize: 13, marginLeft: 6 }}>{u.email}</span>
                      </>
                    ) : (
                      u.email
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
