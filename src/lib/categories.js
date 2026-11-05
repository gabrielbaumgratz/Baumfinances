// Default categories. `keywords` power auto-categorization of imported statements.
export const DEFAULT_CATEGORIES = [
  { id: "mercado", name: "Mercado", icon: "cart", keywords: ["supermerc", "mercado", "atacad", "hortifruti", "padaria", "carrefour", "assai", "assaí", "epa", "verdemar", "bh supermercados", "pao de acucar"] },
  { id: "comida", name: "Comida fora", icon: "utensils", keywords: ["ifood", "restaurante", "lanchonete", "pizza", "burger", "bar ", "cafe", "café", "rappi", "mc donalds", "mcdonald", "outback", "subway", "acai", "açaí"] },
  { id: "transporte", name: "Transporte", icon: "car", keywords: ["uber", "99app", "99 ", "posto", "combust", "gasolina", "estacion", "pedagio", "pedágio", "metro", "onibus", "ônibus", "bhbus", "ipiranga", "shell"] },
  { id: "moradia", name: "Moradia", icon: "home", keywords: ["aluguel", "condominio", "condomínio", "iptu"] },
  { id: "contas", name: "Contas", icon: "zap", keywords: ["cemig", "copasa", "energia", "agua", "água", "internet", "vivo", "claro", "tim ", "oi "] },
  { id: "saude", name: "Saúde", icon: "pulse", keywords: ["farmacia", "farmácia", "drogaria", "araujo", "araújo", "droga raia", "academia", "smart fit", "smartfit", "unimed", "hospital", "clinica", "clínica", "dentista"] },
  { id: "assinaturas", name: "Assinaturas", icon: "repeat", keywords: ["spotify", "netflix", "disney", "prime video", "amazon prime", "youtube", "hbo", "max.com", "apple.com", "icloud", "google one", "chatgpt", "openai", "claude", "anthropic", "globoplay", "deezer"] },
  { id: "lazer", name: "Lazer", icon: "ticket", keywords: ["cinema", "ingresso", "show", "steam", "playstation", "xbox", "nintendo", "sympla"] },
  { id: "compras", name: "Compras", icon: "bag", keywords: ["shopee", "mercadolivre", "mercado livre", "amazon", "aliexpress", "shein", "magalu", "renner", "c&a", "riachuelo", "zara", "kabum"] },
  { id: "educacao", name: "Educação", icon: "book", keywords: ["puc", "faculdade", "curso", "udemy", "alura", "livraria", "escola"] },
  { id: "viagem", name: "Viagem", icon: "plane", keywords: ["latam", "gol ", "azul ", "airbnb", "booking", "hotel", "decolar", "123milhas"] },
  { id: "pessoal", name: "Cuidados", icon: "sparkle", keywords: ["barbearia", "salao", "salão", "cabelo", "estetica"] },
  { id: "presentes", name: "Presentes", icon: "gift", keywords: [] },
  { id: "renda", name: "Renda", icon: "briefcase", keywords: ["salario", "salário", "bolsa", "estagio", "estágio", "pagamento recebido", "rendimento"] },
  { id: "transferencias", name: "Transferências", icon: "swap", keywords: ["pix", "transferencia", "transferência", "ted ", "doc "] },
  { id: "outros", name: "Outros", icon: "dots", keywords: [] },
];

const strip = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Guess a category for a description/merchant.
 * 1) learn from history: same merchant already categorized by the user wins
 * 2) keyword match
 * 3) fallback: "renda" for positive amounts, "outros" otherwise
 */
export function guessCategory({ merchant = "", description = "", amount = 0 }, categories, history = []) {
  const m = strip(merchant);
  if (m) {
    const known = history.find((t) => t.merchant && strip(t.merchant) === m && t.categoryId);
    if (known && categories.some((c) => c.id === known.categoryId)) return known.categoryId;
  }
  const hay = ` ${strip(merchant)} ${strip(description)} `;
  for (const c of categories) {
    if (c.id === "transferencias") continue;
    if ((c.keywords || []).some((k) => hay.includes(strip(k)))) return c.id;
  }
  const transfer = categories.find((c) => c.id === "transferencias");
  if (transfer && transfer.keywords.some((k) => hay.includes(strip(k)))) return transfer.id;
  if (amount > 0 && categories.some((c) => c.id === "renda")) return "renda";
  return categories.some((c) => c.id === "outros") ? "outros" : categories[0]?.id;
}
