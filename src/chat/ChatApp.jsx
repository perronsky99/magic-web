import React, { useState, useEffect } from "react";
import './ChatApp.css';
import { loginUser, updateStatusMsg } from "./api";
import logo from '../assets/image.png';
import ChatsScreen from "./screens/ChatsScreen";
import GroupsScreen from "./screens/GroupsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ChatScreen from "./screens/ChatScreen";
import GroupChatScreen from "./screens/GroupChatScreen";
import { FaUserFriends, FaComments, FaUserCircle } from "react-icons/fa";
import { SocketProvider, useSocket } from "./SocketContext";
import { API_URL } from './api';
import defaultAvatar from '../assets/user.png';
// Mobile views
import MobileHomeView from "./components/MobileHomeView";
import MobileChatView from "./components/MobileChatView";

// Hook para detectar si es móvil
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);
  
  return isMobile;
}

function getAvatarUrl(avatar) {
  if (!avatar) return defaultAvatar;
  if (avatar.startsWith('http')) return avatar;
  if (avatar.startsWith('data:image')) return avatar; // base64
  // Si avatar ya incluye 'avatar/', no lo dupliques
  const cleanAvatar = avatar.replace(/^avatar\//, '');
  return `${API_URL}/api/avatar/${cleanAvatar}`;
}

const USER_STATES = [
  { key: 'online', label: 'En línea', color: '#3ac47d', icon: '🟢' },
  { key: 'away', label: 'Ausente', color: '#ffe066', icon: '🟡' },
  { key: 'busy', label: 'Ocupado', color: '#e74c3c', icon: '🔴' },
  { key: 'invisible', label: 'Invisible', color: '#b0b8c9', icon: '⚪' },
];

// Componente que emite cambios de estado al socket
function StateEmitter({ userId, userState }) {
  const socket = useSocket();
  const lastEmittedRef = React.useRef(null);
  
  useEffect(() => {
    // Solo emitir si el socket está conectado y hay un cambio real
    if (socket?.connected && userId && userState) {
      const key = `${userId}-${userState}`;
      if (lastEmittedRef.current !== key) {
        lastEmittedRef.current = key;
        socket.emit("change_state", { userId, state: userState });
      }
    }
  }, [socket?.connected, userId, userState]);
  
  return null;
}

export default function ChatApp({ token, user, onLogout, onUserUpdate }) {
  const isMobile = useIsMobile(768);
  const [section, setSection] = useState(() => isMobile ? "home" : "chats"); // home (mobile) | chats | groups | profile | chat | groupchat
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  // Estado de usuario MSN
  const [userState, setUserState] = useState(() => localStorage.getItem('magic2k_user_state') || 'online');
  useEffect(() => { localStorage.setItem('magic2k_user_state', userState); }, [userState]);
  // Nickname/mensaje de estado MSN
  const [userStatusMsg, setUserStatusMsg] = useState(() => localStorage.getItem('magic2k_user_status_msg') || '');
  // Contador de usuarios online
  const [onlineCount, setOnlineCount] = useState(0);
  
  useEffect(() => {
    localStorage.setItem('magic2k_user_status_msg', userStatusMsg);
    // Sincronizar con backend
    if (userStatusMsg !== undefined) {
      updateStatusMsg(userStatusMsg).catch(() => { });
    }
  }, [userStatusMsg]);

  // Escuchar cambios en usuarios online para el contador
  useEffect(() => {
    const handleUsersUpdated = (e) => {
      setOnlineCount(e.detail?.length || 0);
    };
    window.addEventListener('magic2k_users_updated', handleUsersUpdated);
    // Inicializar
    setOnlineCount(window.magic2k_onlineUsers?.length || 0);
    return () => window.removeEventListener('magic2k_users_updated', handleUsersUpdated);
  }, []);

  if (!token) {
    return null; // No mostrar nada si no hay token (el login lo maneja el modal externo)
  }

  // Handler para navegación móvil
  const handleMobileNavigate = (screen) => {
    setSection(screen);
  };

  // === VISTA MÓVIL ===
  if (isMobile) {
    return (
      <SocketProvider user={user} token={token}>
        <StateEmitter userId={user?._id} userState={userState} />
        
        {/* Home móvil (menú principal) */}
        {section === "home" && (
          <MobileHomeView
            user={user}
            userState={userState}
            setUserState={setUserState}
            onNavigate={handleMobileNavigate}
            onLogout={onLogout}
            onlineCount={onlineCount}
          />
        )}
        
        {/* Lista de chats móvil */}
        {section === "chats" && !selectedChat && (
          <div className="mobile-screen-wrapper">
            <header className="mobile-simple-header">
              <button className="mobile-header-back" onClick={() => setSection("home")}>←</button>
              <span className="mobile-header-title">Chats</span>
              <span className="mobile-header-count">{onlineCount} online</span>
            </header>
            <ChatsScreen 
              user={user} 
              token={token}
              onSelectChat={chat => { setSelectedChat(chat); setSection("chat"); }}
              onSelectGroup={group => { setSelectedGroup(group); setSection("groupchat"); }}
              onProfile={() => setSection("profile")} 
            />
          </div>
        )}
        
        {/* Chat individual móvil */}
        {section === "chat" && selectedChat && (
          <MobileChatView
            chat={selectedChat}
            user={user}
            onBack={() => { setSelectedChat(null); setSection("chats"); }}
          />
        )}
        
        {/* Grupos móvil */}
        {section === "groups" && !selectedGroup && (
          <div className="mobile-screen-wrapper">
            <header className="mobile-simple-header">
              <button className="mobile-header-back" onClick={() => setSection("home")}>←</button>
              <span className="mobile-header-title">Grupos</span>
              <span className="mobile-header-count"></span>
            </header>
            <GroupsScreen 
              user={user} 
              token={token}
              onSelectGroup={group => { setSelectedGroup(group); setSection("groupchat"); }}
              onBack={() => setSection("home")} 
            />
          </div>
        )}
        
        {/* Chat grupal móvil */}
        {section === "groupchat" && selectedGroup && (
          <GroupChatScreen 
            group={selectedGroup} 
            user={user} 
            token={token} 
            onBack={() => { setSelectedGroup(null); setSection("groups"); }} 
          />
        )}
        
        {/* Perfil móvil */}
        {section === "profile" && (
          <div className="mobile-screen-wrapper">
            <header className="mobile-simple-header">
              <button className="mobile-header-back" onClick={() => setSection("home")}>←</button>
              <span className="mobile-header-title">Mi Perfil</span>
              <span className="mobile-header-count"></span>
            </header>
            <ProfileScreen
              user={user}
              token={token}
              onBack={() => setSection("home")}
              onUserUpdate={onUserUpdate}
            />
          </div>
        )}
      </SocketProvider>
    );
  }

  // === VISTA DESKTOP (original) ===
  return (
    <SocketProvider user={user} token={token}>
      <StateEmitter userId={user?._id} userState={userState} />
      <div className="chat-app-main" style={{
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
        <div className="chat-app-sidebar" style={{
          width: 148,
          minWidth: 148,
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderRight: '2.5px solid #e3eaf2',
          borderRadius: '32px',
          margin: '14px 0 14px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px 0 24px 0',
          gap: 32,
          boxShadow: '0 8px 48px #3a8dde22, 0 1.5px 0 #e3eaf2',
          zIndex: 10,
          transition: 'all .25s cubic-bezier(.4,1.4,.6,1)',
        }}>
          <div className="mm-home-logoWrap" style={{ marginBottom: 18 }}>
          <div className="mm-home-halo" />

          <div className="mm-home-stars">
            <span style={{ top:'12%', left:'55%', fontSize:18, color:'#fff', opacity:.8, animation:'star-move1 3.2s linear infinite' }}>✦</span>
            <span style={{ top:'28%', right:'8%', fontSize:14, color:'#6a9cff', opacity:.7, animation:'star-move2 2.7s linear infinite' }}>✧</span>
            <span style={{ bottom:'18%', left:'18%', fontSize:13, color:'#3a8dde', opacity:.6, animation:'star-move3 3.5s linear infinite' }}>✦</span>
            <span style={{ bottom:'10%', right:'16%', fontSize:16, color:'#eaf2ff', opacity:.7, animation:'star-move4 2.9s linear infinite' }}>✧</span>
            <span style={{ top:'20%', left:'22%', fontSize:10, color:'#fffbe6', opacity:.5, animation:'star-move5 4.1s linear infinite' }}>✦</span>
            <span style={{ bottom:'24%', right:'24%', fontSize:12, color:'#b0c4ff', opacity:.5, animation:'star-move6 3.7s linear infinite' }}>✧</span>
          </div>

          <img src={logo} alt="Magic2k" className="mm-home-logoImg" />
        </div>
          {/* Avatar y estado */}
          <div style={{ marginBottom: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
            <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto', boxShadow: '0 2px 16px #3a8dde33', borderRadius: '50%', background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'box-shadow .2s' }}>
              {user?.avatar ? (
                <img
                  src={getAvatarUrl(user.avatar)}
                  alt="avatar"
                  style={{ width: 66, height: 66, borderRadius: "50%", border: section === "profile" ? '3px solid #3a8dde' : '3px solid #e3eaf2', objectFit: 'cover', background: '#fff', display: 'block', transition: 'border .2s' }}
                  onError={e => { e.target.onerror = null; e.target.src = defaultAvatar; }}
                />
              ) : <FaUserCircle style={{ width: 66, height: 66, color: '#b0b8c9' }} />}
              {/* Glow animado si online */}
              {userState === 'online' && <span style={{ position: 'absolute', bottom: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: 'radial-gradient(circle,#3ac47d 60%,#fff0 100%)', boxShadow: '0 0 10px #3ac47d88', border: '2.5px solid #fff' }} />}
            </div>
            <select
              value={userState}
              onChange={e => setUserState(e.target.value)}
              style={{
                marginTop: 2,
                border: 'none',
                borderRadius: 12,
                padding: '8px 0',
                fontSize: 17,
                fontWeight: 700,
                color: USER_STATES.find(s => s.key === userState)?.color || '#23263a',
                background: 'rgba(245,250,255,0.85)',
                outline: 'none',
                boxShadow: '0 1px 8px #3a8dde11',
                textAlign: 'center',
                cursor: 'pointer',
                appearance: 'none',
                minWidth: 110,
                transition: 'background .2s',
              }}
            >
              {USER_STATES.map(s => (
                <option key={s.key} value={s.key} style={{ color: s.color }}>
                  {s.icon} {s.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={userStatusMsg}
              onChange={e => setUserStatusMsg(e.target.value.slice(0, 60))}
              placeholder="Agrega un estado, frase o emoji ✨"
              style={{
                marginTop: 8,
                border: 'none',
                borderRadius: 12,
                padding: '10px 14px',
                fontSize: 16,
                fontWeight: 500,
                color: '#3a8dde',
                background: 'rgba(245,250,255,0.85)',
                outline: 'none',
                boxShadow: '0 1px 8px #3a8dde11',
                textAlign: 'center',
                width: 120,
                maxWidth: 180,
                transition: 'background .2s',
              }}
              maxLength={60}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
            <button onClick={() => setSection("chats")}
              style={{
                background: section === "chats" ? 'linear-gradient(90deg,#3a8dde 60%,#6a9cff 100%)' : 'rgba(245,250,255,0.85)',
                border: 'none',
                borderRadius: 14,
                marginBottom: 2,
                cursor: 'pointer',
                outline: 'none',
                color: section === "chats" ? '#fff' : '#7a8ca3',
                fontSize: 30,
                boxShadow: section === "chats" ? '0 2px 12px #3a8dde33' : '0 1px 4px #3a8dde11',
                padding: '12px 0',
                width: 56,
                transition: 'all .18s',
              }}
              title="Chats"
            >
              <FaComments />
            </button>
            <button onClick={() => setSection("groups")}
              style={{
                background: section === "groups" ? 'linear-gradient(90deg,#3a8dde 60%,#6a9cff 100%)' : 'rgba(245,250,255,0.85)',
                border: 'none',
                borderRadius: 14,
                marginBottom: 2,
                cursor: 'pointer',
                outline: 'none',
                color: section === "groups" ? '#fff' : '#7a8ca3',
                fontSize: 28,
                boxShadow: section === "groups" ? '0 2px 12px #3a8dde33' : '0 1px 4px #3a8dde11',
                padding: '12px 0',
                width: 56,
                transition: 'all .18s',
              }}
              title="Grupos"
            >
              <FaUserFriends />
            </button>
          </div>
          {/* Botón de perfil flotante abajo */}
          <div style={{ marginTop: 'auto', marginBottom: 10, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setSection("profile")}
              style={{
                background: section === "profile" ? 'linear-gradient(90deg,#3a8dde 60%,#6a9cff 100%)' : 'rgba(245,250,255,0.85)',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                outline: 'none',
                color: section === "profile" ? '#fff' : '#7a8ca3',
                boxShadow: section === "profile" ? '0 2px 12px #3a8dde33' : '0 1px 4px #3a8dde11',
                padding: 0,
                width: 54,
                height: 54,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                marginBottom: 2,
                transition: 'all .18s',
              }}
              title="Mi perfil"
            >
              {user?.avatar ? (
                <img
                  src={getAvatarUrl(user.avatar)}
                  alt="avatar"
                  style={{ width: 44, height: 44, borderRadius: "50%", border: section === "profile" ? '3px solid #3a8dde' : '3px solid #e3eaf2', objectFit: 'cover', background: '#fff', display: 'block', transition: 'border .2s' }}
                  onError={e => { e.target.onerror = null; e.target.src = defaultAvatar; }}
                />
              ) : <FaUserCircle style={{ width: 44, height: 44, color: '#b0b8c9' }} />}
            </button>
            {/* Botón de cerrar sesión */}
            <button
              onClick={onLogout}
              style={{
                background: 'linear-gradient(90deg,#fff 60%,#ffeaea 100%)',
                border: 'none',
                borderRadius: 14,
                padding: '10px 0',
                width: 54,
                color: '#e74c3c',
                fontWeight: 700,
                fontSize: 16,
                boxShadow: '0 1px 8px #e74c3c22',
                cursor: 'pointer',
                transition: 'all .18s',
                outline: 'none',
                marginTop: 2,
              }}
              title="Cerrar sesión"
            >
              <span style={{ fontSize: 20, fontWeight: 900 }}>⎋</span>
            </button>
          </div>
        </div>
        {/* Main area */}
  <div className="chat-app-mainarea" style={{ flex: 1, background: '#fafdff', display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
          {/* Pantalla de chats */}
          {section === "chats" && (
            <ChatsScreen user={user} token={token}
              onSelectChat={chat => { setSelectedChat(chat); setSection("chat"); }}
              onSelectGroup={group => { setSelectedGroup(group); setSection("groupchat"); }}
              onProfile={() => setSection("profile")} />
          )}
          {/* Pantalla de grupos */}
          {section === "groups" && (
            <GroupsScreen user={user} token={token}
              onSelectGroup={group => { setSelectedGroup(group); setSection("groupchat"); }}
              onBack={() => setSection("chats")} />
          )}
          {/* Pantalla de perfil */}
          {section === "profile" && (
            <ProfileScreen
              user={user}
              token={token}
              onBack={() => setSection("chats")}
              onUserUpdate={onUserUpdate}
            />
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
