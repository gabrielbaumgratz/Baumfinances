import { APP } from "../config.js";
import { deriveKey, newSalt, open, seal, ITERATIONS } from "./vault.js";

export const FORMAT = "prumo-backup";
export const FORMAT_ENC = "prumo-backup-encrypted";

export async function buildBackup(state, password) {
  const meta = { app: APP.name, exportedAt: new Date().toISOString() };
  if (!password) return JSON.stringify({ format: FORMAT, ...meta, data: state }, null, 2);
  const salt = newSalt();
  const vault = await seal(await deriveKey(password, salt), salt, state, ITERATIONS);
  return JSON.stringify({ format: FORMAT_ENC, ...meta, vault });
}

/** Retorna { encrypted: true } se precisar de senha, ou { data } pronto para importar. */
export function inspectBackup(text) {
  const json = JSON.parse(text);
  if (json.format === FORMAT_ENC && json.vault?.ct) return { encrypted: true, json };
  if (json.format === FORMAT && json.data) return { data: json.data };
  if (Array.isArray(json.transactions)) return { data: json }; // formato antigo
  throw new Error("Arquivo não reconhecido");
}

export async function decryptBackup(json, password) {
  const v = json.vault;
  return open(await deriveKey(password, v.salt, v.iterations), v);
}
