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
        // Exponer el socket en window para depuración manual desde la consola
        try { window.magic2k_socket = socketRef.current; } catch(e) { /* noop */ }
        // Listeners globales de debug (se limpian al desmontar)
        const __debug_on_message = (m) => console.debug('[SocketContext][debug] message', m);
        const __debug_on_tic = (d) => console.debug('[SocketContext][debug] tic', d);
        const __debug_on_connect = () => console.debug('[SocketContext][debug] connect', socketRef.current && socketRef.current.id);
        const __debug_on_connect_error = (err) => console.error('[SocketContext][debug] connect_error', err);
        socketRef.current.on("connect", () => {
            // Enviar userId y estado al identificarse
            const state = localStorage.getItem('magic2k_user_state') || 'online';
            socketRef.current.emit("identify", { userId: user._id, state });
            setSocketReady(true);
        });
        socketRef.current.on('connect_error', (err) => {
            console.error('[SocketContext] connect_error', err);
            setSocketReady(false);
        });
        socketRef.current.on('message', __debug_on_message);
        socketRef.current.on('tic', __debug_on_tic);
        socketRef.current.on('connect', __debug_on_connect);
        socketRef.current.on('connect_error', __debug_on_connect_error);
        
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
            // console.log("[SocketContext] user_offline:", userId);
            const currentUsers = window.magic2k_onlineUsers || [];
            window.magic2k_onlineUsers = currentUsers.filter(u => String(u.id) !== String(userId));
            window.dispatchEvent(new CustomEvent('magic2k_users_updated', { detail: window.magic2k_onlineUsers }));
        });
        
        return () => {
            if (socketRef.current) {
                socketRef.current.off('connect');
                socketRef.current.off('online_users');
                socketRef.current.off('user_online');
                socketRef.current.off('user_state_changed');
                socketRef.current.off('user_offline');
                socketRef.current.off('connect_error');
                // limpiar listeners de debug y referencia global
                try { socketRef.current.off('message', __debug_on_message); } catch(e) {}
                try { socketRef.current.off('tic', __debug_on_tic); } catch(e) {}
                try { socketRef.current.off('connect', __debug_on_connect); } catch(e) {}
                try { socketRef.current.off('connect_error', __debug_on_connect_error); } catch(e) {}
                try { delete window.magic2k_socket; } catch(e) {}
                socketRef.current.disconnect();
            }
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