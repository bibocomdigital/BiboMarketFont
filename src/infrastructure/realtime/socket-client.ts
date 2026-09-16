import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function realtimeBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005/api";
  return api.replace(/\/api\/?$/, "");
}

export function connectRealtimeSocket(token: string): Socket {
  if (socket) {
    const current = socket.auth as { token?: string } | undefined;
    if (current?.token === token) return socket;
    disconnectRealtimeSocket();
  }

  socket = io(realtimeBaseUrl(), {
    auth: { token },
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 20,
  });
  return socket;
}

export function disconnectRealtimeSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}

export function getRealtimeSocket(): Socket | null {
  return socket;
}
