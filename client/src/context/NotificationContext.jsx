// NotificationContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { toast } from 'react-toastify';
import apiRequest from '../lib/apiRequest';

export const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { currentUser } = useContext(AuthContext);

  useEffect(() => {
    if (currentUser) {
      const newSocket = io('http://localhost:4000');
      setSocket(newSocket);

      newSocket.emit('newUser', currentUser.id);

      return () => newSocket.close();
    }
  }, [currentUser]);

  useEffect(() => {
    if (!socket) return;

    socket.on('getVisitRequest', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      toast.info('New visit request received!');
    });

    socket.on('getVisitResponse', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      toast.info('Visit request updated!');
    });

    return () => {
      socket.off('getVisitRequest');
      socket.off('getVisitResponse');
    };
  }, [socket]);

  const sendVisitRequest = (receiverId, notification) => {
    if (socket) {
      socket.emit('sendVisitRequest', {
        receiverId,
        notification
      });
    }
  };

  const sendVisitResponse = (receiverId, notification) => {
    if (socket) {
      socket.emit('sendVisitResponse', {
        receiverId,
        notification
      });
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await apiRequest.put(`/notifications/${notificationId}`, { read: true });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const value = {
    notifications,
    setNotifications,
    sendVisitRequest,
    sendVisitResponse,
    markNotificationAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
