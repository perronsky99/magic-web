import React, { useEffect, useState } from "react";
import { getChats } from "../api";
import defaultAvatar from '../../assets/user.png';

function getAvatarUrl(avatar) {
  if (!avatar) return defaultAvatar;
  if (avatar.startsWith('http')) return avatar;
  if (avatar.startsWith('data:image')) return avatar; // base64
  return defaultAvatar;
}

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

  if (loading) return <div style={{padding:32, color:'#7a8ca3', fontWeight:500}}>Cargando chats...</div>;
  if (error) return <div style={{color:'#e74c3c', padding:32, fontWeight:600}}>{error}</div>;

  return (
    <div style={{ width: '100%', padding: '0 0 18px 0' }}>
      <h2 style={{
        fontWeight: 800,
        fontSize: 24,
        color: '#23263a',
        margin: '18px 0 18px 0',
        letterSpacing: 0.5,
        textAlign: 'left',
        paddingLeft: 8,
      }}>Chats</h2>
      <ul style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        {chats.map(chat => {
          const other = chat.otherUser || {};
          const name = chat.name || other.firstName || other.email || 'Usuario';
          const avatar = getAvatarUrl(other.avatar);
          return (
            <li
              key={chat._id}
              onClick={() => onSelectChat(chat)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                background: 'rgba(255,255,255,0.82)',
                borderRadius: 18,
                boxShadow: '0 2px 12px #3a8dde11',
                padding: '16px 18px',
                cursor: 'pointer',
                transition: 'box-shadow .18s, background .18s, transform .18s',
                border: '1.5px solid #e3eaf2',
                position: 'relative',
                minHeight: 64,
                userSelect: 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 24px #3a8dde22'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px #3a8dde11'}
              tabIndex={0}
              aria-label={`Abrir chat con ${name}`}
            >
              <img
                src={avatar}
                alt="avatar"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  boxShadow: '0 1px 8px #3a8dde22',
                  border: '2px solid #e3eaf2',
                  background: '#fff',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 700,
                  fontSize: 18,
                  color: '#23263a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginBottom: 2,
                }}>{name}</div>
                {other.email && (
                  <div style={{ fontSize: 13, color: '#7a8ca3', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{other.email}</div>
                )}
              </div>
              {/* Badge de mensajes no leídos (ejemplo visual, puedes conectar con tu lógica real) */}
              {chat.unreadCount > 0 && (
                <span style={{
                  background: 'linear-gradient(90deg,#3a8dde 60%,#6a9cff 100%)',
                  color: '#fff',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 13,
                  padding: '3px 10px',
                  marginLeft: 8,
                  boxShadow: '0 1px 6px #3a8dde22',
                  minWidth: 24,
                  textAlign: 'center',
                  display: 'inline-block',
                }}>{chat.unreadCount}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
