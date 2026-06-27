import apiClient from './api.client';
import type { OrderRead } from './types';

export const OrderService = {
  async checkout(data: any): Promise<any> {
    const response = await apiClient.post('/orders/checkout', data);
    return response.data;
  },

  async getHistory(): Promise<OrderRead[]> {
    const response = await apiClient.get<OrderRead[]>('/orders/history');
    return response.data;
  },

  async updateStatus(orderId: number, data: any): Promise<OrderRead> {
    const response = await apiClient.put<OrderRead>(`/orders/${orderId}/status`, data);
    return response.data;
  },

  async cancelOrder(orderId: number, data?: any): Promise<OrderRead> {
    const response = await apiClient.post<OrderRead>(`/orders/${orderId}/cancel`, data);
    return response.data;
  },
};
