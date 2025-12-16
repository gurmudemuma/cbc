// @ts-nocheck
/**
 * Unified API Client Wrapper
 * Handles unified response format and error handling
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

export interface ApiSuccessResponse<T = any> {
  success: true;
  message?: string;
  data?: T;
  timestamp?: string;
  requestId?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: Record<string, any>;
    timestamp?: string;
    requestId?: string;
  };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

export class ApiClientWrapper {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor to handle unified format
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    );
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError<ApiErrorResponse>) {
    if (error.response?.data?.success === false) {
      // Already in unified error format
      throw error.response.data.error;
    }

    // Convert to unified error format
    throw {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      statusCode: error.response?.status || 500,
      details: { originalError: error.message },
    };
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: any): Promise<ApiSuccessResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    
    if (response.data.success === false) {
      throw response.data.error;
    }

    return response.data as ApiSuccessResponse<T>;
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: any): Promise<ApiSuccessResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    
    if (response.data.success === false) {
      throw response.data.error;
    }

    return response.data as ApiSuccessResponse<T>;
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: any): Promise<ApiSuccessResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    
    if (response.data.success === false) {
      throw response.data.error;
    }

    return response.data as ApiSuccessResponse<T>;
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: any): Promise<ApiSuccessResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    
    if (response.data.success === false) {
      throw response.data.error;
    }

    return response.data as ApiSuccessResponse<T>;
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: any): Promise<ApiSuccessResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    
    if (response.data.success === false) {
      throw response.data.error;
    }

    return response.data as ApiSuccessResponse<T>;
  }

  /**
   * Set authorization header
   */
  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove authorization header
   */
  removeAuthToken() {
    delete this.client.defaults.headers.common['Authorization'];
  }

  /**
   * Set custom header
   */
  setHeader(key: string, value: string) {
    this.client.defaults.headers.common[key] = value;
  }

  /**
   * Get underlying axios instance
   */
  getClient(): AxiosInstance {
    return this.client;
  }
}

// Create wrapper instance
export const createApiClient = (baseURL: string): ApiClientWrapper => {
  return new ApiClientWrapper(baseURL);
};

// Export types
export type { ApiSuccessResponse, ApiErrorResponse, ApiResponse };
