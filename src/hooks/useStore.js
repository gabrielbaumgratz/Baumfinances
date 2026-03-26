import { useState, useEffect } from "react";
import { SEED } from "../data/seed";

export function useStore(key) {
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem("ft_" + key);
      return s ? JSON.parse(s) : SEED[key];
    } catch {
      return SEED[key];
    }
  });

  useEffect(() => {
    try { localStorage.setItem("ft_" + key, JSON.stringify(val)); } catch {}
  }, [val, key]);

  return [val, setVal];
}
