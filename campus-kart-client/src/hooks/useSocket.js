import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useStore } from '../store/useStore';

const SOCKET_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') 
  : 'http://localhost:5000';

export const useSocket = () => {
  const socketRef = useRef(null);
  const activeRoomsRef = useRef(new Set());

  const isAuthenticated = useStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Initialize the socket
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
    
    // Assign it to the ref for outside access
    socketRef.current = socket;
    
    // FIX 2 (Second Image): Lock the refs into local variables for the cleanup function
    const currentRooms = activeRoomsRef.current;

    socket.on('connect', () => {
      console.log('🌙 Socket Connected/Reconnected:', socket.id);

      if (currentRooms.size > 0) {
        setTimeout(() => {
          if (!socket.connected) return;

          currentRooms.forEach((chatId) => {
            console.log(`🔄 Rejoining room: ${chatId}`);
            socket.emit('join_chat', chatId);
          });
        }, 200);
      }
    });

    return () => {
      // Use the locally scoped socket instance and currentRooms to satisfy ESLint
      socket.disconnect();
      socketRef.current = null;

      // Prevent cross-user leakage cleanly
      currentRooms.clear();
    };
  }, [isAuthenticated]);

  const joinChat = useCallback((chatId) => {
    activeRoomsRef.current.add(chatId);

    if (socketRef.current?.connected) {
      socketRef.current.emit('join_chat', chatId);
    }
  }, []);

  const leaveChat = useCallback((chatId) => {
    activeRoomsRef.current.delete(chatId);

    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_chat', chatId);
    }
  }, []);

  const sendMessage = useCallback((chatId, senderId, text, callback) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(
        'send_message',
        { chatId, senderId, text },
        callback
      );
    }
  }, []);

  // FIX 1 (First Image): Return the ref object itself, NOT socketRef.current
  return { socketRef, joinChat, leaveChat, sendMessage };
};