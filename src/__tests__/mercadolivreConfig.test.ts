import { describe, expect, it } from "vitest";
import { loadMercadoLivreConfig } from "@/lib/mercadolivre/config";

const validEnv = {
  MERCADOLIVRE_CLIENT_ID: "8689029136462184",
  MERCADOLIVRE_CLIENT_SECRET: "server-only-secret",
  MERCADOLIVRE_REDIRECT_URI:
    "https://calculadora.memoriaapps.site/api/mercadolivre/callback",
  MERCADOLIVRE_FRONTEND_ORIGIN: "https://calculadora-marketplaces.vercel.app",
};

describe("loadMercadoLivreConfig", () => {
  it("carrega MLB por padrão e mantém o segredo server-side", () => {
    const config = loadMercadoLivreConfig(validEnv);

    expect(config.siteId).toBe("MLB");
    expect(config.clientId).toBe(validEnv.MERCADOLIVRE_CLIENT_ID);
    expect(config.clientSecret).toBe(validEnv.MERCADOLIVRE_CLIENT_SECRET);
  });

  it("rejeita configuração incompleta", () => {
    expect(() => loadMercadoLivreConfig({})).toThrow(/MERCADOLIVRE_CLIENT_ID/);
    expect(() =>
      loadMercadoLivreConfig({
        ...validEnv,
        MERCADOLIVRE_FRONTEND_ORIGIN: "ftp://origem-invalida.example",
      }),
    ).toThrow(/MERCADOLIVRE_FRONTEND_ORIGIN/);
  });
});
