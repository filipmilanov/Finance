# MyFi Web

Client for **MyFi**, a personal finance app. Users sign in against the API, manage accounts and ledger entries (income/expense), and track cash movements between accounts. The UI is a React single-page application built with **Vite**, **TypeScript**, **Material UI (MUI)**, and **MUI X Data Grid**.

## Requirements

- Node.js 18+
- The [Finance API](../server) running (default `http://localhost:4000`)

## Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `http://localhost:5173` (proxies `/api` to the backend) |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript project references check only |

Optional env (project root): `API_PROXY_TARGET` overrides the Vite proxy target (see `vite.config.ts`).

## High-level architecture

```
main.tsx
  └── BrowserRouter
        └── ThemeProvider (MUI theme, light/dark)
              └── AuthProvider (JWT in localStorage)
                    └── App
                          ├── Login (unauthenticated)
                          └── AppLayout + AppRoutes (authenticated)
```

- **Shell**: `AppLayout` provides the left sidebar (`AppSidebar`), top bar on small screens, and a main content area.
- **Routes**: `AppRoutes` maps URL paths to **page** components under `src/pages/`. Pages stay thin; heavy logic lives in **features** and **utils**.
- **API**: `src/services/api.ts` calls `/api/*` with the bearer token. Vite dev server proxies those requests to the backend.
- **Browser-only data**: Cash movements, some catalogs, custom transaction columns, and grid column/filter preferences use `localStorage` (see `src/utils/transactionLocal.ts` and related modules).

## Source layout

```
web/
├── public/              # Static assets (e.g. logo.svg)
├── index.html           # Vite entry HTML
├── vite.config.ts
├── package.json
└── src/
    ├── main.tsx         # React root, providers
    ├── App.tsx          # Auth gate → Login or layout + routes
    ├── routes/          # React Router route table
    ├── pages/           # One component per screen (composition only)
    ├── features/        # Domain UI + hooks (transactions, settings)
    ├── components/      # Shared layout + reusable UI
    │   ├── layout/      # AppLayout, AppSidebar
    │   └── common/      # FormDialog, Loading, Logo, EmptyState, …
    ├── context/         # AuthContext, ThemeContext
    ├── services/        # HTTP client (api.ts)
    ├── types/           # Shared TypeScript models
    ├── styles/          # MUI theme + shared styled primitives
    └── utils/           # Pure helpers, catalogs, local persistence
```

### `src/pages/`

Route-facing screens. They wire layout, call hooks, and pass props into feature components.

| File | Route | Role |
|------|-------|------|
| `Home.tsx` | `/` | Landing / summary |
| `Accounts.tsx` | `/accounts` | Account cards, balances (ledger + local cashflow) |
| `Transactions.tsx` | `/transactions`, `/transactions/:view` | Transaction tabs + grid + form (via `useTransactionsPage`) |
| `Dashboard.tsx` | `/analysis` | Analysis placeholder / charts |
| `Settings.tsx` | `/settings` | Categories, purposes, cash movement catalogs |
| `Login.tsx` | (no route; shown when logged out) | Sign-in |

Page-specific styling may live beside the page (e.g. `Accounts.styles.ts`, `Login.styles.ts`).

### `src/features/`

Feature folders group UI and state for one area of the product. Not every feature is routed directly; pages import from here.

**`features/transactions/`** — largest feature:

| Area | Files | Responsibility |
|------|--------|----------------|
| Page controller | `useTransactionsPage.ts` | Loads rows, accounts, categories, form state, save/delete, custom columns |
| Grid | `TransactionsDataGrid.tsx`, `applyTransactionGridFilters.ts`, `TransactionsFilterPanel.tsx` | MUI Data Grid, columns per tab (`all` / `expenses` / `income` / `cash`), filters |
| Form | `TransactionFormDialog.tsx`, `draft.ts`, `types.ts`, `TransactionKindPicker.tsx`, … | Add/edit expense, income, cash |
| Cash UX | Uses `utils/cashMovementValidation.ts` | “Not me”, balance checks for initiator/receiver |
| Custom fields | `TransactionFormCustomColumns.tsx`, `CustomFieldValueInput.tsx` | Extra columns (expense/income, stored locally) |

**`features/settings/`** — Settings tabs for server-backed categories and browser-backed catalogs (`SettingsCatalogSection.tsx`, `CatalogNameList.tsx`).

### `src/components/`

- **`layout/`** — `AppLayout`, `AppSidebar` and their `.styles.ts` files (sidebar width, responsive drawer).
- **`common/`** — Cross-page building blocks: `FormDialog`, `Loading`, `Logo`, `EmptyState`, `AlertSlot`, etc.

