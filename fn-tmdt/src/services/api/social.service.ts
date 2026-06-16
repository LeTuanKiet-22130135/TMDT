import apiClient from './api/api.client';
import { ReviewRead, CommentRead } from './types';

export const SocialService = {
  async addReview(data: any): Promise<ReviewRead> {
    const response = await apiClient.post<ReviewRead>('/reviews', data);
    return response.data;
  },

  async addComment(productId: number, data: any): Promise<CommentRead> {
    const response = await apiClient.post<CommentRead>(`/products/${productId}/comments`, data);
    return response.data;
  },

  async replyComment(parentId: number, data: any): Promise<CommentRead> {
    const response = await apiClient.post<CommentRead>(`/comments/${parentId}/reply`, data);
    return response.data;
  },
};
