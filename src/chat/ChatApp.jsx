import React, { useState } from "react";
import { loginUser } from "./api";
import logo from '../assets/image.png';
import ChatsScreen from "./screens/ChatsScreen";
import GroupsScreen from "./screens/GroupsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ChatScreen from "./screens/ChatScreen";
import GroupChatScreen from "./screens/GroupChatScreen";
import { FaUserFriends, FaComments, FaUserCircle } from "react-icons/fa";
import { SocketProvider } from "./SocketContext";
import { API_URL } from './api';
import defaultAvatar from '../assets/user.png';

function getAvatarUrl(avatar) {
  if (!avatar) return defaultAvatar;
  if (avatar.startsWith('http')) return avatar;
  return `${API_URL}/api/${avatar.replace(/^\/+/, '')}`;
}

export default function ChatApp({ token, user, onLogout }) {
  const [section, setSection] = useState("chats"); // chats | groups | profile | chat | groupchat
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  if (!token) {
    return null; // No mostrar nada si no hay token (el login lo maneja el modal externo)
  }

  // Sidebar MSN style
  return (
    <SocketProvider user={user} token={token}>
      <div style={{
        display: 'flex',
        height: '92vh',
        maxWidth: 'min(98vw,1500px)',
        minWidth: 700,
        width: '90vw',
        margin: '30px auto',
        borderRadius: 24,
        boxShadow: '0 8px 48px #3a8dde22',
        overflow: 'hidden',
        background: '#fafdff',
        border: '1.5px solid #e3eaf2',
        transition: 'max-width .3s cubic-bezier(.4,1.4,.6,1)',
      }}>
        {/* Sidebar */}
        <div style={{ width: 90, background: 'linear-gradient(180deg,#e3eaf2 0%,#fafdff 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 18, boxShadow: '2px 0 12px #3a8dde11', zIndex: 2 }}>
          <div style={{ marginBottom: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 54, height: 54 }}>
            <img src={logo} alt="Magic2k" style={{ width: 48, height: 48, borderRadius: 12, boxShadow: '0 2px 8px #3a8dde22', background: '#fff', objectFit: 'contain' }} />
          </div>
          <button onClick={() => setSection("chats")}
            style={{ background: 'none', border: 'none', marginBottom: 8, cursor: 'pointer', outline: 'none', color: section === "chats" ? '#3a8dde' : '#7a8ca3', fontSize: 28, transition: 'color .2s' }}
            title="Chats">
            <FaComments />
          </button>
          <button onClick={() => setSection("groups")}
            style={{ background: 'none', border: 'none', marginBottom: 8, cursor: 'pointer', outline: 'none', color: section === "groups" ? '#3a8dde' : '#7a8ca3', fontSize: 26, transition: 'color .2s' }}
            title="Grupos">
            <FaUserFriends />
          </button>
          <button onClick={() => setSection("profile")}
            style={{ background: 'none', border: 'none', marginTop: 'auto', cursor: 'pointer', outline: 'none', color: section === "profile" ? '#3a8dde' : '#7a8ca3', fontSize: 30, transition: 'color .2s' }}
            title="Mi perfil">
            {user?.avatar ? (
              <img
                src={getAvatarUrl(user.avatar)}
                alt="avatar"
                style={{ width: 44, height: 44, borderRadius: "50%", border: section === "profile" ? '2.5px solid #3a8dde' : '2.5px solid #e3eaf2', objectFit: 'cover', boxShadow: '0 1px 4px #3a8dde22', background: '#fff', display: 'block' }}
                onError={e => { e.target.onerror = null; e.target.src = defaultAvatar; }}
              />
            ) : <FaUserCircle style={{ width: 44, height: 44 }} />}
          </button>
          {/* Botón de cerrar sesión */}
          <button
            onClick={onLogout}
            style={{ background: '#fff', border: '1.5px solid #e3eaf2', borderRadius: 8, marginTop: 24, padding: '7px 0', width: 44, cursor: 'pointer', color: '#e74c3c', fontWeight: 600, boxShadow: '0 1px 4px #3a8dde11', fontSize: 15, transition: 'background .2s' }}
            title="Cerrar sesión"
          >
            Salir
          </button>
        </div>
        {/* Main area */}
        <div style={{ flex: 1, background: '#fafdff', display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
          {/* Pantalla de chats */}
          {section === "chats" && (
            <ChatsScreen user={user} token={token}
              onSelectChat={chat => { setSelectedChat(chat); setSection("chat"); }}
              onSelectGroup={group => { setSelectedGroup(group); setSection("groupchat"); }}
              onProfile={() => setSection("profile")} />
          )}
          {/* Pantalla de grupos */}
          {section === "groups" && (
            <>
              <GroupsScreen user={user} token={token}
                onSelectGroup={group => { setSelectedGroup(group); setSection("groupchat"); }}
                onBack={() => setSection("chats")} />
              {/* Mensaje de bienvenida si no hay grupo seleccionado */}
              {!selectedGroup && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: 'radial-gradient(ellipse at 60% 40%, #e3eaf2 60%, #fafdff 100%)',
                  zIndex: 1,
                  pointerEvents: 'none',
                  animation: 'fadeInWelcome 0.7s',
                  minWidth: 0,
                  width: '100%',
                  maxWidth: 600,
                  margin: '0 auto',
                }}>
                  <span style={{ marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="74" height="74" viewBox="0 0 74 74" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 32px #3a8dde55)', animation: 'glowLogo 2.2s infinite alternate' }}>
                      <circle cx="37" cy="37" r="36" fill="#fff" stroke="#3a8dde" strokeWidth="2.5" />
                      <text x="50%" y="54%" textAnchor="middle" fill="#3a8dde" fontSize="28" fontWeight="bold" fontFamily="'Segoe UI',sans-serif" dy=".3em">M2k</text>
                    </svg>
                  </span>
                  <h2 style={{
                    color: '#23263a', fontWeight: 900, letterSpacing: 0.5, marginBottom: 10, fontSize: 32,
                    textShadow: '0 2px 16px #3a8dde11, 0 1px 0 #fff',
                    fontFamily: "'Segoe UI', 'Montserrat', 'Inter', sans-serif"
                  }}>
                    Grupos de <span style={{ color: '#3a8dde' }}>Magic2k</span>
                  </h2>
                  <div style={{
                    color: '#5a6a8c', fontSize: 19, fontWeight: 500, maxWidth: 420, textAlign: 'center', lineHeight: 1.5,
                    background: 'rgba(255,255,255,0.7)', borderRadius: 14, padding: '18px 22px', boxShadow: '0 2px 16px #3a8dde11', marginBottom: 8
                  }}>
                    Selecciona un grupo para ver los mensajes y participar en la conversación.<br />
                    <span style={{ fontSize: 15, color: '#3a8dde', fontWeight: 700, letterSpacing: 1, display: 'block', marginTop: 10, opacity: 0.85 }}>¡Crea tu propio grupo y hazlo único!</span>
                  </div>
                  {/* Animaciones CSS en línea */}
                  <style>{`
                    @keyframes fadeInWelcome {
                      from { opacity: 0; transform: translateY(24px); }
                      to { opacity: 1; transform: none; }
                    }
                    @keyframes glowLogo {
                      from { filter: drop-shadow(0 2px 32px #3a8dde33); }
                      to { filter: drop-shadow(0 2px 64px #3a8ddecc); }
                    }
                  `}</style>
                </div>
              )}
            </>
          )}
          {/* Pantalla de perfil */}
          {section === "profile" && (
            <ProfileScreen user={user} token={token} onBack={() => setSection("chats")} />
          )}
          {/* Chat individual */}
          {section === "chat" && selectedChat && (
            <ChatScreen chat={selectedChat} user={user} token={token} onBack={() => setSection("chats")} />
          )}
          {/* Chat grupal */}
          {section === "groupchat" && selectedGroup && (
            <GroupChatScreen group={selectedGroup} user={user} token={token} onBack={() => setSection("groups")} />
          )}
        </div>
      </div>
    </SocketProvider>
  );
}
