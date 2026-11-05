# baum

Finanças pessoais sem mistério. PWA (instala no celular e no PC), modo claro e escuro, dados 100% no seu aparelho.

> *baum* = árvore em alemão. Dinheiro que cresce com raiz.

## O que faz

- **Início**: saldo somado de todas as contas, entrou/saiu no mês, previsão de saldo no fim do mês (com cenário dos gastos “talvez”), próximos vencimentos e limites por categoria.
- **Contas e cartões**: várias contas, cartão (fatura entra negativa), reserva, dinheiro. Saldo calculado sozinho a partir dos lançamentos.
- **Extrato**: busca, filtros por conta, categoria e tipo, agrupado por dia. Cada lançamento tem “onde”, categoria, conta e uma nota de **por que** você gastou.
- **Planos**
  - *Fixos*: aluguel, assinaturas, salário. Marca pago/recebido por mês, mostra atrasados e quanto da renda fixa está comprometido.
  - *Planejados*: gastos futuros com certeza ou “talvez”. Vira gasto real com um toque, ou marca que não rolou.
  - *Desejos*: lista de desejo com prioridade e cofrinho por item.
- **Análise**: gasto por dia, por categoria, por conta, últimos 6 meses e **onde você gastou**: total, quantas vezes no mês e ticket médio por estabelecimento.
- **Importar extrato** OFX (Nubank, Inter, Itaú, BB, C6...) ou CSV, com categorização automática que aprende com você e ignora duplicados.
- Acessibilidade: texto grande, esconder valores, navegação por teclado, `prefers-reduced-motion`.
- Backup/restauração em JSON.

### Sobre conectar bancos automaticamente

Puxar dados direto dos bancos (Open Finance Brasil) exige um backend e um agregador autorizado. Isso não está implementado: hoje o app funciona offline e você importa o extrato OFX/CSV. O parser e o modelo de dados (`externalId` para deduplicar) já estão prontos pra receber uma integração no futuro.

## Stack

React 18 + Vite, CSS puro com design tokens (`src/styles.css`), zero lib de UI. Lógica isolada em `src/lib` e testada com Vitest.

```
src/
  lib/          # dados, cálculos, importadores (sem React, exceto store.jsx)
  components/   # Icon, Sheet, Money, MonthSwitcher, TxRow, ui
  screens/      # Home, Statement, Plans, Insights, Settings, Onboarding
    forms/      # sheets de criar/editar
tests/          # vitest
```

## Rodando

```bash
npm install
npm run dev
```

```bash
npm test
```

```bash
npm run build
```

O build sai em `dist/` com caminhos relativos, então funciona no GitHub Pages ou qualquer hospedagem estática.
