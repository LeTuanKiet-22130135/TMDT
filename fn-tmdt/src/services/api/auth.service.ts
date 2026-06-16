import apiClient from './api/api.client';
import { TokenResponse } from './types';

export const AuthService = {
  async register(data: any): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/register', data);
    return response.data;
  },

  async login(data: any): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/login', data);
    return response.data;
  },
};
