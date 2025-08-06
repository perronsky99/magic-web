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
            socketRef.current.emit("identify", user._id);
            setSocketReady(true);
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