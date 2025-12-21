import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { getSocket } from "./socket";

const SocketContext = createContext(null);

export function SocketProvider({ user, token, children }) {
    const [socketReady, setSocketReady] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!user?._id || !token) return;
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        socketRef.current = getSocket(token);
        socketRef.current.on("connect", () => {
            // Enviar userId y estado al identificarse
            const state = localStorage.getItem('magic2k_user_state') || 'online';
            socketRef.current.emit("identify", { userId: user._id, state });
            setSocketReady(true);
        });
        
        // Escuchar lista inicial de usuarios online con sus estados
        socketRef.current.on("online_users", (users) => {
            //console.log("[SocketContext] online_users recibido:", users);
            window.magic2k_onlineUsers = users;
            // Disparar evento custom para que los componentes se actualicen
            window.dispatchEvent(new CustomEvent('magic2k_users_updated', { detail: users }));
        });
        
        // Escuchar cuando un usuario se conecta
        socketRef.current.on("user_online", ({ userId, state }) => {
            //console.log("[SocketContext] user_online:", userId, state);
            const currentUsers = window.magic2k_onlineUsers || [];
            const existingIndex = currentUsers.findIndex(u => String(u.id) === String(userId));
            if (existingIndex >= 0) {
                currentUsers[existingIndex].state = state;
            } else {
                currentUsers.push({ id: String(userId), state });
            }
            window.magic2k_onlineUsers = [...currentUsers];
            window.dispatchEvent(new CustomEvent('magic2k_users_updated', { detail: window.magic2k_onlineUsers }));
        });
        
        // Escuchar cuando un usuario cambia su estado
        socketRef.current.on("user_state_changed", ({ userId, state }) => {
            //console.log("[SocketContext] user_state_changed:", userId, state);
            const currentUsers = window.magic2k_onlineUsers || [];
            const existingIndex = currentUsers.findIndex(u => String(u.id) === String(userId));
            if (existingIndex >= 0) {
                currentUsers[existingIndex].state = state;
                window.magic2k_onlineUsers = [...currentUsers];
                window.dispatchEvent(new CustomEvent('magic2k_users_updated', { detail: window.magic2k_onlineUsers }));
            }
        });
        
        // Escuchar cuando un usuario se desconecta
        socketRef.current.on("user_offline", (userId) => {
            console.log("[SocketContext] user_offline:", userId);
            const currentUsers = window.magic2k_onlineUsers || [];
            window.magic2k_onlineUsers = currentUsers.filter(u => String(u.id) !== String(userId));
            window.dispatchEvent(new CustomEvent('magic2k_users_updated', { detail: window.magic2k_onlineUsers }));
        });
        
        return () => {
            socketRef.current && socketRef.current.disconnect();
        };
    }, [user?._id, token]);

    return (
        <SocketContext.Provider value={socketRef.current}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}