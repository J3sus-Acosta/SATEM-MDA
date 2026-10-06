export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any[];
}

export class ApiClient {
  private baseUrl: string;
  private tenantId: string = '';
  private accessToken: string | null = null;
  private isRefreshing: boolean = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (err: any) => void;
  }> = [];

  constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl;
  }

  setTenant(tenantId: string) {
    this.tenantId = tenantId;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else if (token) {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    customFetch: typeof fetch = fetch
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.tenantId ? { 'X-Tenant-ID': this.tenantId } : {}),
      ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    try {
      const response = await customFetch(url, { ...options, headers });

      // Si responde 401 Unauthorized y no es endpoint de auth, intentar refrescar
      if (response.status === 401 && !endpoint.includes('/auth/')) {
        if (!this.isRefreshing) {
          this.isRefreshing = true;

          try {
            const refreshRes = await customFetch(`${this.baseUrl}/auth/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(this.tenantId ? { 'X-Tenant-ID': this.tenantId } : {}),
              },
            });

            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              this.accessToken = refreshData.accessToken;
              this.processQueue(null, this.accessToken);
              this.isRefreshing = false;

              // Reintentar petición original con nuevo token
              headers['Authorization'] = `Bearer ${this.accessToken}`;
              const retryRes = await customFetch(url, { ...options, headers });
              return retryRes.json();
            } else {
              this.processQueue(new Error('SESSION_EXPIRED'), null);
              this.isRefreshing = false;
              this.accessToken = null;
            }
          } catch (err) {
            this.processQueue(err, null);
            this.isRefreshing = false;
          }
        } else {
          // Si ya se está refrescando, poner en cola
          return new Promise((resolve, reject) => {
            this.failedQueue.push({
              resolve: async (newToken: string) => {
                headers['Authorization'] = `Bearer ${newToken}`;
                const retryRes = await customFetch(url, { ...options, headers });
                resolve(retryRes.json());
              },
              reject,
            });
          });
        }
      }

      return response.json();
    } catch (err: any) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: err.message || 'Error de conexión',
      };
    }
  }

  get<T>(endpoint: string, customFetch?: typeof fetch) {
    return this.request<T>(endpoint, { method: 'GET' }, customFetch);
  }

  post<T>(endpoint: string, body?: any, customFetch?: typeof fetch) {
    return this.request<T>(
      endpoint,
      { method: 'POST', body: body ? JSON.stringify(body) : undefined },
      customFetch
    );
  }

  patch<T>(endpoint: string, body?: any, customFetch?: typeof fetch) {
    return this.request<T>(
      endpoint,
      { method: 'PATCH', body: body ? JSON.stringify(body) : undefined },
      customFetch
    );
  }
}

export const apiClient = new ApiClient();
