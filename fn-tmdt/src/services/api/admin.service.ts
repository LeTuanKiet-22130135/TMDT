import apiClient from './api/api.client';
import { UserAdminRead, StoreAdminRead, ReportAdminRead } from './types';

export const AdminService = {
  async getUsers(params?: any): Promise<UserAdminRead[]> {
    const response = await apiClient.get<UserAdminRead[]>('/users', { params });
    return response.data;
  },

  async blockUser(userId: number, data?: any): Promise<UserAdminRead> {
    const response = await apiClient.put<UserAdminRead>(`/users/${userId}/block`, data);
    return response.data;
  },

  async getStores(params?: any): Promise<StoreAdminRead[]> {
    const response = await apiClient.get<StoreAdminRead[]>('/stores', { params });
    return response.data;
  },

  async disableStore(storeId: number, data?: any): Promise<StoreAdminRead> {
    const response = await apiClient.put<StoreAdminRead>(`/stores/${storeId}/disable`, data);
    return response.data;
  },

  async getReports(params?: any): Promise<ReportAdminRead[]> {
    const response = await apiClient.get<ReportAdminRead[]>('/reports', { params });
    return response.data;
  },

  async resolveReport(reportId: number, data?: any): Promise<ReportAdminRead> {
    const response = await apiClient.put<ReportAdminRead>(`/reports/${reportId}/resolve`, data);
    return response.data;
  },
};
