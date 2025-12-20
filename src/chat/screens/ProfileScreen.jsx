import React, { useRef, useState } from "react";
import defaultAvatar from '../../assets/user.png';
import { updateUserProfile, API_URL } from '../api';

export default function ProfileScreen({ user, token, onBack, onUserUpdate }) {
  const [preview, setPreview] = useState(user?.avatar || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef();
  const [pseudo, setPseudo] = useState(user?.pseudo || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileChange = (e) => {
    setError("");
    setSuccess("");
    const file = e.target.files[0];
    if (file) {
      // Validación de tipo y tamaño (máx 2MB)
      if (!file.type.startsWith("image/")) {
        setError("El archivo debe ser una imagen.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError("La imagen no debe superar los 2MB.");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      // Permitir guardar solo pseudo si no hay imagen nueva
      const dataToSend = {
        firstName: user.firstName,
        lastName: user.lastName,
        nickname: user.nickname,
        pseudo,
      };
      if (avatarFile) dataToSend.avatar = avatarFile;
      const updated = await updateUserProfile(dataToSend);
      setSuccess("¡Perfil actualizado!");
      setAvatarFile(null);
      setPreview(updated.avatar || "");
      if (onUserUpdate) onUserUpdate(updated);
    } catch (err) {
      setError(err.message || 'Error al guardar');
    }
    setSaving(false);
  };

  function getAvatarUrl(avatar) {
    if (!avatar) return defaultAvatar;
    if (avatar.startsWith('http')) return avatar;
    if (avatar.startsWith('data:image')) return avatar; // base64
    // Si avatar ya incluye 'avatar/', no lo dupliques
    const cleanAvatar = avatar.replace(/^avatar\//, '');
    return `${API_URL}/api/avatar/${cleanAvatar}`;
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', background: '#fff', borderRadius: 18, boxShadow: '0 8px 32px #3a8dde22', padding: '36px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <button onClick={onBack} style={{ position: 'absolute', top: 18, left: 18, background: 'none', border: 'none', fontSize: 26, color: '#3a8dde', cursor: 'pointer' }} title="Volver">←</button>
      <div style={{ position: 'relative', marginBottom: 18 }}>
        <img
          src={getAvatarUrl(preview || user?.avatar)}
          alt="avatar"
          style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 2px 16px #3a8dde22', border: '3px solid #e3eaf2', background: '#fafdff' }}
        />
        <button
          onClick={() => fileInputRef.current.click()}
          style={{ position: 'absolute', bottom: 8, right: 8, background: '#3a8dde', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, boxShadow: '0 2px 8px #3a8dde33', cursor: 'pointer', transition: 'background .2s' }}
          title="Cambiar imagen"
          aria-label="Cambiar imagen de perfil"
        >
          <span role="img" aria-label="cámara">📷</span>
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          aria-label="Seleccionar imagen de perfil"
        />
      </div>
      <div style={{ fontWeight: 800, fontSize: 22, color: '#23263a', marginBottom: 6 }}>{user?.firstName || user?.email || 'Usuario'}</div>
      <div style={{ color: '#7a8ca3', fontWeight: 500, fontSize: 15, marginBottom: 18 }}>{user?.email}</div>
      <div style={{ width: '100%', marginBottom: 18 }}>
        <label style={{ color: '#7a8ca3', fontWeight: 600, fontSize: 14, marginBottom: 4, display: 'block' }}>Pseudo / Frase</label>
        <input
          type="text"
          value={pseudo}
          onChange={e => { setPseudo(e.target.value.slice(0, 50)); setError(""); setSuccess(""); }}
          maxLength={50}
          placeholder="Agrega un pseudo, frase o emoji ✨"
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e3eaf2', fontSize: 16, outline: 'none', background: '#fafdff', color: '#23263a', fontWeight: 500, boxShadow: '0 1px 4px #3a8dde11', transition: 'border .2s' }}
          aria-label="Pseudo o frase"
        />
      </div>
      <button style={{ padding: '12px 32px', borderRadius: 12, background: 'linear-gradient(90deg,#3a8dde 60%,#6a9cff 100%)', color: '#fff', fontWeight: 700, border: 'none', fontSize: 17, boxShadow: '0 1px 8px #3a8dde22', letterSpacing: 1, transition: 'background .2s', cursor: saving ? 'not-allowed' : 'pointer', marginTop: 8, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving} aria-busy={saving} aria-label="Guardar cambios de perfil">
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
      {error && <div style={{ color: '#ff4d4f', marginTop: 10, fontWeight: 600, fontSize: 14 }}>{error}</div>}
      {success && <div style={{ color: '#3ac47d', marginTop: 10, fontWeight: 600, fontSize: 14 }}>{success}</div>}
    </div>
  );
}
