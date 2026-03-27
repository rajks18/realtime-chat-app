 import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Connect to socket with JWT token
      const newSocket = io('http://localhost:5000', {
        auth: { token: localStorage.getItem('token') },
      });

      newSocket.on('connect', () => {
        console.log('Socket connected!');
      });

      setSocket(newSocket);

      // Cleanup on logout
      return () => newSocket.disconnect();
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);