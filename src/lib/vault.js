// Criptografia local dos dados (AES-GCM 256, chave derivada do PIN com PBKDF2-SHA256).
// Nada sai do aparelho: a chave existe só na memória enquanto o app está desbloqueado.

// 600 mil iterações: recomendação atual da OWASP para PBKDF2-HMAC-SHA256.
export const ITERATIONS = 600000;
const enc = new TextEncoder();
const dec = new TextDecoder();

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export const cryptoAvailable = () => !!globalThis.crypto?.subtle;

export function newSalt() {
  return b64(crypto.getRandomValues(new Uint8Array(16)));
}

export async function deriveKey(pin, saltB64, iterations = ITERATIONS) {
  const base = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: unb64(saltB64), iterations, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function seal(key, salt, data, iterations = ITERATIONS) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(data)));
  return { v: 1, alg: "AES-GCM", kdf: "PBKDF2-SHA256", iterations, salt, iv: b64(iv), ct: b64(ct) };
}

/** Throws if the key is wrong (GCM authentication fails). */
export async function open(key, vault) {
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(vault.iv) }, key, unb64(vault.ct));
  return JSON.parse(dec.decode(pt));
}
