// Aplica tema e tamanho de texto antes da primeira pintura (evita piscar).
try {
  var p = JSON.parse(localStorage.getItem("prumo:prefs") || "{}");
  if (p.theme && p.theme !== "system") document.documentElement.setAttribute("data-theme", p.theme);
  if (p.bigText) document.documentElement.setAttribute("data-text", "big");
} catch (e) {}
