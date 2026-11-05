import { PIN } from "../config.js";

const COMMON = new Set(["123456", "654321", "123123", "121212", "112233", "123321", "102030", "147258", "159753", "000123", "12345678", "87654321", "11223344", "1234567890"]);

/** Retorna um problema do PIN, ou "" se estiver ok. */
export function pinProblem(pin) {
  if (!/^\d+$/.test(pin) || pin.length < PIN.min || pin.length > PIN.max) return `O PIN precisa ter de ${PIN.min} a ${PIN.max} números.`;
  if (/^(\d)\1+$/.test(pin)) return "Evite repetir o mesmo número.";
  const asc = "01234567890123456789", desc = "98765432109876543210";
  if (asc.includes(pin) || desc.includes(pin) || COMMON.has(pin)) return "Esse PIN é muito fácil de adivinhar.";
  if (/^(19|20)\d{2}$/.test(pin.slice(-4)) && pin.length === 8 && /^(0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])/.test(pin)) return "Evite usar datas, como aniversários.";
  return "";
}
