import apiClient from './api/api.client';

export const SellerService = {
  async getRevenueBarChart(params?: any): Promise<any> {
    const response = await apiClient.get('/stats/revenue-bar-chart', { params });
    return response.data;
  },

  async getRevenuePieChart(params?: any): Promise<any> {
    const response = await apiClient.get('/stats/revenue-pie-chart', { params });
    return response.data;
  },
};
