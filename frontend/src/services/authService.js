import api from './api';

const authService = {
  login: async (studentId, password) => {
    return api.post('/auth/login', { studentId, password });
  },

  register: async (data) => {
    return api.post('/auth/register', data);
  },

  verifyRegisterNumber: async (registerNumber) => {
    return api.get(`/auth/verify/${registerNumber}`);
  },

  getProfile: async () => {
    return api.get('/auth/profile');
  },

  updateProfile: async (data) => {
    return api.put('/auth/profile', data);
  },
};

export default authService;
