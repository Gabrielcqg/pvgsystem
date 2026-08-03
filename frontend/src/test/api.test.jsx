import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiRequest } from "../lib/api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiRequest", () => {
  it("requires a bearer token before calling FastAPI", async () => {
    await expect(apiRequest("/painel")).rejects.toMatchObject({ status: 401, code: "session_expired" });
  });

  it("attaches the Supabase access token and query parameters", async () => {
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify([{ ano: 2026 }]), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const bearer = "access-token";

    const data = await apiRequest("/painel", { token: bearer, query: { ano: 2026 } });

    expect(data).toEqual([{ ano: 2026 }]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain("/painel?ano=2026");
    expect(init.headers.Authorization).toBe(`Bearer ${bearer}`);
  });

  it("maps authorization failures without exposing token material", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ detail: { erro: "acesso restrito", codigo: "forbidden" } }), { status: 403 })),
    );

    const bearer = "access-token";
    await expect(apiRequest("/contratos", { token: bearer })).rejects.toBeInstanceOf(ApiError);
    await expect(apiRequest("/contratos", { token: bearer })).rejects.toMatchObject({
      status: 403,
      code: "permission_denied",
      message: "Usuario autenticado, mas sem autorizacao para acessar estes dados.",
    });
  });

  it("turns a missing member endpoint into an actionable auth message", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ detail: "Not Found" }), { status: 404 })));
    const bearer = "access-token";

    await expect(apiRequest("/me", { token: bearer })).rejects.toMatchObject({
      status: 404,
      code: "endpoint_not_found",
      message: "Endpoint de autenticacao nao encontrado no backend. Confirme se a API esta atualizada e se o frontend chama GET /me.",
    });
  });
});
