import { ACCESS_CONFIG } from "./config";

const UNLOCK_KEY = "mkt-calc:unlocked";

export function isUnlocked(): boolean {
  if (!ACCESS_CONFIG.enabled) return true;
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(UNLOCK_KEY) === ACCESS_CONFIG.version;
}

export function tryUnlock(password: string): boolean {
  if (password !== ACCESS_CONFIG.password) return false;
  window.localStorage.setItem(UNLOCK_KEY, ACCESS_CONFIG.version);
  return true;
}

export function lockThisDevice(): void {
  window.localStorage.removeItem(UNLOCK_KEY);
}
