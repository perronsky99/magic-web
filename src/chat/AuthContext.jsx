import React, { createContext, useContext, useState } from 'react';
import { saveTokens, clearTokens } from './api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ token: null, user: null });

  const login = (data) => {
    saveTokens({ token: data.token, refresh: data.refresh });
    setAuth({ token: data.token, user: data.user });
  };

  const logout = () => {
    clearTokens();
    setAuth({ token: null, user: null });
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}