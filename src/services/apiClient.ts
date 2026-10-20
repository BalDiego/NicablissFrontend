const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem("nicabliss_token");
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Si el token expiró o es inválido, cerrar sesión limpiamente
      if (response.status === 401) {
        localStorage.removeItem("nicabliss_token");
        localStorage.removeItem("nicabliss_user");
        window.dispatchEvent(new CustomEvent("nicabliss:session-expired"));
      }

      let data: any;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorMessage =
          data?.error?.message ||
          (typeof data === "string" ? data : "Error en el servidor");
        const error = new Error(errorMessage) as any;
        error.code = data?.error?.code || "HTTP_ERROR";
        error.status = response.status;
        throw error;
      }

      return data;
    } catch (err: any) {
      // Captura fallas de red cuando la API está apagada
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        const netErr = new Error(
          "No se pudo conectar con el servidor de Nicabliss (http://localhost:4000). Verifica que la API esté encendida."
        ) as any;
        netErr.code = "NETWORK_ERROR";
        throw netErr;
      }
      throw err;
    }
  }

  public get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: "GET", headers });
  }

  public post<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public patch<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE", headers });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
