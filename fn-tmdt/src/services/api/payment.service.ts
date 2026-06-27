import apiClient from './api.client';

export const PaymentService = {
  async getPayment(orderId: number): Promise<any> {
    const response = await apiClient.get(`/payments/${orderId}`);
    return response.data;
  },

  async initiatePayment(orderId: number, data: any): Promise<any> {
    const response = await apiClient.post(`/payments/${orderId}/initiate`, data);
    return response.data;
  },

  async webhook(data: any): Promise<any> {
    const response = await apiClient.post('/payments/webhook', data);
    return response.data;
  },
};
