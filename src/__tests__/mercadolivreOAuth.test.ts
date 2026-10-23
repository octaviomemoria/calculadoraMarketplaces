import { afterEach, describe, expect, it, vi } from "vitest";
import {
  beginAuthorization,
  completeAuthorization,
  getValidAccessToken,
} from "@/lib/mercadolivre/connection";
import { createMemoryStore } from "@/lib/mercadolivre/store";
import type { MercadoLivreConfig } from "@/lib/mercadolivre/types";

const config: MercadoLivreConfig = {
  clientId: "client-id",
  clientSecret: "server-secret",
  redirectUri: "https://calculadora.memoriaapps.site/api/mercadolivre/callback",
  frontendOrigin: "https://app.vercel.app",
  siteId: "MLB",
};

afterEach(() => vi.unstubAllGlobals());

describe("OAuth Mercado Livre", () => {
  it("monta autorização com state e PKCE e bloqueia returnTo externo", async () => {
    const store = createMemoryStore();
    const started = await beginAuthorization(store, config, "https://app.vercel.app/produtos/detalhe");
    const url = new URL(started.url);

    expect(url.origin + url.pathname).toBe("https://auth.mercadolivre.com.br/authorization");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("state")).toBe(started.state);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toBeTruthy();
    await expect(beginAuthorization(store, config, "https://evil.example")).rejects.toThrow(
      /returnTo/,
    );
  });

  it("troca o código uma vez e não devolve tokens ao chamador", async () => {
    const store = createMemoryStore();
    const started = await beginAuthorization(store, config);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ access_token: "access-1", refresh_token: "refresh-1", expires_in: 3600 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const completed = await completeAuthorization(store, config, "authorization-code", started.state);

    expect(completed.connectionId).toBeTruthy();
    expect(JSON.stringify(completed)).not.toContain("access-1");
    expect(JSON.stringify(completed)).not.toContain("refresh-1");
    await expect(completeAuthorization(store, config, "authorization-code", started.state)).rejects.toThrow(
      /state/i,
    );
  });

  it("renova access token expirado e grava o refresh token rotacionado", async () => {
    const store = createMemoryStore();
    const started = await beginAuthorization(store, config);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "access-expired", refresh_token: "refresh-1", expires_in: 0 }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "access-2", refresh_token: "refresh-2", expires_in: 3600 }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const completed = await completeAuthorization(store, config, "authorization-code", started.state);
    expect(await getValidAccessToken(store, config, completed.connectionId)).toBe("access-2");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
