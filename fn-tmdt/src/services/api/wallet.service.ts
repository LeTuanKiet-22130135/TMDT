import apiClient from './api.client';

export const WalletService = {
  async topupWallet(amount: number, return_url: string): Promise<{ payment_url: string }> {
    const response = await apiClient.post('/wallet/topup', { amount, return_url });
    return response.data;
  },
  async verifyTopup(queryString: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.get(`/wallet/vnpay-return?${queryString}`);
    return response.data;
  },
};
