/**
 * Cliente HTTP tipado y seguro para consumir la API de Nicabliss.
 * Maneja automáticamente encabezados JSON, Bearer Token y códigos de error comunes (401, 403, 500).
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

export class ApiError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem("nicabliss_token");
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

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

      if (response.status === 401) {
        localStorage.removeItem("nicabliss_token");
        localStorage.removeItem("nicabliss_user");
        window.dispatchEvent(new CustomEvent("nicabliss:session-expired"));
      }

      let data: unknown;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorRecord = typeof data === "object" && data !== null && "error" in data
          ? (data as { error?: { message?: string; code?: string } }).error
          : null;

        const errorMessage =
          errorRecord?.message ||
          (typeof data === "string" ? data : "Error en el servidor");
        const errorCode = errorRecord?.code || "HTTP_ERROR";

        throw new ApiError(errorMessage, errorCode, response.status);
      }

      return data as T;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err;
      }
      if (err instanceof TypeError && err.message.includes("fetch")) {
        throw new ApiError(
          "No se pudo conectar con el servidor de Nicabliss (http://localhost:4000). Verifica que la API esté encendida.",
          "NETWORK_ERROR"
        );
      }
      throw err;
    }
  }

  public get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: "GET", headers });
  }

  public post<T>(
    endpoint: string,
    body?: unknown,
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
    body?: unknown,
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
