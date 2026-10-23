import { describe, expect, it } from "vitest";
import { authHandler } from "../../api/mercadolivre/auth";
import { feesHandler } from "../../api/mercadolivre/fees";
import { statusHandler } from "../../api/mercadolivre/status";
import { createMemoryStore } from "@/lib/mercadolivre/store";
import type { MercadoLivreConfig } from "@/lib/mercadolivre/types";
import type { FunctionRequest, FunctionResponse, MercadoLivreRuntime } from "@/lib/mercadolivre/http";

const config: MercadoLivreConfig = {
  clientId: "client-id",
  clientSecret: "server-secret",
  redirectUri: "https://calculadora.memoriaapps.site/api/mercadolivre/callback",
  frontendOrigin: "https://app.vercel.app",
  siteId: "MLB",
};

function runtime(): MercadoLivreRuntime {
  return { config, store: createMemoryStore() };
}

function request(overrides: Partial<FunctionRequest> = {}): FunctionRequest {
  return { method: "GET", headers: {}, query: {}, ...overrides };
}

function response(): FunctionResponse & { statusCode: number; body: unknown; headers: Record<string, unknown> } {
  const result = {
    statusCode: 200,
    body: undefined as unknown,
    headers: {} as Record<string, unknown>,
    status(code: number) {
      result.statusCode = code;
      return result;
    },
    json(body: unknown) {
      result.body = body;
      return result;
    },
    redirect(location: string) {
      result.statusCode = 302;
      result.headers.location = location;
      return result;
    },
    setHeader(name: string, value: string | number) {
      result.headers[name.toLowerCase()] = value;
      return result;
    },
    end() {
      return result;
    },
  };
  return result;
}

describe("handlers Mercado Livre", () => {
  it("responde preflight somente para a origem configurada", async () => {
    const res = response();
    await feesHandler(
      request({ method: "OPTIONS", headers: { origin: config.frontendOrigin } }),
      res,
      runtime(),
    );

    expect(res.statusCode).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe(config.frontendOrigin);
  });

  it("bloqueia origem externa", async () => {
    const res = response();
    await feesHandler(request({ method: "OPTIONS", headers: { origin: "https://evil.example" } }), res, runtime());
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: "Origem não permitida" });
  });

  it("informa desconectado sem vazar tokens", async () => {
    const res = response();
    await statusHandler(request(), res, runtime());
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ connected: false });
    expect(JSON.stringify(res.body)).not.toMatch(/token/i);
  });

  it("rejeita fees sem body ou conexão", async () => {
    const res = response();
    await feesHandler(request({ method: "POST", body: null }), res, runtime());
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Body inválido" });
  });

  it("inicia OAuth por redirect sem incluir segredo", async () => {
    const res = response();
    await authHandler(
      request({ query: { returnTo: "https://app.vercel.app/produtos/detalhe" } }),
      res,
      runtime(),
    );
    expect(res.statusCode).toBe(302);
    expect(String(res.headers.location)).toContain("auth.mercadolivre.com.br");
    expect(String(res.headers.location)).not.toContain(config.clientSecret);
  });
});
