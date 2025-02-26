import { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import apiRequest from '../../lib/apiRequest';
import { toast } from 'react-toastify';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import './notification.scss';

const Notification = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const { notifications, setNotifications, sendVisitResponse } = useNotification();
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (currentUser?.userType === 'seller') {
      fetchPendingRequests();
    } else {
      fetchUserNotifications();
    }
  }, [currentUser]);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const fetchUserNotifications = async () => {
    try {
      const response = await apiRequest.get('/notifications');
      setNotifications(response.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications([]);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await apiRequest.get('/visits/visit-requests');
      setPendingRequests(response.data);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
      setPendingRequests([]);
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      if (currentUser?.userType === 'seller') {
        fetchPendingRequests();
      } else {
        fetchUserNotifications();
      }
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await apiRequest.put(`/notifications/${notificationId}/read`);
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const clearNotification = async (notificationId) => {
    try {
      await apiRequest.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notification cleared');
    } catch (err) {
      console.error('Error clearing notification:', err);
      toast.error('Failed to clear notification');
    }
  };

  const clearAllNotifications = async () => {
    try {
      await apiRequest.delete('/notifications/clear-all');
      setNotifications([]);
      toast.success('All notifications cleared');
    } catch (err) {
      console.error('Error clearing all notifications:', err);
      toast.error('Failed to clear notifications');
    }
  };

  const handleVisitResponse = async (visitId, status, request) => {
    try {
      const response = await apiRequest.put(`/visits/${visitId}`, {
        status,
        userId: currentUser.id,
        responseMessage: status === 'ACCEPTED' 
          ? `Your visit request for ${request.post.title} has been accepted`
          : `Your visit request for ${request.post.title} has been rejected`
      });

      if (response.data.visit) {
        // Show success message
        toast.success(`Visit request ${status.toLowerCase()} successfully`);
        
        // Notify the visitor
        if (response.data.notification) {
          sendVisitResponse(request.visitorId, response.data.notification);
        }
        
        // Refresh pending requests
        fetchPendingRequests();
      }
    } catch (err) {
      console.error('Error handling visit response:', err);
      toast.error('Failed to respond to visit request');
    }
  };

  const renderNotificationContent = () => {
    if (currentUser?.userType === 'seller') {
      return (
        <div className="notification-list">
          <div className="notification-header">
            <h3>Visit Requests</h3>
            {pendingRequests.length > 0 && (
              <button 
                className="clear-all-btn"
                onClick={clearAllNotifications}
              >
                Clear All
              </button>
            )}
          </div>
          {pendingRequests.length === 0 ? (
            <p className="no-notifications">No pending visit requests</p>
          ) : (
            pendingRequests.map((request) => (
              <div key={request.id} className="notification-item">
                <div className="notification-content">
                  <p>
                    Visit request by <strong>{request.visitorName || "User"}</strong> for{" "}
                    <strong>{request.post.title}</strong> on{" "}
                    {new Date(request.date).toLocaleDateString()} at {request.timeSlot}
                  </p>
                  <div className="notification-actions">
                    <button
                      className="accept-btn"
                      onClick={() => handleVisitResponse(request.id, 'ACCEPTED', request)}
                    >
                      Accept
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => handleVisitResponse(request.id, 'REJECTED', request)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      );
    } else {
      return (
        <div className="notification-list">
          <div className="notification-header">
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <button 
                className="clear-all-btn"
                onClick={clearAllNotifications}
              >
                Clear All
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="no-notifications">No notifications</p>
          ) : (
            notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                onClick={() => !notification.read && markNotificationAsRead(notification.id)}
              >
                <div className="notification-content">
                  <p>{notification.message}</p>
                  <small>{new Date(notification.createdAt).toLocaleDateString()}</small>
                </div>
                <button 
                  className="clear-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearNotification(notification.id);
                  }}
                >
                  <DeleteOutlineIcon />
                </button>
              </div>
            ))
          )}
        </div>
      );
    }
  };

  return (
    <div className="notification-container">
      <div className="notification-icon" onClick={handleNotificationClick}>
        {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
        <NotificationsIcon />
      </div>

      {showNotifications && (
        <div className="notification-dropdown">
          {renderNotificationContent()}
        </div>
      )}
    </div>
  );
};

export default Notification;