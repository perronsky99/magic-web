import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveTokens, clearTokens, getAccessToken } from './api';

const AuthContext = createContext();

// Helpers para persistir el usuario
function saveUser(user) {
  if (user) {
    localStorage.setItem('magic2k_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('magic2k_user');
  }
}

function loadUser() {
  try {
    const saved = localStorage.getItem('magic2k_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function loadToken() {
  return getAccessToken();
}

export function AuthProvider({ children }) {
  // Inicializar desde localStorage
  const [auth, setAuth] = useState(() => ({
    token: loadToken(),
    user: loadUser()
  }));

  const login = (data) => {
    saveTokens({ token: data.token, refresh: data.refresh });
    saveUser(data.user);
    setAuth({ token: data.token, user: data.user });
  };

  const logout = () => {
    clearTokens();
    saveUser(null);
    setAuth({ token: null, user: null });
  };

  // Actualizar usuario (para cuando se modifica el perfil)
  const updateUser = (user) => {
    saveUser(user);
    setAuth(a => ({ ...a, user }));
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, updateUser, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}