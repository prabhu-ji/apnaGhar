import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import apiRequest from '../../lib/apiRequest';
import { toast } from 'react-toastify';
import NotificationsIcon from '@mui/icons-material/Notifications';
import './notification.scss';

const Notification = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, sendVisitResponse, markNotificationAsRead } = useNotification();
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const handleVisitResponse = async (visitId, status, notification) => {
    try {
      const response = await apiRequest.put(`/visits/${visitId}`, {
        status,
        responseMessage: status === 'ACCEPTED' ? 'Visit request accepted' : 'Visit request rejected'
      });

      if (response.data.notification) {
        sendVisitResponse(notification.visit.visitorId, response.data.notification);
      }

      await markNotificationAsRead(notification.id);
      toast.success(`Visit request ${status.toLowerCase()}`);

    } catch (err) {
      toast.error('Failed to respond to visit request');
      console.error('Error handling visit response:', err);
    }
  };

  return (
    <div className="notification-container">
      <div 
        className="notification-icon" 
        onClick={() => setShowNotifications(!showNotifications)}
      >
        {unreadCount > 0 && (
          <span className="notification-count">{unreadCount}</span>
        )}
        <NotificationsIcon />
      </div>

      {showNotifications && (
        <div className="notification-dropdown">
          {notifications.length === 0 ? (
            <p className="no-notifications">No notifications</p>
          ) : (
            notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                onClick={() => !notification.read && markNotificationAsRead(notification.id)}
              >
                <p>{notification.message}</p>
                {notification.type === 'VISIT_REQUEST' && !notification.read && (
                  <div className="notification-actions">
                    <button 
                      className="accept-btn"
                      onClick={() => handleVisitResponse(notification.visit.id, 'ACCEPTED', notification)}
                    >
                      Accept
                    </button>
                    <button 
                      className="reject-btn"
                      onClick={() => handleVisitResponse(notification.visit.id, 'REJECTED', notification)}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Notification;

