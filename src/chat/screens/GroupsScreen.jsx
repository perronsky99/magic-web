import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FaUsers, FaPlus, FaTimes, FaCamera, FaCheck, FaComments } from "react-icons/fa";
import { getGroups, createGroup, getUsers, getGroupLastMessage, API_URL } from "../api";
import defaultAvatar from '../../assets/user.png';
import defaultGroupAvatar from '../../assets/user.png';
import "./GroupsScreen.css";

function getAvatarUrl(avatar, type = 'avatar') {
  if (!avatar || typeof avatar !== 'string' || avatar === 'null' || avatar === 'undefined') {
    return type === 'group' ? defaultGroupAvatar : defaultAvatar;
  }
  if (avatar.startsWith('http')) return avatar;
  if (avatar.startsWith('data:image')) return avatar;
  if (avatar.startsWith('/')) return `${API_URL}${avatar}`;
  if (avatar.includes('uploads')) return `${API_URL}/${avatar.replace(/^\/+/, '')}`;
  // Si la imagen es solo el nombre (sin carpeta), busca en /api/group/
  const folder = type === 'group' ? 'group' : 'avatar';
  const cleanAvatar = avatar.replace(/^(avatar|group)\/?/, '');
  return `${API_URL}/api/${folder}/${cleanAvatar}`;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Ayer';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
}

// Modal para crear grupo
function CreateGroupModal({ onClose, onCreated, currentUserId }) {
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    getUsers()
      .then(data => {
        const usersList = data.users || data || [];
        // Filtrar el usuario actual
        setUsers(usersList.filter(u => u._id !== currentUserId && u.id !== currentUserId));
      })
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false));
  }, [currentUserId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const toggleUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || selectedUsers.length === 0) return;
    
    setLoading(true);
    try {
      await createGroup({
        name: name.trim(),
        participants: selectedUsers,
        image
      });
      onCreated();
      onClose();
    } catch (err) {
      alert('Error al crear el grupo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-group-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="create-group-modal">
        <div className="create-group-header">
          <h2 className="create-group-title">Crear grupo</h2>
          <button className="create-group-close" onClick={onClose}><FaTimes /></button>
        </div>
        
        <form className="create-group-form" onSubmit={handleSubmit}>
          {/* Avatar del grupo */}
          <div className="create-group-avatar-section">
            <img 
              src={imagePreview || defaultGroupAvatar} 
              alt="Avatar del grupo" 
              className="create-group-avatar-preview"
            />
            <label className="create-group-avatar-btn">
              <FaCamera /> Cambiar imagen
              <input type="file" accept="image/*" onChange={handleImageChange} hidden />
            </label>
          </div>
          
          {/* Nombre del grupo */}
          <div>
            <label className="create-group-label">Nombre del grupo</label>
            <input
              type="text"
              className="create-group-input"
              placeholder="Ej: Amigos, Trabajo, Familia..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>
          
          {/* Selección de participantes */}
          <div>
            <label className="create-group-label">
              Participantes ({selectedUsers.length} seleccionados)
            </label>
            <div className="create-group-participants">
              {loadingUsers ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#8696a6' }}>
                  Cargando usuarios...
                </div>
              ) : users.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#8696a6' }}>
                  No hay usuarios disponibles
                </div>
              ) : (
                users.map(u => {
                  const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
                  const display = name || u.nickname || u.email || u.username || 'Usuario';
                  return (
                    <div 
                      key={u._id || u.id}
                      className={`participant-item ${selectedUsers.includes(u._id || u.id) ? 'selected' : ''}`}
                      onClick={() => toggleUser(u._id || u.id)}
                    >
                      <img 
                        src={getAvatarUrl(u.avatar)} 
                        alt={display} 
                        className="participant-avatar"
                      />
                      <span className="participant-name">
                        {display}
                        {u.nickname && name && <span style={{ color: '#8696a6' }}> ({u.nickname})</span>}
                      </span>
                      <div className="participant-check">
                        {selectedUsers.includes(u._id || u.id) && <FaCheck />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          <button 
            type="submit" 
            className="create-group-submit"
            disabled={!name.trim() || selectedUsers.length === 0 || loading}
          >
            {loading ? 'Creando...' : 'Crear grupo'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Pantalla principal de grupos
export default function GroupsScreen({ user, token, onSelectGroup, onBack, hideHeader = false }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [lastMessages, setLastMessages] = useState({});

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getGroups();
      const groupsList = data.groups || data || [];
      setGroups(groupsList);
      
      // Cargar último mensaje de cada grupo
      const lastMsgs = {};
      await Promise.all(
        groupsList.map(async (g) => {
          try {
            const lastMsgData = await getGroupLastMessage(g._id || g.id);
            lastMsgs[g._id || g.id] = lastMsgData.message || lastMsgData;
          } catch {
            // Ignorar errores de grupos sin mensajes
          }
        })
      );
      setLastMessages(lastMsgs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleGroupCreated = () => {
    loadGroups();
  };

  const currentUserId = user?._id || user?.id;

  return (
    <div className="groups-screen">
      {/* Header - hide when parent provides its own */}
      {!hideHeader && (
        <header className="groups-header">
          <div className="groups-header-title">
            <FaUsers /> Grupos
          </div>
          <div className="groups-header-actions">
            <button className="groups-create-btn" onClick={() => setShowCreateModal(true)}>
              <FaPlus /> Crear grupo
            </button>
          </div>
        </header>
      )}

      {/* Floating create button when header is hidden */}
      {hideHeader && (
        <div className="groups-floating-create">
          <button className="groups-create-btn" onClick={() => setShowCreateModal(true)}>
            <FaPlus /> Crear grupo
          </button>
        </div>
      )}

      {/* Lista de grupos */}
      <div className="groups-list">
        {loading ? (
          <div className="groups-loading">
            <div className="groups-loading-spinner" />
            <span>Cargando grupos...</span>
          </div>
        ) : error ? (
          <div className="groups-error">
            <span>{error}</span>
            <button className="groups-retry-btn" onClick={loadGroups}>Reintentar</button>
          </div>
        ) : groups.length === 0 ? (
          <div className="groups-empty">
            <FaComments className="groups-empty-icon" />
            <p className="groups-empty-text">
              Aún no tienes grupos.<br />
              ¡Crea uno para empezar a conversar!
            </p>
            <button className="groups-create-btn" onClick={() => setShowCreateModal(true)}>
              <FaPlus /> Crear mi primer grupo
            </button>
          </div>
        ) : (
          groups.map(group => {
            const groupId = group._id || group.id;
            const lastMsg = lastMessages[groupId];
            const participantCount = group.participants?.length || 0;
            
            return (
              <div 
                key={groupId}
                className="group-item"
                onClick={() => onSelectGroup(group)}
              >
                <img 
                  src={getAvatarUrl(group.image, 'group')} 
                  alt={group.name} 
                  className="group-avatar"
                  onError={e => { e.target.onerror = null; e.target.src = defaultGroupAvatar; }}
                />
                <div className="group-info">
                  <span className="group-name">{group.name}</span>
                  <span className="group-last-message">
                    {lastMsg?.message || lastMsg?.text || 'Sin mensajes aún'}
                  </span>
                </div>
                <div className="group-meta">
                  {lastMsg?.createdAt && (
                    <span className="group-time">{formatTime(lastMsg.createdAt)}</span>
                  )}
                  <span className="group-participants">
                    <FaUsers size={10} /> {participantCount}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de crear grupo */}
      {showCreateModal && (
        <CreateGroupModal 
          onClose={() => setShowCreateModal(false)}
          onCreated={handleGroupCreated}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
