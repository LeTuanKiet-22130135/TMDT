import apiClient from './api/api.client';
import { ProductRead } from './types';

export const ProductService = {
  async getNewest(): Promise<ProductRead[]> {
    const response = await apiClient.get<ProductRead[]>('/products/newest');
    return response.data;
  },

  async getBestSellers(): Promise<ProductRead[]> {
    const response = await apiClient.get<ProductRead[]>('/products/best-sellers');
    return response.data;
  },

  async getMostViewed(): Promise<ProductRead[]> {
    const response = await apiClient.get<ProductRead[]>('/products/most-viewed');
    return response.data;
  },

  async getSuggested(): Promise<ProductRead[]> {
    const response = await apiClient.get<ProductRead[]>('/products/suggested');
    return response.data;
  },

  async getAll(params?: any): Promise<any> {
    const response = await apiClient.get('/products/', { params });
    return response.data;
  },

  async getById(id: number): Promise<ProductRead> {
    const response = await apiClient.get<ProductRead>(`/products/${id}`);
    return response.data;
  },

  async create(data: any): Promise<ProductRead> {
    const response = await apiClient.post<ProductRead>('/products/', data);
    return response.data;
  },

  async update(id: number, data: any): Promise<ProductRead> {
    const response = await apiClient.put<ProductRead>(`/products/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },
};
