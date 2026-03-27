import api from './api';

const productService = {
  getAll: async (filters = {}) => {
    return api.get('/products', { params: filters });
  },

  getById: async (id) => {
    return api.get(`/products/${id}`);
  },

  create: async (productData) => {
    return api.post('/products', productData);
  },

  update: async (id, data) => {
    return api.put(`/products/${id}`, data);
  },

  delete: async (id) => {
    return api.delete(`/products/${id}`);
  },

  search: async (query) => {
    return api.get('/products/search', { params: { q: query } });
  },
};

export default productService;