Prefer adding shared UI here rather than duplicating MUI patterns on each page.

### `src/context/`

- **`AuthContext`** — Login/logout, current user, JWT via `tokenStore` in `services/api.ts`.
- **`ThemeContext`** — Light/dark mode; drives `createAppTheme` in `styles/createAppTheme.ts`.

### `src/services/`

- **`api.ts`** — `api()`, query helpers, `sessionExpired` event on 401.

All server-backed entities (accounts, expenses, incomes, categories from API) go through this module.

### `src/types/`

Shared TypeScript types: `Account`, `Transaction`, `Entry`, `CustomFieldDefinition`, `TransactionView`, etc. Feature-specific draft types may also live under `features/transactions/types.ts`.

### `src/styles/`

- **`createAppTheme.ts`** — MUI theme (palette, `theme.app.*` tokens like `sunken`).
- **`fonts.ts`** — Font family constants.
- **`shared.styles.ts`** — Styled layout primitives (`FormGrid`, `Amount`, `CategoryChip`, `PageTitle`, …) used across pages and features.

### `src/utils/`

Stateless logic and browser storage. No React.

| Module | Purpose |
|--------|---------|
| `transactionLocal.ts` | Cash movements, custom field defs/values, merge with API entries into `Transaction` |
| `accountStats.ts` | Per-account cashflow from local movements; display balance on Accounts |
| `cashMovementCatalog.ts` | Cash movement types/subtypes (localStorage) |
| `expensePurposeCatalog.ts` | Expense purposes (localStorage prototype) |
| `cashMovementValidation.ts` | “Not me”, feasibility checks for cash form |
| `catalogGaps.ts` | Detect missing setup; deep-link to Settings tabs |
| `catalogEvents.ts` | `window` event when catalogs change |
| `format.ts` | Money, dates, currency symbols |
| `localStorageJson.ts` | Safe JSON read/write for catalog keys |

## Routing

Defined in `routes/AppRoutes.tsx`:

| Path | Page |
|------|------|
| `/` | Home |
| `/accounts` | Accounts |
| `/transactions` | Transactions (default tab) |
| `/transactions/expenses` | Expenses-only grid |
| `/transactions/income` | Income-only grid |
| `/transactions/cash` | Cash movements only |
| `/analysis` | Dashboard |
| `/settings` | Settings |
| `*` | Redirect to `/` |

The transactions hook reads `:view` from the URL and syncs the tab control (`TransactionsViewTabs`).

## Data: server vs browser

| Data | Storage |
|------|---------|
| User, accounts, expenses, incomes, API categories | PostgreSQL via API |
| Cash movements | `localStorage` (`myfi:cashMovements`) |
| Expense purposes (prototype) | `localStorage` |
| Cash movement types/subtypes | `localStorage` |
| Custom column definitions & cell values (expense/income) | `localStorage` |
| Grid column visibility & filters (per tab) | `localStorage` |
| Auth token | `localStorage` (`myfi-token`) |

The Transactions screen **merges** API ledger rows and local cash rows into one `Transaction[]`, then sorts (newest date, then id) for the grid.

## Transactions flow (reference)

1. `Transactions.tsx` calls `useTransactionsPage()`.
2. Hook fetches expenses/incomes/cash according to the active **view**, merges and sorts.
3. `TransactionsDataGrid` builds row models, applies filters, column visibility, and sorting (date + `recordSeq`).
4. **Add/Edit** opens `TransactionFormDialog` with draft state from the hook; save posts to API or updates local cash storage, then `loadRows()`.

Cash tab columns include **From** / **To**; those columns exist only on the cash grid, not on **All**.

## Theming and branding

- App name **MyFi**; logo from `public/logo.svg` via `components/common/Logo.tsx`.
- Theme tokens (including `app.sunken` for subtle panels) live in `styles/createAppTheme.ts`.
- User-chosen light/dark mode persists through `ThemeContext`.

## Conventions for new work

1. **New screen** → add a page under `pages/`, register in `AppRoutes.tsx`, add a sidebar link in `AppSidebar.tsx` if needed.
2. **Substantial domain logic** → `features/<name>/` with a hook or small components; keep the page as a thin shell.
3. **Reusable UI** → `components/common/` or `styles/shared.styles.ts`.
4. **API types** → extend `types/index.ts`; keep fetch logic in `services/api.ts`.
5. **Browser-only persistence** → follow `localStorageJson.ts` and namespaced keys (`myfi:*`).

## Related

- Backend API and database: [`../server`](../server)
- Full-stack repo root: [`..`](../)