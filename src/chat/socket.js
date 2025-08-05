// Configuración de socket.io para la web de Magic2k
import { io } from "socket.io-client";

export const SOCKET_URL = "https://magic2k.com";

export function getSocket(token) {
  return io(SOCKET_URL, {
    path: "/socket.io",
    transports: ["websocket"],
    auth: { token },
  });
}
