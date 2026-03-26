const now = new Date();
const m = now.getMonth();
const y = now.getFullYear();

export const SEED = {
  fixed: [
    { id: 1, name: "Aluguel",  value: 800,  category: "Moradia",    active: true },
    { id: 2, name: "Internet", value: 110,  category: "Moradia",    active: true },
    { id: 3, name: "Spotify",  value: 21.9, category: "Streaming",  active: true },
    { id: 4, name: "Academia", value: 80,   category: "Saude",      active: true },
  ],
  variable: [
    { id: 1, name: "Mercado", value: 250, category: "Alimentacao", month: m, year: y },
    { id: 2, name: "Uber",    value: 45,  category: "Transporte",  month: m, year: y },
  ],
  bills: [
    { id: 1, name: "Nubank",  month: m,     year: y, value: 320, paid: false },
    { id: 2, name: "Nubank",  month: m + 1, year: y, value: 420, paid: false },
    { id: 3, name: "C6 Bank", month: m,     year: y, value: 180, paid: true  },
  ],
  income: [
    { id: 1, name: "Estagio PBH", value: 1500 },
  ],
  goal: 400,
};

export const MS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
export const TABS = ["Geral","Fixos","Variaveis","Faturas","Renda"];
export const fmt = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
