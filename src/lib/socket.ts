import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL, {
      autoConnect: true,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

/** Join the room for a pitch+date so we receive live slot updates. */
export function joinRoom(pitchId: string, date: string) {
  getSocket().emit("join", { pitchId, date });
}

export function leaveRoom(pitchId: string, date: string) {
  getSocket().emit("leave", { pitchId, date });
}
