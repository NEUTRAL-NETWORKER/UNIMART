import api from './api';

const notificationService = {
  // Get all notifications
  getAll: async (limit = 20, offset = 0, unreadOnly = false) => {
    return api.get('/notifications', {
      params: { limit, offset, unread_only: unreadOnly }
    });
  },

  // Get unread count
  getUnreadCount: async () => {
    return api.get('/notifications/unread-count');
  },

  // Mark single notification as read
  markAsRead: async (notificationId) => {
    return api.put(`/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    return api.put('/notifications/read-all');
  },

  // Delete a notification
  delete: async (notificationId) => {
    return api.delete(`/notifications/${notificationId}`);
  },
};

export default notificationService;
