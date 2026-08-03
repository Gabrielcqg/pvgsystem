import { frontendConfig } from "./config";

export class ApiError extends Error {
  constructor(message, { status = 0, code = "api_error", detail = null, method = null, url = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.detail = detail;
    this.method = method;
    this.url = url;
  }
}

function normalizePath(path) {
  return path.startsWith("/") ? path : `/${path}`;
}

function buildUrl(path, query = undefined) {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const baseUrl = frontendConfig.apiUrl.startsWith("http")
    ? frontendConfig.apiUrl
    : `${origin}${frontendConfig.apiUrl.startsWith("/") ? "" : "/"}${frontendConfig.apiUrl}`;
  const url = new URL(`${baseUrl}${normalizePath(path)}`);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url;
}

function parseErrorBody(body, fallback) {
  if (!body || typeof body !== "object") return fallback;
  const detail = body.detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") {
    return detail.erro || detail.message || fallback;
  }
  return body.erro || body.message || fallback;
}

function responseCode(status, payload) {
  const detailCode = payload?.detail?.codigo || payload?.code;
  if (status === 401) return "session_expired";
  if (status === 403) return "permission_denied";
  if (status === 404) return "endpoint_not_found";
  if (status >= 500) return "server_error";
  return detailCode || "api_error";
}

function responseMessage(status, path, payload) {
  const backendMessage = parseErrorBody(payload, "Erro na API");
  if (status === 401) return "Sessao expirada. Entre novamente.";
  if (status === 403) return "Usuario autenticado, mas sem autorizacao para acessar estes dados.";
  if (status === 404) {
    if (normalizePath(path) === "/me" || normalizePath(path) === "/api/me") {
      return "Endpoint de autenticacao nao encontrado no backend. Confirme se a API esta atualizada e se o frontend chama GET /me.";
    }
    return "Endpoint nao encontrado na API.";
  }
  if (status >= 500) return "Erro interno na API. Consulte os logs do FastAPI.";
  return backendMessage;
}

export async function apiRequest(path, { token, method = "GET", body, query, signal } = {}) {
  if (!token) {
    throw new ApiError("Sessao expirada ou ausente. Entre novamente.", { status: 401, code: "session_expired", method, url: normalizePath(path) });
  }
  const url = buildUrl(path, query);
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    throw new ApiError("API indisponivel. Verifique se o FastAPI esta iniciado e se VITE_API_URL aponta para ele.", {
      status: 0,
      code: "unavailable",
      detail: error,
      method,
      url: url.toString(),
    });
  }

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  if (!response.ok) {
    throw new ApiError(responseMessage(response.status, path, payload), {
      status: response.status,
      code: responseCode(response.status, payload),
      detail: payload?.detail || payload,
      method,
      url: url.toString(),
    });
  }
  return payload;
}
