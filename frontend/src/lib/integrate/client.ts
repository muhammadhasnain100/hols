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

function readAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hols_access_token");
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, auth, headers, ...rest } = options;

  const requestHeaders = new Headers(headers);
  if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = readAccessToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload: ApiSuccess<T> | ApiError | null = null;

  try {
    payload = (await response.json()) as ApiSuccess<T> | ApiError;
  } catch {
    throw new ApiRequestError(
      "Unexpected server response",
      "INVALID_RESPONSE",
      response.status,
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

export async function apiFormRequest<T>(
  path: string,
  formData: FormData,
  options: FormRequestOptions = {},
): Promise<T> {
  const { auth, headers, ...rest } = options;

  const requestHeaders = new Headers(headers);
  if (auth) {
    const token = readAccessToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    method: "PUT",
    headers: requestHeaders,
    body: formData,
  });

  let payload: ApiSuccess<T> | ApiError | null = null;

  try {
    payload = (await response.json()) as ApiSuccess<T> | ApiError;
  } catch {
    throw new ApiRequestError(
      "Unexpected server response",
      "INVALID_RESPONSE",
      response.status,
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
