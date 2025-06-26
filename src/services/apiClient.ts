
import AuthService from './authService';

const API_BASE_URL = 'https://service.maxtravel.al';

interface ApiResponse<T = any> {
  header: {
    requestId: string;
    success: boolean;
    responseTime?: string;
    messages: Array<{
      id: number;
      code: string;
      messageType: number;
      message: string;
    }>;
  };
  body: T;
}

class ApiClient {
  private static instance: ApiClient;
  private authService: AuthService;

  constructor() {
    this.authService = AuthService.getInstance();
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    const maxRetries = 1;

    try {
      // Get valid token (will re-authenticate if needed)
      const token = await this.authService.getValidToken();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: ApiResponse<T> = await response.json();
      
      if (!data.header.success) {
        const errorMessage = data.header.messages[0]?.message || 'API request failed';
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      
      // If it's an authentication error and we haven't retried yet, try once more
      if (retryCount < maxRetries && 
          (error instanceof Error && 
           (error.message.includes('401') || error.message.includes('token')))) {
        console.log('Retrying request after re-authentication...');
        return this.makeRequest<T>(endpoint, options, retryCount + 1);
      }
      
      throw error;
    }
  }

  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T = any>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }
}

export default ApiClient;
