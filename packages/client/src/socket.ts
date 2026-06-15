import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getServerUrl(): string {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }

  if (import.meta.env.DEV) {
    return window.location.origin;
  }

  return window.location.origin;
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(getServerUrl(), { autoConnect: true, transports: ['websocket'] });
  }
  return socket;
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function generatePlayerId(): string {
  const stored = localStorage.getItem('fodinha_player_id');
  if (stored) return stored;

  const id = createId();
  localStorage.setItem('fodinha_player_id', id);
  return id;
}
