import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { getSocket } from "./socket";

// Contexto separado para el socket (referencia estable)
const SocketContext = createContext(null);

// Contexto separado para usuarios online (evita re-renders del socket context)
const OnlineUsersContext = createContext([]);

// Hook personalizado para obtener usuarios online con selector opcional
export function useOnlineUsers(selector) {
    const users = useContext(OnlineUsersContext);
    return selector ? selector(users) : users;
}

// Hook para verificar si un usuario específico está online
export function useIsUserOnline(userId) {
    return useOnlineUsers(users => {
        if (!userId) return { online: false, state: 'offline' };
        const user = users.find(u => String(u.id) === String(userId));
        return user ? { online: true, state: user.state } : { online: false, state: 'offline' };
    });
}

export function SocketProvider({ user, token, children }) {
    const [socketReady, setSocketReady] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
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
            setOnlineUsers(users);
            window.magic2k_onlineUsers = users;
            window.dispatchEvent(new CustomEvent('magic2k_users_updated', { detail: users }));
        });
        
        // Escuchar cuando un usuario se conecta
        socketRef.current.on("user_online", ({ userId, state }) => {
            setOnlineUsers(prev => {
                const existingIndex = prev.findIndex(u => String(u.id) === String(userId));
                let newUsers;
                if (existingIndex >= 0) {
                    newUsers = [...prev];
                    newUsers[existingIndex] = { ...newUsers[existingIndex], state };
                } else {
                    newUsers = [...prev, { id: String(userId), state }];
                }
                window.magic2k_onlineUsers = newUsers;
                window.dispatchEvent(new CustomEvent('magic2k_users_updated', { detail: newUsers }));
                return newUsers;
            });
        });
        
        // Escuchar cuando un usuario cambia su estado
        socketRef.current.on("user_state_changed", ({ userId, state }) => {
            setOnlineUsers(prev => {
                const existingIndex = prev.findIndex(u => String(u.id) === String(userId));
                if (existingIndex >= 0) {
                    const newUsers = [...prev];
                    newUsers[existingIndex] = { ...newUsers[existingIndex], state };
                    window.magic2k_onlineUsers = newUsers;
                    window.dispatchEvent(new CustomEvent('magic2k_users_updated', { detail: newUsers }));
                    return newUsers;
                }
                return prev;
            });
        });
        
        // Escuchar cuando un usuario se desconecta
        socketRef.current.on("user_offline", (userId) => {
            setOnlineUsers(prev => {
                const newUsers = prev.filter(u => String(u.id) !== String(userId));
                window.magic2k_onlineUsers = newUsers;
                window.dispatchEvent(new CustomEvent('magic2k_users_updated', { detail: newUsers }));
                return newUsers;
            });
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

    // El valor del socket es la referencia actual - socketReady solo indica si está conectado
    // Usamos un objeto wrapper para forzar re-render cuando el socket cambia
    const socketValue = socketRef.current;

    return (
        <SocketContext.Provider value={socketValue}>
            <OnlineUsersContext.Provider value={onlineUsers}>
                {children}
            </OnlineUsersContext.Provider>
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}

// Re-exportar para compatibilidad hacia atrás
export { OnlineUsersContext };