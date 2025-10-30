import React, { useRef, useState, useEffect } from "react";
import { FaPaperPlane, FaMicrophone, FaImage, FaBolt } from "react-icons/fa";

export default function ChatMessageInput({ onSend, onSendImage, onSendAudio, onSendTic, loading, onTyping }) {
  const [input, setInput] = useState("");
  const fileInputRef = useRef();
  const inputRef = useRef();
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef();
  const audioChunksRef = useRef([]);

  // Enviar texto
  const handleSend = e => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput("");
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 80);
    }
  };

  // Enfocar input al montar el componente
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  // Siempre enfoca el input cuando se limpia tras enviar
  useEffect(() => {
    if (input === "" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [input]);

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
    <form
      onSubmit={handleSend}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '16px 22px',
        borderTop: '1.5px solid #e3eaf2',
        background: 'rgba(255,255,255,0.92)',
        boxShadow: '0 -2px 16px #3a8dde0a',
        borderRadius: '0 0 18px 18px',
        position: 'relative',
        zIndex: 2,
        minHeight: 64,
      }}
      aria-label="Enviar mensaje"
    >
      <button
        type="button"
        onClick={handleTic}
        title="Enviar TIC"
        aria-label="Enviar TIC"
        style={{
          background: 'none',
          border: 'none',
          fontSize: 24,
          color: '#f7b731',
          cursor: 'pointer',
          marginRight: 2,
          borderRadius: 10,
          transition: 'background .15s',
          padding: 6,
        }}
        tabIndex={0}
      >
        <FaBolt />
      </button>
      <button
        type="button"
        onClick={() => fileInputRef.current.click()}
        title="Enviar imagen"
        aria-label="Enviar imagen"
        style={{
          background: 'none',
          border: 'none',
          fontSize: 24,
          color: '#3a8dde',
          cursor: 'pointer',
          borderRadius: 10,
          transition: 'background .15s',
          padding: 6,
        }}
        tabIndex={0}
      >
        <FaImage />
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImage}
          style={{ display: 'none' }}
        />
      </button>
      <button
        type="button"
        onClick={handleRecord}
        title={recording ? "Detener grabación" : "Grabar nota de voz"}
        aria-label={recording ? "Detener grabación" : "Grabar nota de voz"}
        style={{
          background: recording ? 'linear-gradient(90deg,#3a8dde 60%,#6a9cff 100%)' : 'none',
          border: 'none',
          fontSize: 24,
          color: recording ? '#fff' : '#3a8dde',
          cursor: 'pointer',
          transition: 'background .2s',
          borderRadius: 10,
          padding: recording ? '6px 12px' : '6px',
          boxShadow: recording ? '0 2px 8px #3a8dde22' : 'none',
        }}
        tabIndex={0}
      >
        <FaMicrophone />
      </button>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={e => {
          setInput(e.target.value);
          if (onTyping) onTyping();
        }}
        placeholder="Escribe un mensaje..."
        style={{
          flex: 1,
          padding: '14px 18px',
          borderRadius: 16,
          border: '1.5px solid #e3eaf2',
          fontSize: 17,
          outline: 'none',
          background: '#fafdff',
          color: '#23263a',
          fontWeight: 500,
          boxShadow: '0 1px 6px #3a8dde11',
          transition: 'border .2s',
        }}
        disabled={loading}
        aria-label="Escribe un mensaje"
      />
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '12px 26px',
          borderRadius: 14,
          background: 'linear-gradient(90deg,#3a8dde 60%,#6a9cff 100%)',
          color: '#fff',
          fontWeight: 700,
          border: 'none',
          fontSize: 18,
          boxShadow: '0 1px 8px #3a8dde22',
          letterSpacing: 1,
          transition: 'background .2s',
          cursor: 'pointer',
          opacity: loading ? 0.6 : 1,
          marginLeft: 2,
        }}
        aria-label="Enviar mensaje"
        tabIndex={0}
      >
        <FaPaperPlane />
      </button>
    </form>
  );
}
