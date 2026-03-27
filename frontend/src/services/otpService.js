import api from './api';

const otpService = {
  generate: async (orderId) => {
    return api.post('/otp/generate', { orderId });
  },

  verify: async (orderId, otp) => {
    return api.post('/otp/verify', { orderId, otp });
  },

  sendViaEmail: async (orderId, email) => {
    return api.post('/otp/send-email', email ? { orderId, email } : { orderId });
  },
};

export default otpService;
