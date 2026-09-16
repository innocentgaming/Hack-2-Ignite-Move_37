import { ApiResponse, ApiError } from '@internos/types';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || '';
  }

  private getToken(): string | null {
    return localStorage.getItem('internos_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('internos_token');
          localStorage.removeItem('internos_user');
          // Only redirect if we are inside a browser session
          if (window.location.pathname.startsWith('/app')) {
            window.location.href = '/login?expired=true';
          }
        }

        const error: ApiError = json?.error || {
          code: `HTTP_${response.status}`,
          message: json?.message || response.statusText || 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
          path: endpoint,
        };

        return {
          success: false,
          error,
        };
      }

      return json as ApiResponse<T>;
    } catch (err) {
      const networkError: ApiError = {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Unable to connect to InternOS API server',
        timestamp: new Date().toISOString(),
        path: endpoint,
      };

      return {
        success: false,
        error: networkError,
      };
    }
  }

  get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
