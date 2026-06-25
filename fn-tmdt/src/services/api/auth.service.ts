import apiClient from './api.client';
import type { TokenResponse } from './types';

export const AuthService = {
  async register(data: any): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/register', data);
    return response.data;
  },

  async login(data: any): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/login', data);
    return response.data;
  },

  async loginWithGoogle(token: string): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/google', { token });
    return response.data;
  },

  async loginWithFacebook(token: string): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/facebook', { token });
    return response.data;
  },
};
