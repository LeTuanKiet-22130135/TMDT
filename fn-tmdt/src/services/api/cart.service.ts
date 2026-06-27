import apiClient from './api.client';
import type { CartRead, CartItemRead } from './types';

export const CartService = {
  async getCart(): Promise<CartRead> {
    const response = await apiClient.get<CartRead>('/cart/');
    return response.data;
  },

  async addItem(data: any): Promise<CartItemRead> {
    const response = await apiClient.post<CartItemRead>('/cart/items', data);
    return response.data;
  },

  async updateItem(productId: number, data: any): Promise<CartItemRead> {
    const response = await apiClient.put<CartItemRead>(`/cart/items/${productId}`, data);
    return response.data;
  },

  async removeItem(productId: number): Promise<void> {
    await apiClient.delete(`/cart/items/${productId}`);
  },
};
