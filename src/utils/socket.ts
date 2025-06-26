// src/utils/socket.ts
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000, // 1 second delay between reconnections
  reconnectionDelayMax: 5000, // exponential backoff till 5 seconds
  randomizationFactor: 0.5
});

socket.on('connect', () => {
  console.log('Connected with ID:', socket.id);
});

socket.on('connect_error', () => {
  console.log('Failed to connect to server');
});
