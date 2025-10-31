import React, { useState, useEffect } from "react";
import { loginUser, updateStatusMsg } from "./api";
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

const USER_STATES = [
  { key: 'online', label: 'En línea', color: '#3ac47d', icon: '🟢' },
  { key: 'away', label: 'Ausente', color: '#ffe066', icon: '🟡' },
  { key: 'busy', label: 'Ocupado', color: '#e74c3c', icon: '🔴' },
  { key: 'invisible', label: 'Invisible', color: '#b0b8c9', icon: '⚪' },
];

export default function ChatApp({ token, user, onLogout }) {
  const [section, setSection] = useState("chats"); // chats | groups | profile | chat | groupchat
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  // Estado de usuario MSN
  const [userState, setUserState] = useState(() => localStorage.getItem('magic2k_user_state') || 'online');
  useEffect(() => { localStorage.setItem('magic2k_user_state', userState); }, [userState]);
  // Nickname/mensaje de estado MSN
  const [userStatusMsg, setUserStatusMsg] = useState(() => localStorage.getItem('magic2k_user_status_msg') || '');
  useEffect(() => {
    localStorage.setItem('magic2k_user_status_msg', userStatusMsg);
    // Sincronizar con backend
    if (userStatusMsg !== undefined) {
      updateStatusMsg(userStatusMsg).catch(() => { });
    }
  }, [userStatusMsg]);

  if (!token) {
    return null; // No mostrar nada si no hay token (el login lo maneja el modal externo)
  }

  // Sidebar MSN style
  return (
    <SocketProvider user={user} token={token}>
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
          <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, position: 'relative', background: 'rgba(255,255,255,0.7)', borderRadius: 22, boxShadow: '0 4px 24px #3a8dde22' }}>
            {/* Overlay de estrellitas tenues animadas */}
            <div style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',zIndex:2,pointerEvents:'none'}}>
              <span style={{position:'absolute',top:'12%',left:'55%',fontSize:18,color:'#fff',opacity:0.8,filter:'drop-shadow(0 0 8px #fff)',animation:'star-move1 3.2s linear infinite'}}>✦</span>
              <span style={{position:'absolute',top:'28%',right:'8%',fontSize:14,color:'#6a9cff',opacity:0.7,filter:'drop-shadow(0 0 7px #6a9cff)',animation:'star-move2 2.7s linear infinite'}}>✧</span>
              <span style={{position:'absolute',bottom:'18%',left:'18%',fontSize:13,color:'#3a8dde',opacity:0.6,filter:'drop-shadow(0 0 6px #3a8dde)',animation:'star-move3 3.5s linear infinite'}}>✦</span>
              <span style={{position:'absolute',bottom:'10%',right:'16%',fontSize:16,color:'#eaf2ff',opacity:0.7,filter:'drop-shadow(0 0 8px #eaf2ff)',animation:'star-move4 2.9s linear infinite'}}>✧</span>
            </div>
            <style>{`
              @keyframes floatRandom {
                0% { transform: translate(0, 0); }
                20% { transform: translate(-4px, -6px); }
                40% { transform: translate(6px, -2px); }
                60% { transform: translate(-3px, 7px); }
                80% { transform: translate(5px, 3px); }
                100% { transform: translate(0, 0); }
              }
              @keyframes star-move1 {0%{transform:translate(0,0);}20%{transform:translate(-6px,2px);}40%{transform:translate(4px,-4px);}60%{transform:translate(-2px,6px);}80%{transform:translate(3px,2px);}100%{transform:translate(0,0);}}
              @keyframes star-move2 {0%{transform:translate(0,0);}20%{transform:translate(5px,-3px);}40%{transform:translate(-4px,5px);}60%{transform:translate(2px,-6px);}80%{transform:translate(-3px,2px);}100%{transform:translate(0,0);}}
              @keyframes star-move3 {0%{transform:translate(0,0);}20%{transform:translate(-3px,4px);}40%{transform:translate(6px,-2px);}60%{transform:translate(-5px,3px);}80%{transform:translate(2px,-4px);}100%{transform:translate(0,0);}}
              @keyframes star-move4 {0%{transform:translate(0,0);}20%{transform:translate(4px,5px);}40%{transform:translate(-2px,-6px);}60%{transform:translate(3px,4px);}80%{transform:translate(-4px,-2px);}100%{transform:translate(0,0);}}
            `}</style>
            {/* Halo mágico difuso */}
            <div style={{position:'absolute',top:'-18%',left:'-18%',width:'136%',height:'136%',zIndex:1,pointerEvents:'none',borderRadius:'50%',background:'radial-gradient(circle,rgba(106,156,255,0.18) 0%,rgba(58,141,222,0.12) 60%,rgba(255,255,255,0) 100%)',filter:'blur(2.5px)',animation:'haloGlow 3.5s ease-in-out infinite'}}></div>
            {/* Estrellitas premium animadas */}
            <div style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',zIndex:2,pointerEvents:'none'}}>
              <span style={{position:'absolute',top:'12%',left:'55%',fontSize:18,color:'#fff',opacity:0.8,filter:'drop-shadow(0 0 8px #fff)',animation:'star-move1 3.2s linear infinite'}}>✦</span>
              <span style={{position:'absolute',top:'28%',right:'8%',fontSize:14,color:'#6a9cff',opacity:0.7,filter:'drop-shadow(0 0 7px #6a9cff)',animation:'star-move2 2.7s linear infinite'}}>✧</span>
              <span style={{position:'absolute',bottom:'18%',left:'18%',fontSize:13,color:'#3a8dde',opacity:0.6,filter:'drop-shadow(0 0 6px #3a8dde)',animation:'star-move3 3.5s linear infinite'}}>✦</span>
              <span style={{position:'absolute',bottom:'10%',right:'16%',fontSize:16,color:'#eaf2ff',opacity:0.7,filter:'drop-shadow(0 0 8px #eaf2ff)',animation:'star-move4 2.9s linear infinite'}}>✧</span>
              <span style={{position:'absolute',top:'20%',left:'22%',fontSize:10,color:'#fffbe6',opacity:0.5,filter:'drop-shadow(0 0 6px #fffbe6)',animation:'star-move5 4.1s linear infinite'}}>✦</span>
              <span style={{position:'absolute',bottom:'24%',right:'24%',fontSize:12,color:'#b0c4ff',opacity:0.5,filter:'drop-shadow(0 0 5px #b0c4ff)',animation:'star-move6 3.7s linear infinite'}}>✧</span>
            </div>
            <style>{`
              @keyframes haloGlow {
                0% { opacity: 0.7; filter: blur(2.5px) brightness(1.1); }
                50% { opacity: 1; filter: blur(4.5px) brightness(1.3); }
                100% { opacity: 0.7; filter: blur(2.5px) brightness(1.1); }
              }
              @keyframes floatRandom {
                0% { transform: translate(0, 0); }
                20% { transform: translate(-4px, -6px); }
                40% { transform: translate(6px, -2px); }
                60% { transform: translate(-3px, 7px); }
                80% { transform: translate(5px, 3px); }
                100% { transform: translate(0, 0); }
              }
              @keyframes star-move1 {0%{transform:translate(0,0);}20%{transform:translate(-6px,2px);}40%{transform:translate(4px,-4px);}60%{transform:translate(-2px,6px);}80%{transform:translate(3px,2px);}100%{transform:translate(0,0);}}
              @keyframes star-move2 {0%{transform:translate(0,0);}20%{transform:translate(5px,-3px);}40%{transform:translate(-4px,5px);}60%{transform:translate(2px,-6px);}80%{transform:translate(-3px,2px);}100%{transform:translate(0,0);}}
              @keyframes star-move3 {0%{transform:translate(0,0);}20%{transform:translate(-3px,4px);}40%{transform:translate(6px,-2px);}60%{transform:translate(-5px,3px);}80%{transform:translate(2px,-4px);}100%{transform:translate(0,0);}}
              @keyframes star-move4 {0%{transform:translate(0,0);}20%{transform:translate(4px,5px);}40%{transform:translate(-2px,-6px);}60%{transform:translate(3px,4px);}80%{transform:translate(-4px,-2px);}100%{transform:translate(0,0);}}
              @keyframes star-move5 {0%{transform:translate(0,0);}20%{transform:translate(-2px,3px);}40%{transform:translate(3px,-2px);}60%{transform:translate(-1px,4px);}80%{transform:translate(2px,1px);}100%{transform:translate(0,0);}}
              @keyframes star-move6 {0%{transform:translate(0,0);}20%{transform:translate(2px,-2px);}40%{transform:translate(-3px,3px);}60%{transform:translate(1px,-4px);}80%{transform:translate(-2px,1px);}100%{transform:translate(0,0);}}
            `}</style>
            <img src={logo} alt="Magic2k" style={{
              width: 105.8,
              height: 105.8,
              borderRadius: 27.6,
              background: '#fff',
              objectFit: 'contain',
              boxShadow: '0 2px 22px #3a8dde44',
              transition: 'box-shadow .2s',
              animation: 'floatRandom 3.2s ease-in-out infinite',
              zIndex:3,
              position:'relative'
            }} />
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
