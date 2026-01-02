import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaCommentDots, FaUsers, FaCog, FaSignOutAlt, FaPen, FaCheck, FaBell, FaBellSlash, FaChevronRight } from 'react-icons/fa';
import { API_URL, updateStatusMsg } from '../api';
import defaultAvatar from '../../assets/user.png';
import './MobileHomeView.css';

// Estados simplificados y modernos
const USER_STATES = [
  { key: 'online', label: 'Disponible', color: '#10b981', emoji: '🟢' },
  { key: 'away', label: 'Ausente', color: '#f59e0b', emoji: '🌙' },
  { key: 'busy', label: 'Ocupado', color: '#ef4444', emoji: '⛔' },
  { key: 'invisible', label: 'Invisible', color: '#6b7280', emoji: '👻' },
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
  const [showStateSelector, setShowStateSelector] = useState(false);
  
  // Status message editable
  const [statusMsg, setStatusMsg] = useState(() => 
    localStorage.getItem('magic2k_user_status_msg') || user?.nickname || ''
  );
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const statusInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('magic2k_sound', soundOn ? 'on' : 'off');
  }, [soundOn]);

  useEffect(() => {
    if (isEditingStatus && statusInputRef.current) {
      statusInputRef.current.focus();
      statusInputRef.current.select();
    }
  }, [isEditingStatus]);

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

  const displayName = user?.firstName 
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.nickname || user?.email || 'Usuario';

  const currentState = USER_STATES.find(s => s.key === userState) || USER_STATES[0];

  return (
    <div className="m2k-home">
      {/* Hero Section con perfil */}
      <div className="m2k-hero">
        <div className="m2k-hero-bg" />
        
        <div className="m2k-profile-card">
          <div className="m2k-avatar-wrap" onClick={() => onNavigate('profile')}>
            <img 
              src={user?.avatar ? getAvatarUrl(user.avatar) : defaultAvatar}
              alt="avatar" 
              className="m2k-avatar"
              onError={e => { e.target.onerror = null; e.target.src = defaultAvatar; }}
            />
            <span 
              className="m2k-status-dot"
              style={{ background: currentState.color }}
              onClick={(e) => { e.stopPropagation(); setShowStateSelector(!showStateSelector); }}
            />
          </div>
          
          <div className="m2k-user-info">
            <h1 className="m2k-username">{displayName}</h1>
            
            {/* Status editable */}
            {isEditingStatus ? (
              <div className="m2k-status-edit">
                <input
                  ref={statusInputRef}
                  type="text"
                  className="m2k-status-input"
                  value={statusMsg}
                  onChange={e => setStatusMsg(e.target.value.slice(0, 60))}
                  placeholder="¿Qué estás pensando?"
                  maxLength={60}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveStatus();
                    if (e.key === 'Escape') setIsEditingStatus(false);
                  }}
                  onBlur={handleSaveStatus}
                  disabled={statusSaving}
                />
                <button className="m2k-status-save" onClick={handleSaveStatus} disabled={statusSaving}>
                  <FaCheck />
                </button>
              </div>
            ) : (
              <p className="m2k-status" onClick={() => setIsEditingStatus(true)}>
                {statusMsg || '¿Qué estás pensando?'}
                <FaPen className="m2k-edit-hint" />
              </p>
            )}
          </div>

          {/* Selector de estado - modal pequeño */}
          {showStateSelector && (
            <div className="m2k-state-selector">
              {USER_STATES.map(state => (
                <button
                  key={state.key}
                  className={`m2k-state-option ${userState === state.key ? 'active' : ''}`}
                  onClick={() => { setUserState(state.key); setShowStateSelector(false); }}
                >
                  <span className="m2k-state-emoji">{state.emoji}</span>
                  <span className="m2k-state-label">{state.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats rápidos */}
      <div className="m2k-stats">
        <div className="m2k-stat">
          <span className="m2k-stat-value">{onlineCount}</span>
          <span className="m2k-stat-label">en línea</span>
        </div>
        <div className="m2k-stat-divider" />
        <div className="m2k-stat clickable" onClick={() => setShowStateSelector(!showStateSelector)}>
          <span className="m2k-stat-emoji">{currentState.emoji}</span>
          <span className="m2k-stat-label">{currentState.label}</span>
        </div>
      </div>

      {/* Acciones principales */}
      <div className="m2k-actions">
        <button className="m2k-action-card primary" onClick={() => onNavigate('chats')}>
          <div className="m2k-action-icon">
            <FaCommentDots />
          </div>
          <div className="m2k-action-content">
            <span className="m2k-action-title">Mensajes</span>
            <span className="m2k-action-desc">Chatea con tus contactos</span>
          </div>
          <FaChevronRight className="m2k-action-arrow" />
        </button>

        <button className="m2k-action-card" onClick={() => onNavigate('groups')}>
          <div className="m2k-action-icon">
            <FaUsers />
          </div>
          <div className="m2k-action-content">
            <span className="m2k-action-title">Grupos</span>
            <span className="m2k-action-desc">Conversaciones grupales</span>
          </div>
          <FaChevronRight className="m2k-action-arrow" />
        </button>
      </div>

      {/* Configuración rápida */}
      <div className="m2k-quick-settings">
        <button 
          className={`m2k-setting-pill ${soundOn ? 'active' : ''}`}
          onClick={() => setSoundOn(!soundOn)}
        >
          {soundOn ? <FaBell /> : <FaBellSlash />}
          <span>Sonidos {soundOn ? 'ON' : 'OFF'}</span>
        </button>
        
        <button className="m2k-setting-pill" onClick={() => onNavigate('profile')}>
          <FaCog />
          <span>Perfil</span>
        </button>
      </div>

      {/* Footer minimalista */}
      <div className="m2k-footer">
        <button className="m2k-logout" onClick={onLogout}>
          <FaSignOutAlt />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}
