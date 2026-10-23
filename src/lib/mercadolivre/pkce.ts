import { createHash, randomBytes } from "node:crypto";

export function randomOpaqueValue(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function createPkcePair(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = randomOpaqueValue(48);
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
  return { codeVerifier, codeChallenge };
}
