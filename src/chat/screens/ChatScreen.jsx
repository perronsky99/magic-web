import React, { useRef, useEffect, useState } from "react";
import ChatMessageInput from "../components/ChatMessageInput";
import ticSound from "../../assets/tic.mp3";

// UI de chat profesional y minimalista
export default function ChatScreen({ chat, user, token, onBack }) {
  // Simulación de mensajes (reemplazar por fetch real)
  const [messages, setMessages] = useState([
    { id: 1, from: user?._id, text: "¡Hola!", time: "10:00" },
    { id: 2, from: chat?.otherUser?._id, text: "¡Hola! ¿Cómo estás?", time: "10:01" },
    { id: 3, from: user?._id, text: "Todo bien, ¿y vos?", time: "10:02" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const ticAudioRef = useRef();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  // Enviar texto
  const handleSend = (text) => {
    setMessages(msgs => ([...msgs, { id: Date.now(), from: user?._id, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]));
  };

  // Enviar imagen
  const handleSendImage = (file) => {
    const url = URL.createObjectURL(file);
    setMessages(msgs => ([...msgs, { id: Date.now(), from: user?._id, image: url, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]));
  };

  // Enviar audio
  const handleSendAudio = (audioBlob) => {
    const url = URL.createObjectURL(audioBlob);
    setMessages(msgs => ([...msgs, { id: Date.now(), from: user?._id, audio: url, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]));
  };

  // Enviar TIC (zumbido)
  const handleSendTic = () => {
    setMessages(msgs => ([...msgs, { id: Date.now(), from: user?._id, tic: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]));
    ticAudioRef.current?.play();
    // Efecto de vibración visual
    const chatArea = document.getElementById('chat-area');
    if (chatArea) {
      chatArea.classList.add('tic-vibrate');
      setTimeout(()=>chatArea.classList.remove('tic-vibrate'), 600);
    }
  };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:'transparent',minHeight:0}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:14,padding:'18px 24px 14px 18px',borderBottom:'1.5px solid #e3eaf2',background:'rgba(255,255,255,0.92)',boxShadow:'0 2px 12px #3a8dde0a',zIndex:2}}>
        <button onClick={onBack} style={{background:'none',border:'none',fontSize:26,color:'#3a8dde',cursor:'pointer',marginRight:6,marginLeft:-4}} title="Volver">←</button>
        {chat?.otherUser?.avatar ? (
          <img src={chat.otherUser.avatar} alt="avatar" style={{width:38,height:38,borderRadius:'50%',objectFit:'cover',boxShadow:'0 1px 4px #3a8dde22'}} />
        ) : (
          <div style={{width:38,height:38,borderRadius:'50%',background:'#e3eaf2',display:'flex',alignItems:'center',justifyContent:'center',color:'#3a8dde',fontWeight:700,fontSize:20}}>👤</div>
        )}
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:800,fontSize:18,color:'#23263a',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
            {chat?.otherUser?.firstName ? (
              <>
                {chat.otherUser.firstName} {chat.otherUser.lastName || ''}
                <span style={{color:'#7a8ca3',fontWeight:400,fontSize:13,marginLeft:8}}>{chat.otherUser.email}</span>
              </>
            ) : (
              chat?.otherUser?.email || "Usuario"
            )}
          </div>
          <div style={{fontSize:13,color:'#7a8ca3',fontWeight:500}}>
            En línea
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div id="chat-area" style={{flex:1,overflowY:'auto',padding:'28px 0 18px 0',background:'linear-gradient(120deg,#fafdff 60%,#e3eaf2 100%)',display:'flex',flexDirection:'column',gap:10,transition:'box-shadow .2s'}}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display:'flex',justifyContent:msg.from===user?._id?'flex-end':'flex-start',padding:'0 22px',
          }}>
            {/* Mensaje de texto */}
            {msg.text && (
              <div style={{
                background:msg.from===user?._id?'linear-gradient(90deg,#3a8dde 60%,#6a9cff 100%)':'#e3eaf2',
                color:msg.from===user?._id?'#fff':'#23263a',
                borderRadius:18,
                borderBottomRightRadius:msg.from===user?._id?4:18,
                borderBottomLeftRadius:msg.from===user?._id?18:4,
                padding:'10px 16px',
                fontSize:16,
                fontWeight:500,
                boxShadow:'0 2px 8px #3a8dde11',
                maxWidth:340,
                minWidth:36,
                wordBreak:'break-word',
                position:'relative',
                marginBottom:2,
                marginLeft:msg.from===user?._id?24:0,
                marginRight:msg.from===user?._id?0:24,
                transition:'background .2s',
              }}>
                {msg.text}
                <span style={{fontSize:11,color:msg.from===user?._id?'#eaf2ffb0':'#7a8ca3',marginLeft:8,marginRight:-4,position:'absolute',bottom:4,right:10}}>{msg.time}</span>
              </div>
            )}
            {/* Imagen */}
            {msg.image && (
              <div style={{background:'#fff',border:'1.5px solid #e3eaf2',borderRadius:16,padding:4,boxShadow:'0 2px 8px #3a8dde11',maxWidth:220}}>
                <img src={msg.image} alt="img" style={{maxWidth:200,maxHeight:180,borderRadius:12,objectFit:'cover',display:'block'}} />
                <span style={{fontSize:11,color:'#7a8ca3',marginLeft:8}}>{msg.time}</span>
              </div>
            )}
            {/* Audio */}
            {msg.audio && (
              <div style={{background:'#fff',border:'1.5px solid #e3eaf2',borderRadius:16,padding:'8px 12px',boxShadow:'0 2px 8px #3a8dde11',display:'flex',alignItems:'center',gap:8,maxWidth:220}}>
                <audio src={msg.audio} controls style={{width:160}} />
                <span style={{fontSize:11,color:'#7a8ca3'}}>{msg.time}</span>
              </div>
            )}
            {/* TIC (zumbido) */}
            {msg.tic && (
              <div style={{background:'#f7b731',color:'#fff',borderRadius:18,padding:'10px 18px',fontWeight:700,boxShadow:'0 2px 8px #f7b73133',fontSize:16,letterSpacing:1,animation:'ticShake .6s',display:'flex',alignItems:'center',gap:8}}>
                <span role="img" aria-label="tic">⚡</span> ¡TIC enviado!
                <span style={{fontSize:11,color:'#fff',marginLeft:8}}>{msg.time}</span>
              </div>
            )}
          </div>
        ))}
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
        `}</style>
      </div>

      {/* Input mejorado */}
      <ChatMessageInput
        onSend={handleSend}
        onSendImage={handleSendImage}
        onSendAudio={handleSendAudio}
        onSendTic={handleSendTic}
        loading={loading}
      />
    </div>
  );
}
