import {
  clearAuthSession,
  getRefreshToken,
  notifyAuthLogout,
  updateAuthTokens,
} from "@/lib/integrate/auth/storage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export type ApiSuccess<T> = {
  status: true;
  response: T;
};

export type ApiError = {
  status: false;
  error: string;
  error_code: string;
};

export class ApiRequestError extends Error {
  errorCode: string;
  status: number;

  constructor(message: string, errorCode: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.errorCode = errorCode;
    this.status = status;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

type FormRequestOptions = Omit<RequestInit, "body"> & {
  auth?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

function readAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hols_access_token");
}

function forceLogout() {
  clearAuthSession();
  notifyAuthLogout();
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    forceLogout();
    return null;
  }

  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
    .then(async (response) => {
      const payload = (await response.json()) as ApiSuccess<{
        access_token: string;
        refresh_token: string;
        expires_in?: number;
      }> | ApiError;

      if (!response.ok || payload.status === false) {
        forceLogout();
        return null;
      }

      updateAuthTokens(payload.response);
      return payload.response.access_token;
    })
    .catch(() => {
      forceLogout();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export function refreshAccessTokenForSession() {
  return refreshAccessToken();
}

async function fetchJson<T>(
  path: string,
  init: RequestInit,
  statusForError: number,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  let payload: ApiSuccess<T> | ApiError | null = null;

  try {
    payload = (await response.json()) as ApiSuccess<T> | ApiError;
  } catch {
    throw new ApiRequestError(
      "Unexpected server response",
      "INVALID_RESPONSE",
      response.status || statusForError,
    );
  }

  if (!response.ok || payload.status === false) {
    const errorPayload = payload as ApiError;
    throw new ApiRequestError(
      errorPayload.error ?? "Request failed",
      errorPayload.error_code ?? "REQUEST_FAILED",
      response.status,
    );
  }

  return payload.response;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, auth, headers, ...rest } = options;

  const buildHeaders = (token?: string | null) => {
    const requestHeaders = new Headers(headers);
    if (body !== undefined) {
      requestHeaders.set("Content-Type", "application/json");
    }
    if (auth && token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
    return requestHeaders;
  };
  const token = auth ? readAccessToken() : null;
  const init: RequestInit = {
    ...rest,
    headers: buildHeaders(token),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  try {
    return await fetchJson<T>(path, init, 0);
  } catch (err) {
    if (!(err instanceof ApiRequestError) || !auth || err.status !== 401) {
      throw err;
    }

    const refreshedToken = await refreshAccessToken();
    if (!refreshedToken) throw err;
    return fetchJson<T>(
      path,
      {
        ...rest,
        headers: buildHeaders(refreshedToken),
        body: body !== undefined ? JSON.stringify(body) : undefined,
      },
      401,
    );
  }
}

export async function apiFormRequest<T>(
  path: string,
  formData: FormData,
  options: FormRequestOptions = {},
): Promise<T> {
  const { auth, headers, ...rest } = options;

  const buildHeaders = (token?: string | null) => {
    const requestHeaders = new Headers(headers);
    if (auth && token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
    return requestHeaders;
  };
  const token = auth ? readAccessToken() : null;
  const init: RequestInit = {
    ...rest,
    method: "PUT",
    headers: buildHeaders(token),
    body: formData,
  };

  try {
    return await fetchJson<T>(path, init, 0);
  } catch (err) {
    if (!(err instanceof ApiRequestError) || !auth || err.status !== 401) {
      throw err;
    }

    const refreshedToken = await refreshAccessToken();
    if (!refreshedToken) throw err;
    return fetchJson<T>(
      path,
      {
        ...rest,
        method: "PUT",
        headers: buildHeaders(refreshedToken),
        body: formData,
      },
      401,
    );
  }
}
