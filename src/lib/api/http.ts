/**
 * Solace API HTTP Client
 *
 * Provides a stateless fetch wrapper with:
 * 1. Automatic Authorization: Bearer <token> header injection for stateless REST communication (eliminating CSRF by design).
 * 2. Automatic credentials inclusion (`credentials: "include"`) for cookie compatibility.
 * 3. Token management helpers (localStorage + in-memory cache).
 * 4. Silent session refresh on HTTP 401 with automatic request replay.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

let memoryToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: Array<(ok: boolean) => void> = [];

export function getStoredToken(): string | null {
  if (memoryToken) return memoryToken;
  if (typeof window !== "undefined") {
    return localStorage.getItem("solace_access_token");
  }
  return null;
}

export function setStoredToken(token: string | null): void {
  memoryToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("solace_access_token", token);
    } else {
      localStorage.removeItem("solace_access_token");
    }
  }
}

function subscribeTokenRefresh(cb: (ok: boolean) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(ok: boolean) {
  refreshSubscribers.forEach((cb) => cb(ok));
  refreshSubscribers = [];
}

/**
 * Enhanced fetch client for backend API communication with Bearer JWT support.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);

  // Set default JSON Content-Type if body is a string and no header exists
  if (options.body && typeof options.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Inject Authorization Bearer token if present
  const token = getStoredToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;

  let response = await fetch(fullUrl, {
    ...options,
    headers,
    credentials: "include",
  });

  // Handle 401 Unauthorized by attempting a token refresh (except on auth routes)
  if (
    response.status === 401 &&
    !url.includes("/api/auth/login") &&
    !url.includes("/api/auth/register") &&
    !url.includes("/api/auth/refresh")
  ) {
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const refreshHeaders = new Headers();
        if (token) {
          refreshHeaders.set("Authorization", `Bearer ${token}`);
        }

        const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: "POST",
          headers: refreshHeaders,
          credentials: "include",
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          const newToken = data.token || data.accessToken;
          if (newToken) {
            setStoredToken(newToken);
          }

          isRefreshing = false;
          onRefreshed(true);

          // Retry original request with fresh token
          const retryHeaders = new Headers(options.headers);
          if (newToken) {
            retryHeaders.set("Authorization", `Bearer ${newToken}`);
          }
          if (options.body && typeof options.body === "string" && !retryHeaders.has("Content-Type")) {
            retryHeaders.set("Content-Type", "application/json");
          }

          return fetch(fullUrl, {
            ...options,
            headers: retryHeaders,
            credentials: "include",
          });
        } else {
          isRefreshing = false;
          setStoredToken(null);
          onRefreshed(false);
        }
      } catch {
        isRefreshing = false;
        onRefreshed(false);
      }
    } else {
      // Wait for concurrent refresh to complete
      return new Promise<Response>((resolve, reject) => {
        subscribeTokenRefresh(async (success) => {
          if (success) {
            try {
              const freshToken = getStoredToken();
              const retryHeaders = new Headers(options.headers);
              if (freshToken) {
                retryHeaders.set("Authorization", `Bearer ${freshToken}`);
              }
              if (options.body && typeof options.body === "string" && !retryHeaders.has("Content-Type")) {
                retryHeaders.set("Content-Type", "application/json");
              }

              const retryRes = await fetch(fullUrl, {
                ...options,
                headers: retryHeaders,
                credentials: "include",
              });
              resolve(retryRes);
            } catch (err) {
              reject(err);
            }
          } else {
            resolve(response);
          }
        });
      });
    }
  }

  return response;
}
