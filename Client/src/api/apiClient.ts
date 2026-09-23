import axios, { AxiosError, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // 45 seconds for Monte Carlo / particle integration
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export interface ApiErrorShape {
  message: string;
  status?: number;
  data?: any;
  error?: string;
  isNetworkError: boolean;
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const errorData = error.response?.data as any;
    let message = error.message;
    let errorCode = 'UNKNOWN_ERROR';

    if (errorData) {
      if (typeof errorData.detail === 'string') {
        message = errorData.detail;
      } else if (errorData.detail && typeof errorData.detail === 'object') {
        message = errorData.detail.message || message;
        errorCode = errorData.detail.error || errorCode;
      } else if (errorData.message) {
        message = errorData.message;
        errorCode = errorData.error || errorCode;
      }
    }

    const customError: ApiErrorShape = {
      message,
      error: errorCode,
      status: error.response?.status,
      data: error.response?.data,
      isNetworkError: !error.response,
    };

    return Promise.reject(customError);
  }
);
