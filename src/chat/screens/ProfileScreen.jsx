import React, { useRef, useState } from "react";
import defaultAvatar from '../../assets/user.png';

export default function ProfileScreen({ user, token, onBack }) {
  const [preview, setPreview] = useState(user?.avatar || "");
  const fileInputRef = useRef();
  const [pseudo, setPseudo] = useState(user?.pseudo || "");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', background: '#fff', borderRadius: 18, boxShadow: '0 8px 32px #3a8dde22', padding: '36px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <button onClick={onBack} style={{ position: 'absolute', top: 18, left: 18, background: 'none', border: 'none', fontSize: 26, color: '#3a8dde', cursor: 'pointer' }} title="Volver">←</button>
      <div style={{ position: 'relative', marginBottom: 18 }}>
        <img
          src={preview || defaultAvatar}
          alt="avatar"
          style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 2px 16px #3a8dde22', border: '3px solid #e3eaf2', background: '#fafdff' }}
        />
        <button
          onClick={() => fileInputRef.current.click()}
          style={{ position: 'absolute', bottom: 8, right: 8, background: '#3a8dde', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, boxShadow: '0 2px 8px #3a8dde33', cursor: 'pointer', transition: 'background .2s' }}
          title="Cambiar imagen"
        >
          <span role="img" aria-label="cámara">📷</span>
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
      <div style={{ fontWeight: 800, fontSize: 22, color: '#23263a', marginBottom: 6 }}>{user?.firstName || user?.email || 'Usuario'}</div>
      <div style={{ color: '#7a8ca3', fontWeight: 500, fontSize: 15, marginBottom: 18 }}>{user?.email}</div>
      <div style={{ width: '100%', marginBottom: 18 }}>
        <label style={{ color: '#7a8ca3', fontWeight: 600, fontSize: 14, marginBottom: 4, display: 'block' }}>Pseudo / Frase</label>
        <input
          type="text"
          value={pseudo}
          onChange={e => setPseudo(e.target.value.slice(0, 50))}
          maxLength={50}
          placeholder="Agrega un pseudo, frase o emoji ✨"
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e3eaf2', fontSize: 16, outline: 'none', background: '#fafdff', color: '#23263a', fontWeight: 500, boxShadow: '0 1px 4px #3a8dde11', transition: 'border .2s' }}
        />
      </div>
      <button style={{ padding: '12px 32px', borderRadius: 12, background: 'linear-gradient(90deg,#3a8dde 60%,#6a9cff 100%)', color: '#fff', fontWeight: 700, border: 'none', fontSize: 17, boxShadow: '0 1px 8px #3a8dde22', letterSpacing: 1, transition: 'background .2s', cursor: 'pointer', marginTop: 8 }} disabled>
        Guardar cambios (demo)
      </button>
    </div>
  );
}
