import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaComments, FaUserFriends, FaUserCircle, FaVolumeUp, FaVolumeMute, FaSignOutAlt, FaBars, FaTimes, FaPen, FaCheck } from 'react-icons/fa';
import { API_URL, updateStatusMsg } from '../api';
import defaultAvatar from '../../assets/user.png';
import logo from '../../assets/image.png';
import './MobileHomeView.css';

const USER_STATES = [
  { key: 'online', label: 'ONLINE', color: '#3ac47d', activeColor: '#3ac47d' },
  { key: 'away', label: 'AWAY', color: '#f5a623', activeColor: '#f5a623' },
  { key: 'invisible', label: 'INVISIBLE', color: '#b0b8c9', activeColor: '#b0b8c9' },
  { key: 'busy', label: 'BUSY', color: '#e74c3c', activeColor: '#e74c3c' },
  { key: 'offline', label: 'OFF', color: '#8696a6', activeColor: '#8696a6' },
];

function getAvatarUrl(avatar) {
  if (!avatar) return defaultAvatar;
  if (avatar.startsWith('http')) return avatar;
  if (avatar.startsWith('data:image')) return avatar;
  const cleanAvatar = avatar.replace(/^avatar\//, '');
  return `${API_URL}/api/avatar/${cleanAvatar}`;
}

export default function MobileHomeView({ 
  user, 
  userState, 
  setUserState, 
  onNavigate, 
  onLogout,
  onlineCount = 0 
}) {
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem('magic2k_sound') !== 'off');
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Status message (alias) editable
  const [statusMsg, setStatusMsg] = useState(() => 
    localStorage.getItem('magic2k_user_status_msg') || user?.nickname || ''
  );
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const statusInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('magic2k_sound', soundOn ? 'on' : 'off');
  }, [soundOn]);

  // Focus en el input cuando se activa edición
  useEffect(() => {
    if (isEditingStatus && statusInputRef.current) {
      statusInputRef.current.focus();
      statusInputRef.current.select();
    }
  }, [isEditingStatus]);

  // Guardar status/alias
  const handleSaveStatus = useCallback(async () => {
    if (statusSaving) return;
    setStatusSaving(true);
    try {
      await updateStatusMsg(statusMsg.trim());
      localStorage.setItem('magic2k_user_status_msg', statusMsg.trim());
    } catch (e) {
      console.warn('Error guardando status:', e);
    } finally {
      setStatusSaving(false);
      setIsEditingStatus(false);
    }
  }, [statusMsg, statusSaving]);

  // Obtener nombre a mostrar: nombre completo > nickname > email
  const displayName = user?.firstName 
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.nickname || user?.email || 'Usuario';

  const currentState = USER_STATES.find(s => s.key === userState) || USER_STATES[0];

  return (
    <div className="mobile-home-container">
      {/* Menú desplegable (se activa desde el footer) */}
      {menuOpen && (
        <div className="mobile-dropdown-menu">
          <button onClick={() => { onNavigate('profile'); setMenuOpen(false); }}>
            <FaUserCircle /> Mi perfil
          </button>
          <button onClick={() => { setSoundOn(!soundOn); }}>
            {soundOn ? <FaVolumeUp /> : <FaVolumeMute />} Sonido: {soundOn ? 'ON' : 'OFF'}
          </button>
          <button onClick={onLogout} className="logout-btn">
            <FaSignOutAlt /> Cerrar sesión
          </button>
        </div>
      )}

      {/* Perfil del usuario */}
      <div className="mobile-profile-section">
        <div className="mobile-avatar-container" onClick={() => onNavigate('profile')}>
          {user?.avatar ? (
            <img 
              src={getAvatarUrl(user.avatar)} 
              alt="avatar" 
              className="mobile-avatar"
              onError={e => { e.target.onerror = null; e.target.src = defaultAvatar; }}
            />
          ) : (
            <div className="mobile-avatar-placeholder">
              <FaUserCircle />
            </div>
          )}
        </div>
        <div className="mobile-profile-info">
          <span className="mobile-welcome">Welcome,</span>
          <span className="mobile-username">{displayName}</span>
          
          {/* Alias/Status editable */}
          <div className="mobile-status-row">
            {isEditingStatus ? (
              <div className="mobile-status-edit">
                <input
                  ref={statusInputRef}
                  type="text"
                  className="mobile-status-input"
                  value={statusMsg}
                  onChange={e => setStatusMsg(e.target.value.slice(0, 60))}
                  placeholder="Escribe tu alias o estado..."
                  maxLength={60}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveStatus();
                    if (e.key === 'Escape') setIsEditingStatus(false);
                  }}
                  onBlur={handleSaveStatus}
                  disabled={statusSaving}
                />
                <button 
                  className="mobile-status-save" 
                  onClick={handleSaveStatus}
                  disabled={statusSaving}
                >
                  <FaCheck />
                </button>
              </div>
            ) : (
              <div 
                className="mobile-status-display"
                onClick={() => setIsEditingStatus(true)}
              >
                <span className="mobile-status-text">
                  {statusMsg || 'Escribe tu alias o estado ✨'}
                </span>
                <FaPen className="mobile-status-edit-icon" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estados del usuario (estilo MSN) */}
      <div className="mobile-states-row">
        {USER_STATES.map((state) => (
          <button
            key={state.key}
            className={`mobile-state-btn ${userState === state.key ? 'active' : ''}`}
            onClick={() => setUserState(state.key)}
            style={{
              '--state-color': state.color,
              '--state-active-color': state.activeColor,
            }}
          >
            <span 
              className="mobile-state-indicator"
              style={{ 
                background: state.color,
                borderColor: userState === state.key ? state.activeColor : 'transparent'
              }}
            />
            <span className="mobile-state-label">{state.label}</span>
          </button>
        ))}
      </div>

      {/* Opciones principales */}
      <div className="mobile-options-list">
        {/* Soporte online (opcional) */}
        <button className="mobile-option-item support-item">
          <div className="mobile-option-icon support-icon">
            <span className="support-bot">🤖</span>
          </div>
          <div className="mobile-option-text">
            <span className="mobile-option-title">WE ARE ONLINE NOW :)</span>
            <span className="mobile-option-subtitle">Click here for live support</span>
          </div>
        </button>

        {/* Chat */}
        <button 
          className="mobile-option-item"
          onClick={() => onNavigate('chats')}
        >
          <div className="mobile-option-icon">
            <FaComments />
          </div>
          <div className="mobile-option-text">
            <span className="mobile-option-title">CHAT!</span>
            <span className="mobile-option-subtitle">
              <span className="user-icon">👤</span> {onlineCount} Online Now
            </span>
          </div>
        </button>

        {/* Grupos */}
        <button 
          className="mobile-option-item"
          onClick={() => onNavigate('groups')}
        >
          <div className="mobile-option-icon">
            <FaUserFriends />
          </div>
          <div className="mobile-option-text">
            <span className="mobile-option-title">GROUPS</span>
            <span className="mobile-option-subtitle">Join group conversations</span>
          </div>
        </button>

        {/* Sonido */}
        <button 
          className="mobile-option-item"
          onClick={() => setSoundOn(!soundOn)}
        >
          <div className="mobile-option-icon">
            {soundOn ? <FaVolumeUp /> : <FaVolumeMute />}
          </div>
          <div className="mobile-option-text">
            <span className="mobile-option-title">SOUND: {soundOn ? 'ON' : 'OFF'}</span>
            <span className="mobile-option-subtitle">Toggle notification sounds</span>
          </div>
        </button>
      </div>

      {/* Footer flotante (soporte) */}
      <div className="mobile-footer-bar">
        <div className="mobile-footer-content">
          <span className="footer-bot">🤖</span>
          <div className="footer-text">
            <span className="footer-title">WE ARE ONLINE NOW :)</span>
            <span className="footer-subtitle">Click here for live support</span>
          </div>
        </div>
        <button className="footer-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
          <FaBars />
          <span>MENU</span>
        </button>
      </div>
    </div>
  );
}
