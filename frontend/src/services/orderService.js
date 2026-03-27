import api from './api';

const orderService = {
  create: async (orderData) => {
    return api.post('/orders', orderData);
  },

  getByBuyer: async () => {
    return api.get('/orders/buyer');
  },

  getBySeller: async () => {
    return api.get('/orders/seller');
  },

  updateStatus: async (id, status) => {
    return api.put(`/orders/${id}/status`, { status });
  },

  getById: async (id) => {
    return api.get(`/orders/${id}`);
  },

  cancel: async (id, reason) => {
    return api.post(`/orders/${id}/cancel`, { reason });
  },
};

export default orderService;
