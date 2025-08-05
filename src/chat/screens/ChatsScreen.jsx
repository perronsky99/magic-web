import React, { useState, useEffect } from "react";
import { getUsers, createChat, getChats } from "../api";

// UI para lista de chats y creación de nuevo chat
export default function ChatsScreen({ user, token, onSelectChat, onSelectGroup, onProfile }) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);

  // Cargar chats reales al montar
  useEffect(() => {
    let mounted = true;
    setLoadingChats(true);
    getChats().then(data => {
      if (mounted) setChats(Array.isArray(data) ? data : []);
    }).catch(()=>{
      if (mounted) setChats([]);
    }).finally(()=>setLoadingChats(false));
    return () => { mounted = false; };
  }, []);

  // Buscar usuarios reales desde el backend
  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearch(value);
    if (value.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const users = await getUsers(value);
      // Filtrar en frontend por seguridad: nunca mostrar al usuario autenticado
      const filtered = (Array.isArray(users) ? users : []).filter(u => u._id !== user._id && u.email !== user.email);
      setResults(filtered);
    } catch (err) {
      setResults([]);
    }
    setLoading(false);
  };

  // Crear chat real
  const handleCreateChat = async (userToChat) => {
    setShowModal(false);
    setSearch("");
    setResults([]);
    try {
      const chat = await createChat(user._id, userToChat._id);
      // Si el backend responde solo con msg, buscar el chat existente
      if (chat && chat.msg && !chat._id) {
        // Buscar el chat existente entre los participantes
        const existing = chats.find(c => {
          // Puede ser participant_one o participant_two
          const ids = [c.participant_one?._id || c.participant_one, c.participant_two?._id || c.participant_two];
          return ids.includes(user._id) && ids.includes(userToChat._id);
        });
        if (existing) {
          const normalizedChat = {
            ...existing,
            _id: existing._id || existing.id,
            otherUser: (existing.participants || []).find(u => u._id !== user._id && u.email !== user.email) || existing.otherUser
          };
          console.log("[DEBUG] Chat ya existente seleccionado:", normalizedChat);
          onSelectChat(normalizedChat);
          return;
        } else {
          alert("Ya existe una conversación, pero no se pudo encontrar el chat en la lista.");
          return;
        }
      }
      // Normalizar el chat recibido del backend
      const normalizedChat = {
        ...chat,
        _id: chat._id || chat.id,
        otherUser: (chat.participants || []).find(u => u._id !== user._id && u.email !== user.email) || chat.otherUser
      };
      console.log("[DEBUG] Chat creado y seleccionado:", normalizedChat);
      onSelectChat(normalizedChat);
    } catch (err) {
      alert("No se pudo crear el chat: " + (err.message || "Error desconocido"));
    }
  };

  return (
    <div style={{position:'relative',height:'100vh',display:'flex',flexDirection:'column',background:'#fafdff'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 18px 10px 18px',borderBottom:'1.5px solid #e3eaf2',background:'#fafdff',zIndex:2}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <h2 style={{fontWeight:800,fontSize:22,color:'#7a8ca3',margin:0}}>Chats</h2>
          <span style={{fontSize:15,color:'#3a8dde',fontWeight:700,background:'#e3eaf2',borderRadius:8,padding:'4px 12px'}}>
            {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email || 'Usuario'}
          </span>
        </div>
        <button onClick={()=>setShowModal(true)} style={{background:'linear-gradient(90deg,#3a8dde 60%,#6a9cff 100%)',color:'#fff',border:'none',borderRadius:12,padding:'8px 18px',fontWeight:700,fontSize:15,boxShadow:'0 1px 8px #3a8dde22',cursor:'pointer',transition:'background .2s'}}>+ Nuevo chat</button>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'0 0 24px 0',margin:0,display:'flex',flexDirection:'column',background:'#fafdff',zIndex:1}}>
        {loadingChats ? (
          <div style={{color:'#7a8ca3',fontWeight:500,padding:'48px 0',textAlign:'center',fontSize:18,flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>Cargando chats...</div>
        ) : chats.length === 0 ? (
          <div style={{color:'#7a8ca3',fontWeight:600,padding:'48px 0',textAlign:'center',fontSize:18,flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
            <span style={{fontSize:20,display:'block',marginBottom:10}}>
              No tienes chats disponibles.
            </span>
            <span style={{fontSize:15,color:'#a0b3c6'}}>¡Crea un nuevo chat para comenzar a conversar!</span>
          </div>
        ) : (
          chats.map(chat => {
            // Buscar el otro usuario (no el logueado)
            const other = (chat.participants || []).find(u => u._id !== user._id && u.email !== user.email) || chat.otherUser;
            // Normalizar el objeto chat para asegurar que tenga _id
            const normalizedChat = {
              ...chat,
              _id: chat._id || chat.id,
              otherUser: other
            };
            return (
              <button key={normalizedChat._id} onClick={() => {
                console.log("[DEBUG] Chat seleccionado:", normalizedChat);
                onSelectChat(normalizedChat);
              }} style={{width:'96%',margin:'0 2% 10px 2%',background:'#fff',border:'1.5px solid #e3eaf2',borderRadius:12,padding:'12px 14px',display:'flex',alignItems:'center',gap:12,cursor:'pointer',transition:'background .2s',fontWeight:600,color:'#23263a',boxShadow:'0 1px 8px #3a8dde08'}}>
                <span style={{background:'#e3eaf2',borderRadius:'50%',width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,color:'#3a8dde',fontWeight:700}}>
                  {(other?.firstName && other.firstName[0]) || (other?.email && other.email[0]) || '?'}
                </span>
                <span style={{flex:1,textAlign:'left'}}>
                  {other?.firstName ? (
                    <>
                      {other.firstName} {other.lastName || ''}
                      <span style={{color:'#7a8ca3',fontWeight:400,fontSize:13,marginLeft:6}}>{other.email}</span>
                    </>
                  ) : (
                    other?.email || 'Usuario'
                  )}
                </span>
              </button>
            );
          })
        )}
      </div>
      <button onClick={onProfile} style={{margin:'18px 18px 12px 18px',background:'#fafdff',border:'1.5px solid #e3eaf2',borderRadius:10,padding:'8px 18px',color:'#3a8dde',fontWeight:700,cursor:'pointer',zIndex:2}}>Mi perfil</button>

      {/* Modal para crear chat */}
      {showModal && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',zIndex:2000,background:'rgba(20,22,34,0.45)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:18,boxShadow:'0 8px 32px #3a8dde22',padding:'32px 24px',minWidth:320,maxWidth:360,display:'flex',flexDirection:'column',alignItems:'center',position:'relative'}}>
            <button onClick={()=>setShowModal(false)} style={{position:'absolute',top:12,right:16,background:'none',border:'none',fontSize:26,color:'#3a8dde',cursor:'pointer'}}>×</button>
            <h3 style={{fontWeight:800,fontSize:20,marginBottom:18,color:'#3a8dde'}}>Nuevo chat</h3>
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Buscar usuario por nombre o email..."
              style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #e3eaf2',fontSize:15,marginBottom:14,outline:'none'}}
              autoFocus
            />
            {loading && <div style={{color:'#7a8ca3',fontWeight:500}}>Buscando...</div>}
            {!loading && results.length === 0 && search.length > 1 && <div style={{color:'#7a8ca3',fontWeight:500}}>Sin resultados</div>}
            <div style={{width:'100%',marginTop:6}}>
              {results.map(u => (
                <button key={u._id} onClick={()=>handleCreateChat(u)} style={{width:'100%',background:'#fafdff',border:'1.5px solid #e3eaf2',borderRadius:10,padding:'10px 12px',marginBottom:8,display:'flex',alignItems:'center',gap:10,cursor:'pointer',transition:'background .2s',fontWeight:600,color:'#23263a'}}>
                  <span style={{background:'#e3eaf2',borderRadius:'50%',width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,color:'#3a8dde',fontWeight:700}}>
                    {(u.firstName && u.firstName[0]) || (u.email && u.email[0]) || '?'}
                  </span>
                  <span style={{flex:1,textAlign:'left'}}>
                    {u.firstName ? (
                      <>
                        {u.firstName} {u.lastName || ''}
                        <span style={{color:'#7a8ca3',fontWeight:400,fontSize:13,marginLeft:6}}>{u.email}</span>
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
