// Guardar y obtener tokens en localStorage
export function saveTokens({ token, refresh }) {
  localStorage.setItem('access_token', token);
  if (refresh) localStorage.setItem('refresh_token', refresh);
}

export function getAccessToken() {
  return localStorage.getItem('access_token');
}

export function getRefreshToken() {
  return localStorage.getItem('refresh_token');
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

// Refresca el access token usando el refresh token
export async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error('No hay refresh token');
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh })
  });
  if (!res.ok) throw new Error('No se pudo refrescar el token');
  const data = await res.json();
  if (data.token) {
    saveTokens({ token: data.token });
    return data.token;
  }
  throw new Error('Respuesta inválida al refrescar token');
}

// Fetch centralizado con manejo de refresh automático
export async function fetchWithAuth(url, options = {}) {
  let token = getAccessToken();
  if (token && !token.startsWith('Bearer ')) token = 'Bearer ' + token;
  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: token }
    });
  } catch (e) {
    throw new Error('No se pudo conectar con el servidor. Intenta más tarde.');
  }
  if (res.status === 401) {
    // Intentar refrescar
    try {
      let newToken = await refreshAccessToken();
      if (newToken && !newToken.startsWith('Bearer ')) newToken = 'Bearer ' + newToken;
      try {
        res = await fetch(url, {
          ...options,
          headers: { ...(options.headers || {}), Authorization: newToken }
        });
      } catch (e) {
        throw new Error('No se pudo conectar con el servidor. Intenta más tarde.');
      }
    } catch (e) {
      clearTokens();
      throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
    }
  }
  // Si hay error, intenta mostrar el mensaje real del backend
  if (!res.ok) {
    let msg = 'Error desconocido';
    try {
      const data = await res.clone().json();
      msg = data.msg || msg;
    } catch {}
    // Errores 500 y caídas del backend
    if (res.status >= 500) {
      msg = 'El servidor no responde correctamente. Intenta más tarde.';
    }
    throw new Error(msg);
  }
  return res;
}
// Obtener todos los usuarios excepto el autenticado
// Obtener todos los usuarios excepto el autenticado, con búsqueda opcional
export async function getUsers(search = "") {
  let url = `${API_URL}/api/user`;
  if (search && search.trim() !== "") {
    url += `?q=${encodeURIComponent(search)}`;
  }
  const res = await fetchWithAuth(url, {
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('No se pudieron obtener los usuarios');
  return res.json();
}

// Crear un chat entre dos usuarios
export async function createChat(participant_id_one, participant_id_two) {
  const res = await fetchWithAuth(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ participant_id_one, participant_id_two })
  });
  if (!res.ok) throw new Error('No se pudo crear el chat');
  return res.json();
}
// Configuración de la API para la web de Magic2k
export const API_URL = "https://magic2k.com";

export async function loginUser(email, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Login incorrecto');
  return res.json();
}

export async function getChats() {
  const res = await fetchWithAuth(`${API_URL}/api/chat`);
  if (!res.ok) throw new Error('No se pudieron obtener los chats');
  return res.json();
}

export async function getChatMessages(chatId) {
  const res = await fetchWithAuth(`${API_URL}/api/chat/message/${chatId}`);
  if (!res.ok) throw new Error('No se pudieron obtener los mensajes');
  return res.json();
}

export async function sendMessage(chatId, text) {
  const res = await fetchWithAuth(`${API_URL}/api/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message: text })
  });
  if (!res.ok) throw new Error('No se pudo enviar el mensaje');
  return res.json();
}

// Enviar imagen en chat individual
export async function sendImage(chatId, file) {
  console.log('[sendImage] Iniciando envío de imagen:', { chatId, fileName: file?.name, fileType: file?.type, fileSize: file?.size });
  
  if (!chatId) {
    throw new Error('chat_id es requerido');
  }
  if (!file) {
    throw new Error('El archivo de imagen es requerido');
  }
  
  const formData = new FormData();
  formData.append('chat_id', chatId);
  // Asegurar que el archivo tenga un nombre válido
  const fileName = file.name || 'image.jpg';
  formData.append('image', file, fileName);
  
  console.log('[sendImage] FormData preparado, enviando a:', `${API_URL}/api/chat/message/image`);
  
  // Para FormData, NO debemos establecer Content-Type manualmente
  // El navegador lo establecerá automáticamente con el boundary correcto
  // fetchWithAuth maneja los errores y el token automáticamente
  const res = await fetchWithAuth(`${API_URL}/api/chat/message/image`, {
    method: 'POST',
    body: formData
  });
  
  const data = await res.json();
  console.log('[sendImage] Respuesta recibida:', data);
  return data;
}

// Enviar audio en chat individual
export async function sendAudio(chatId, file) {
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('audio', file);
  const res = await fetchWithAuth(`${API_URL}/api/chat/message/audio`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('No se pudo enviar el audio');
  return res.json();
}

export async function updateUserProfile({ firstName, lastName, nickname, pseudo, avatar }) {
  const formData = new FormData();
  if (firstName) formData.append('firstName', firstName);
  if (lastName) formData.append('lastName', lastName);
  if (nickname) formData.append('nickname', nickname);
  if (pseudo) formData.append('pseudo', pseudo);
  if (avatar && typeof avatar !== 'string') formData.append('avatar', avatar); // El campo debe llamarse 'avatar'

  const res = await fetchWithAuth(`${API_URL}/api/user/me`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('No se pudo actualizar el perfil');
  return res.json();
}

export async function markChatAsRead(chatId) {
  const res = await fetchWithAuth(`${API_URL}/api/chat/message/read/${chatId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('No se pudo marcar como leído');
  return res.json();
}

export async function updateStatusMsg(statusMsg) {
  const res = await fetchWithAuth(`${API_URL}/api/user/status-msg`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ statusMsg })
  });
  if (!res.ok) throw new Error('No se pudo actualizar el mensaje de estado');
  return res.json();
}

