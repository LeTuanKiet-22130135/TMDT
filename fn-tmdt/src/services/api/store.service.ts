import apiClient from './api/api.client';
import { StoreRead, ProductRead } from './types';

export const StoreService = {
  async searchStores(params?: any): Promise<any> {
    const response = await apiClient.get('/stores/', { params });
    return response.data;
  },

  async getStoreById(storeId: number): Promise<StoreRead> {
    const response = await apiClient.get<StoreRead>(`/stores/${storeId}`);
    return response.data;
  },

  async getStoreProducts(storeId: number): Promise<ProductRead[]> {
    const response = await apiClient.get<ProductRead[]>(`/stores/${storeId}/products`);
    return response.data;
  },

  async createStore(data: any): Promise<StoreRead> {
    const response = await apiClient.post<StoreRead>('/stores/', data);
    return response.data;
  },
};
