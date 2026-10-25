/**
 * Cliente HTTP tipado y seguro para consumir la API de Nicabliss.
 * Maneja automáticamente encabezados JSON, Bearer Token y códigos de error comunes (401, 403, 500).
 */

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_BASE_URL = (configuredApiUrl || "http://localhost:4000/api/v1").replace(/\/$/, "");

if (typeof __STRICT_PRODUCTION_API__ !== "undefined" && __STRICT_PRODUCTION_API__) {
  if (!configuredApiUrl) {
    throw new Error("VITE_API_URL es obligatorio en producción");
  }
  const parsed = new URL(API_BASE_URL);
  if (parsed.protocol !== "https:" || ["localhost", "127.0.0.1"].includes(parsed.hostname)) {
    throw new Error("VITE_API_URL debe apuntar a una API HTTPS remota en producción");
  }
  if (!parsed.pathname.replace(/\/$/, "").endsWith("/api/v1")) {
    throw new Error("VITE_API_URL debe terminar en /api/v1");
  }
}

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

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

type ResponseMode = "auto" | "json" | "text" | "blob";

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
    options: RequestInit = {},
    responseMode: ResponseMode = "auto"
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    const headers = new Headers(options.headers);

    if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const token = this.getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401 && token) {
        localStorage.removeItem("nicabliss_token");
        localStorage.removeItem("nicabliss_user");
        window.dispatchEvent(new CustomEvent("nicabliss:session-expired"));
      }

      let data: unknown = undefined;
      const contentType = response.headers.get("content-type");
      if (response.status === 204) {
        data = undefined;
      } else if (responseMode === "blob") {
        data = await response.blob();
      } else if (responseMode === "text") {
        data = await response.text();
      } else if (responseMode === "json" || (contentType && contentType.includes("application/json"))) {
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

      const requestMethod = (options.method || "GET").toUpperCase();
      if (requestMethod !== "GET" && requestMethod !== "HEAD") {
        window.dispatchEvent(new CustomEvent("nicabliss:data-mutated"));
      }

      return data as T;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err;
      }
      if (err instanceof TypeError && err.message.includes("fetch")) {
        throw new ApiError(
          `No se pudo conectar con el servidor de Nicabliss (${API_BASE_URL}). Verifica la configuración y disponibilidad de la API.`,
          "NETWORK_ERROR"
        );
      }
      throw err;
    }
  }

  public get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: "GET", headers });
  }

  public getBlob(endpoint: string, headers?: Record<string, string>): Promise<Blob> {
    return this.request<Blob>(endpoint, { method: "GET", headers }, "blob");
  }

  public getText(endpoint: string, headers?: Record<string, string>): Promise<string> {
    return this.request<string>(endpoint, { method: "GET", headers }, "text");
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

  public put<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
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
