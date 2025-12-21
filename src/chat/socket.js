// Configuración de socket.io para la web de Magic2k
import { io } from "socket.io-client";

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://magic2k.com";

// By default prefer polling first to avoid noisy WebSocket connection errors
// If you really want webSockets first, set VITE_SOCKET_FORCE_WS=true in your env.
const forceWebsocket = (import.meta.env.VITE_SOCKET_FORCE_WS || "false") === "true";

export function getSocket(token) {
  const transports = forceWebsocket ? ["websocket", "polling"] : ["polling", "websocket"];
  return io(SOCKET_URL, {
    path: "/socket.io",
    transports,
    auth: { token },
    // reduce automatic logs from socket.io client
    autoConnect: true,
    upgrade: !forceWebsocket, // allow upgrade if polling first
  });
}
