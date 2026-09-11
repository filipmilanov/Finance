# Verdant

A personal finance tracker: accounts, expenses and income, with balances derived
from the ledger rather than stored.

- **Frontend** — Vite + React + TypeScript (`web/`)
- **Backend** — Node.js + Express + TypeScript (`server/`)
- **Database** — PostgreSQL 16, browsable in pgAdmin (`docker-compose.yml`)
- **Migrations** — node-pg-migrate

## Running it

You need Docker Desktop and Node 20+.

```bash
# 1. Postgres on :5432 and pgAdmin on :5050
docker compose up -d

# 2. API on :4000
cd server
npm install
npm run migrate      # creates the tables
npm run seed         # optional: a demo user with a few months of data
npm run dev

# 3. App on :5173
cd ../web
npm install
npm run dev
```

Open http://localhost:5173 and create an account, or sign in to the seeded one:

| Username | Password    |
| -------- | ----------- |
| `filip`  | `verdant123` |

### pgAdmin

http://localhost:5050 — sign in with `admin@verdant.local` / `admin`. The
**Verdant (local)** server is pre-registered; when it asks for the database
password, use `verdant`.

## Configuration

Every setting has a working default that matches `docker-compose.yml`, so no
`.env` is required. To override, create `server/.env`:

```
DATABASE_URL=postgres://verdant:verdant@localhost:5432/verdant
JWT_SECRET=a-long-random-string
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
```

One caveat: `dotenv` does not overwrite variables already exported in your
shell. If your shell exports `PORT`, that value wins over `.env`. (A `PORT` of
`0` is ignored, because Vite proxies to a fixed `:4000`.)

## How it works

### Data model

```
users ──┬── accounts ──┐
        ├── categories ┼── expenses   (country, spent_on, amount, comment)
        └──────────────┴── incomes    (source_from, received_on, amount, comment)
```

Every row is scoped to a `user_id`, and every write re-checks that the account
and category being referenced belong to the signed-in user.

**Balances are never stored.** An account's balance is computed on read as
`opening_balance + sum(incomes) - sum(expenses)`, so it cannot drift out of sync
with the entries that produced it. Deleting an account with transactions is
refused rather than silently orphaning them.

Registering seeds a `Cash` account plus everyday categories (Car, Laundry,
Groceries, Rent, …) so the first expense can be logged without setup. New
categories can be added from the entry form itself.

### API

| Method                 | Path                        | Notes                          |
| ---------------------- | --------------------------- | ------------------------------ |
| `POST`                 | `/api/auth/register`        | Returns a JWT                  |
| `POST`                 | `/api/auth/login`           | Returns a JWT                  |
| `GET`                  | `/api/auth/me`              |                                |
| `GET/POST/PUT/DELETE`  | `/api/accounts`             | Balances included on `GET`     |
| `GET/POST/DELETE`      | `/api/categories`           | `?kind=expense\|income`        |
| `GET/POST/PUT/DELETE`  | `/api/expenses`             | Filters: account, category, from, to |
| `GET/POST/PUT/DELETE`  | `/api/incomes`              | Same filters                   |
| `GET`                  | `/api/dashboard`            | Totals, 6-month series, recent |
| `GET`                  | `/api/health`               | Checks the DB connection       |

Passwords are hashed with bcrypt. The token is kept in `localStorage` and sent
as a `Bearer` header; a `401` drops the app back to the sign-in screen.

### Migrations

```bash
npm run migrate        # apply everything pending
npm run migrate:down   # roll back one
```

New migrations go in `server/migrations/` as `<timestamp>_<name>.js`, exporting
`up` and `down`.

## Design

Two themes off one set of tokens in `web/src/styles.css`: deep pine `#0E6B45` on
a green-tinted white, and a brighter `#35C98A` on near-black. In dark mode the
hero panel becomes a dark elevated surface lit by a green glow, rather than a
bright green fill that would overpower the page.

Type is Fraunces (figures and headings) over Instrument Sans (interface), with
tabular numerals everywhere money appears so columns line up. The logo is three
ledger bars whose tallest stroke grows a leaf.

## Screenshots

Puppeteer lives in the repo root (`npm install` there first).

```bash
node screenshot.mjs http://localhost:5173/ dashboard
node screenshot.mjs http://localhost:5173/expenses expenses --theme=dark --full
node screenshot.mjs http://localhost:5173/ login --logged-out
```

Output lands in `temporary screenshots/`. The script signs in as the seeded user
first, so authenticated pages render.

## Not built

- No transfers between accounts, and no multi-currency conversion — an account's
  balance is reported in its own currency, and dashboard totals add the raw
  numbers together. Add one account currency at a time, or extend the schema
  with rates.
- Categories can be created and deleted through the API, but the UI only offers
  creation (from the entry form).
