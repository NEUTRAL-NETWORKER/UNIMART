import api from './api';

const chatService = {
  getMessages: async (orderId) => {
    return api.get(`/chat/${orderId}`);
  },

  sendMessage: async (orderId, message) => {
    return api.post(`/chat/${orderId}`, { message });
  },
};

export default chatService;
