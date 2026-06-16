import axios from 'axios';

const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api/v1`, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor để đính kèm token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý lỗi
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Xử lý lỗi tập trung, ví dụ:
    // if (error.response?.status === 401) {
    //   // Xử lý logic đăng xuất hoặc redirect
    // }
    return Promise.reject(error);
  }
);

export default apiClient;
