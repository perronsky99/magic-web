// Archivo renombrado a ChatApp.jsx. Elimina este archivo si no es necesario.

import React, { useState } from "react";
import { loginUser } from "./api";
import ChatsScreen from "./screens/ChatsScreen";
import GroupsScreen from "./screens/GroupsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ChatScreen from "./screens/ChatScreen";
import GroupChatScreen from "./screens/GroupChatScreen";
import { FaUserFriends, FaComments, FaUserCircle } from "react-icons/fa";

export default function ChatApp() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [section, setSection] = useState("chats"); // chats | groups | profile | chat | groupchat
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const handleLogin = async e => {
    e.preventDefault();
    setError("");
    try {
      const data = await loginUser(login.email, login.password);
      setToken(data.token);
      setUser(data.user);
    } catch (e) {
      setError(e.message);
    }
  };

  if (!token) {
    return (
      <div style={{maxWidth:400, margin:"60px auto", padding:24, borderRadius:12, boxShadow:"0 2px 12px #0001", background:"#fff"}}>
        <h2 style={{fontWeight:700,letterSpacing:1}}>Iniciar sesión</h2>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={login.email} onChange={e => setLogin(l => ({...l, email: e.target.value}))} style={{width:'100%',marginBottom:12,padding:8,borderRadius:8,border:'1px solid #ddd'}} required />
          <input type="password" placeholder="Contraseña" value={login.password} onChange={e => setLogin(l => ({...l, password: e.target.value}))} style={{width:'100%',marginBottom:12,padding:8,borderRadius:8,border:'1px solid #ddd'}} required />
          <button type="submit" style={{width:'100%',padding:10,borderRadius:8,background:'#3a8dde',color:'#fff',fontWeight:600,border:'none',boxShadow:'0 1px 4px #3a8dde22'}}>Entrar</button>
        </form>
        {error && <div style={{color:'red',marginTop:8}}>{error}</div>}
      </div>
    );
  }

  // Sidebar MSN style
  return (
    <div style={{display:'flex',height:'92vh',maxWidth:1100,margin:'30px auto',borderRadius:18,boxShadow:'0 4px 32px #3a8dde22',overflow:'hidden',background:'#fafdff',border:'1.5px solid #e3eaf2'}}>
      {/* Sidebar */}
      <div style={{width:90,background:'linear-gradient(180deg,#e3eaf2 0%,#fafdff 100%)',display:'flex',flexDirection:'column',alignItems:'center',padding:'24px 0',gap:18,boxShadow:'2px 0 12px #3a8dde11',zIndex:2}}>
        <div style={{marginBottom:30}}>
          <img src="/logo.png" alt="Magic2k" style={{width:48,height:48,borderRadius:12,boxShadow:'0 2px 8px #3a8dde22'}} />
        </div>
        <button onClick={()=>setSection("chats")}
          style={{background:'none',border:'none',marginBottom:8,cursor:'pointer',outline:'none',color:section==="chats"?'#3a8dde':'#7a8ca3',fontSize:28,transition:'color .2s'}}
          title="Chats">
          <FaComments />
        </button>
        <button onClick={()=>setSection("groups")}
          style={{background:'none',border:'none',marginBottom:8,cursor:'pointer',outline:'none',color:section==="groups"?'#3a8dde':'#7a8ca3',fontSize:26,transition:'color .2s'}}
          title="Grupos">
          <FaUserFriends />
        </button>
        <button onClick={()=>setSection("profile")}
          style={{background:'none',border:'none',marginTop:'auto',cursor:'pointer',outline:'none',color:section==="profile"?'#3a8dde':'#7a8ca3',fontSize:30,transition:'color .2s'}}
          title="Mi perfil">
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" style={{width:36,height:36,borderRadius:"50%",border:section==="profile"?'2.5px solid #3a8dde':'2.5px solid #e3eaf2',objectFit:'cover',boxShadow:'0 1px 4px #3a8dde22'}} />
          ) : <FaUserCircle />}
        </button>
      </div>
      {/* Main area */}
      <div style={{flex:1,background:'#fafdff',display:'flex',flexDirection:'column',minWidth:0,position:'relative'}}>
        {section==="chats" && (
          <ChatsScreen user={user} token={token}
            onSelectChat={chat=>{setSelectedChat(chat);setSection("chat");}}
            onSelectGroup={group=>{setSelectedGroup(group);setSection("groupchat");}}
            onProfile={()=>setSection("profile")} />
        )}
        {section==="groups" && (
          <GroupsScreen user={user} token={token}
            onSelectGroup={group=>{setSelectedGroup(group);setSection("groupchat");}}
            onBack={()=>setSection("chats")} />
        )}
        {section==="profile" && (
          <ProfileScreen user={user} token={token} onBack={()=>setSection("chats")} />
        )}
        {section==="chat" && selectedChat && (
          <ChatScreen chat={selectedChat} user={user} token={token} onBack={()=>setSection("chats")} />
        )}
        {section==="groupchat" && selectedGroup && (
          <GroupChatScreen group={selectedGroup} user={user} token={token} onBack={()=>setSection("groups")} />
        )}
      </div>
    </div>
  );
}
