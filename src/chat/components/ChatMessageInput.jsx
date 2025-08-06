import React, { useRef, useState } from "react";
import { FaPaperPlane, FaMicrophone, FaImage, FaBolt } from "react-icons/fa";

export default function ChatMessageInput({ onSend, onSendImage, onSendAudio, onSendTic, loading, onTyping }) {
  const [input, setInput] = useState("");
  const fileInputRef = useRef();
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef();
  const audioChunksRef = useRef([]);

  // Enviar texto
  const handleSend = e => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };

  // Enviar imagen
  const handleImage = e => {
    const file = e.target.files[0];
    if (file) onSendImage(file);
    fileInputRef.current.value = "";
  };

  // Grabar audio
  const handleRecord = async () => {
    if (recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) return alert("No se puede grabar audio en este navegador.");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new window.MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];
    mediaRecorder.ondataavailable = e => audioChunksRef.current.push(e.data);
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      onSendAudio(audioBlob);
    };
    mediaRecorder.start();
    setRecording(true);
  };

  // Enviar TICS
  const handleTic = () => {
    onSendTic();
  };

  return (
    <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderTop: '1.5px solid #e3eaf2', background: 'rgba(255,255,255,0.97)', boxShadow: '0 -2px 12px #3a8dde0a' }}>
      <button type="button" onClick={handleTic} title="Enviar TIC" style={{ background: 'none', border: 'none', fontSize: 22, color: '#f7b731', cursor: 'pointer', marginRight: 2 }}>
        <FaBolt />
      </button>
      <button type="button" onClick={() => fileInputRef.current.click()} title="Enviar imagen" style={{ background: 'none', border: 'none', fontSize: 22, color: '#3a8dde', cursor: 'pointer' }}>
        <FaImage />
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImage} style={{ display: 'none' }} />
      </button>
      <button type="button" onClick={handleRecord} title={recording ? "Detener grabación" : "Grabar nota de voz"} style={{ background: recording ? '#3a8dde' : 'none', border: 'none', fontSize: 22, color: recording ? '#fff' : '#3a8dde', cursor: 'pointer', transition: 'background .2s', borderRadius: 8, padding: recording ? '4px 8px' : '0' }}>
        <FaMicrophone />
      </button>
      <input
        type="text"
        value={input}
        onChange={e => {
          setInput(e.target.value);
          if (onTyping) onTyping();
        }}
        placeholder="Escribe un mensaje..."
        style={{ flex: 1, padding: '12px 16px', borderRadius: 14, border: '1.5px solid #e3eaf2', fontSize: 16, outline: 'none', background: '#fafdff', color: '#23263a', fontWeight: 500, boxShadow: '0 1px 4px #3a8dde11', transition: 'border .2s' }}
        disabled={loading}
      />
      <button type="submit" disabled={loading} style={{ padding: '10px 22px', borderRadius: 12, background: 'linear-gradient(90deg,#3a8dde 60%,#6a9cff 100%)', color: '#fff', fontWeight: 700, border: 'none', fontSize: 16, boxShadow: '0 1px 8px #3a8dde22', letterSpacing: 1, transition: 'background .2s', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
        <FaPaperPlane />
      </button>
    </form>
  );
}