export async function getStatusMsg(userId) {
  const res = await fetchWithAuth(`${API_URL}/api/user/status-msg/${userId}`);
  if (!res.ok) throw new Error('No se pudo obtener el mensaje de estado');
  return res.json();
}

// =============================================
// ======= GRUPOS (GROUP) =====================
// =============================================

// Crear un grupo
export async function createGroup({ name, participants, image }) {
  const formData = new FormData();
  formData.append('name', name);
  if (participants && participants.length > 0) {
    formData.append('participants', JSON.stringify(participants));
  }
  if (image) {
    formData.append('image', image);
  }
  const res = await fetchWithAuth(`${API_URL}/api/group`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('No se pudo crear el grupo');
  return res.json();
}

// Obtener todos los grupos del usuario
export async function getGroups() {
  const res = await fetchWithAuth(`${API_URL}/api/group`);
  if (!res.ok) throw new Error('No se pudieron obtener los grupos');
  return res.json();
}

// Obtener info de un grupo específico
export async function getGroup(groupId) {
  const res = await fetchWithAuth(`${API_URL}/api/group/${groupId}`);
  if (!res.ok) throw new Error('No se pudo obtener el grupo');
  return res.json();
}

// Actualizar un grupo (nombre, imagen)
export async function updateGroup(groupId, { name, image }) {
  const formData = new FormData();
  if (name) formData.append('name', name);
  if (image) formData.append('image', image);
  const res = await fetchWithAuth(`${API_URL}/api/group/${groupId}`, {
    method: 'PATCH',
    body: formData
  });
  if (!res.ok) throw new Error('No se pudo actualizar el grupo');
  return res.json();
}

// Salir de un grupo
export async function exitGroup(groupId) {
  const res = await fetchWithAuth(`${API_URL}/api/group/exit/${groupId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('No se pudo salir del grupo');
  return res.json();
}

// Agregar participantes a un grupo
export async function addParticipantsToGroup(groupId, participants) {
  const res = await fetchWithAuth(`${API_URL}/api/group/add_participants/${groupId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ participants })
  });
  if (!res.ok) throw new Error('No se pudieron agregar los participantes');
  return res.json();
}

// Banear/quitar un participante de un grupo
export async function removeParticipantFromGroup(groupId, participantId) {
  const res = await fetchWithAuth(`${API_URL}/api/group/remove_participant/${groupId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ participantId })
  });
  if (!res.ok) throw new Error('No se pudo quitar al participante');
  return res.json();
}

// Eliminar un grupo
export async function deleteGroup(groupId) {
  const res = await fetchWithAuth(`${API_URL}/api/group/${groupId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('No se pudo eliminar el grupo');
  return res.json();
}

// =============================================
// ======= MENSAJES GRUPALES ==================
// =============================================

// Obtener mensajes de un grupo
export async function getGroupMessages(groupId) {
  const res = await fetchWithAuth(`${API_URL}/api/group/message/${groupId}`);
  if (!res.ok) throw new Error('No se pudieron obtener los mensajes del grupo');
  return res.json();
}

// Enviar mensaje de texto a un grupo
export async function sendGroupMessage(groupId, message) {
  const res = await fetchWithAuth(`${API_URL}/api/group/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ group_id: groupId, message })
  });
  if (!res.ok) throw new Error('No se pudo enviar el mensaje');
  return res.json();
}

// Enviar imagen a un grupo
export async function sendGroupImage(groupId, file) {
  const formData = new FormData();
  formData.append('group_id', groupId);
  formData.append('image', file);
  const res = await fetchWithAuth(`${API_URL}/api/group/message/image`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('No se pudo enviar la imagen');
  return res.json();
}

// Enviar audio a un grupo
export async function sendGroupAudio(groupId, file) {
  const formData = new FormData();
  formData.append('group_id', groupId);
  formData.append('audio', file);
  const res = await fetchWithAuth(`${API_URL}/api/group/message/audio`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('No se pudo enviar el audio');
  return res.json();
}

// Obtener el último mensaje de un grupo
export async function getGroupLastMessage(groupId) {
  const res = await fetchWithAuth(`${API_URL}/api/group/message/last/${groupId}`);
  if (!res.ok) throw new Error('No se pudo obtener el último mensaje');
  return res.json();
}

// Obtener el total de mensajes de un grupo
export async function getGroupTotalMessages(groupId) {
  const res = await fetchWithAuth(`${API_URL}/api/group/message/total/${groupId}`);
  if (!res.ok) throw new Error('No se pudo obtener el total de mensajes');
  return res.json();
}

// Puedes agregar aquí funciones para audio, imágenes, etc.
