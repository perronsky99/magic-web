/**
 * Utilidades para procesamiento y normalización de mensajes del chat
 * Centraliza la lógica que antes estaba duplicada en múltiples lugares
 */

import { API_URL } from '../api';

/**
 * Normaliza un mensaje del backend al formato usado en el frontend
 * @param {Object} msg - Mensaje del backend
 * @returns {Object} Mensaje normalizado para el frontend
 */
export function normalizeMessage(msg) {
  if (!msg) return null;
  
  // Obtener el ID del usuario que envió el mensaje
  const senderId = typeof msg.user === 'object' && msg.user !== null
    ? (msg.user._id || msg.user.id)
    : msg.user;
  
  // Determinar el tipo de mensaje
  const type = msg.type || 'TEXT';
  
  // Base del mensaje normalizado
  const baseMsg = {
    id: msg._id,
    from: senderId,
    time: msg.createdAt 
      ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : '',
    createdAt: msg.createdAt,
  };
  
  // Retornar según tipo de mensaje
  switch (type) {
    case 'IMAGE': {
      const imgUrl = msg.message?.startsWith('http') 
        ? msg.message 
        : `${API_URL}/imagenes/${msg.message}`;
      return { ...baseMsg, image: imgUrl };
    }
    case 'AUDIO': {
      const audioUrl = msg.message?.startsWith('http') 
        ? msg.message 
        : `${API_URL}/audios/${msg.message}`;
      return { ...baseMsg, audio: audioUrl };
    }
    case 'TIC':
      return { ...baseMsg, tic: true };
    default:
      return { ...baseMsg, text: msg.message };
  }
}

/**
 * Normaliza un array de mensajes
 * @param {Array} messages - Array de mensajes del backend
 * @returns {Array} Array de mensajes normalizados
 */
export function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.map(normalizeMessage).filter(Boolean);
}

/**
 * Extrae el array de mensajes de una respuesta de la API
 * @param {Object|Array} data - Respuesta de la API
 * @returns {Array} Array de mensajes
 */
export function extractMessagesFromResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.messages)) return data.messages;
  return [];
}

/**
 * Verifica si un mensaje ya existe en el array (evita duplicados)
 * @param {Array} messages - Array de mensajes existentes
 * @param {string} messageId - ID del mensaje a verificar
 * @returns {boolean}
 */
export function messageExists(messages, messageId) {
  return messages.some(m => m.id === messageId);
}

/**
 * Agrega un mensaje al array solo si no existe, removiendo mensajes optimistas duplicados
 * @param {Array} messages - Array de mensajes existentes
 * @param {Object} newMsg - Nuevo mensaje a agregar
 * @returns {Array} Array actualizado
 */
export function addMessageIfNotExists(messages, newMsg) {
  if (!newMsg?.id || messageExists(messages, newMsg.id)) {
    return messages;
  }
  
  // Filtrar mensajes optimistas que coincidan con el nuevo mensaje
  // (mismo texto y mismo remitente, dentro de un rango de tiempo razonable)
  const filtered = messages.filter(m => {
    // Mantener si no es optimista
    if (!m.pending && !m.id?.startsWith?.('optimistic')) return true;
    
    // Si es optimista, comparar contenido para ver si es el mismo mensaje
    const sameFrom = normalizeId(m.from) === normalizeId(newMsg.from);
    const sameText = m.text && newMsg.text && m.text === newMsg.text;
    const sameImage = m.image && newMsg.image; // Las imágenes se reemplazan por la URL real
    
    // Si coincide, no lo mantenemos (será reemplazado por el real)
    if (sameFrom && (sameText || sameImage)) {
      return false;
    }
    
    return true;
  });
  
  return [...filtered, newMsg];
}

/**
 * Normaliza un ID a string para comparaciones consistentes
 * @param {string|number} id 
 * @returns {string}
 */
export function normalizeId(id) {
  return id ? String(id).trim() : '';
}

/**
 * Decodifica el JWT para obtener el user_id
 * @param {string} token 
 * @returns {string|null}
 */
export function getUserIdFromToken(token) {
  try {
    if (!token) return null;
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.user_id || decoded.id || decoded._id || decoded.sub;
  } catch (e) {
    console.error('Error decodificando token:', e);
    return null;
  }
}
