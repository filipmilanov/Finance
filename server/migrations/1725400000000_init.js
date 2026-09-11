/* eslint-disable camelcase */

export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE users (
      id            serial PRIMARY KEY,
      full_name     text NOT NULL,
      username      text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      created_at    timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE accounts (
      id              serial PRIMARY KEY,
      user_id         integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name            text NOT NULL,
      kind            text NOT NULL DEFAULT 'cash'
                        CHECK (kind IN ('cash', 'bank', 'card', 'savings')),
      currency        text NOT NULL DEFAULT 'EUR',
      opening_balance numeric(14,2) NOT NULL DEFAULT 0,
      created_at      timestamptz NOT NULL DEFAULT now(),
      UNIQUE (user_id, name)
    );

    CREATE TABLE categories (
      id      serial PRIMARY KEY,
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name    text NOT NULL,
      kind    text NOT NULL CHECK (kind IN ('expense', 'income')),
      UNIQUE (user_id, kind, name)
    );

    CREATE TABLE expenses (
      id          serial PRIMARY KEY,
      user_id     integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_id  integer NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
      category_id integer NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      country     text NOT NULL DEFAULT '',
      spent_on    date NOT NULL,
      amount      numeric(14,2) NOT NULL CHECK (amount > 0),
      comment     text NOT NULL DEFAULT '',
      created_at  timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE incomes (
      id          serial PRIMARY KEY,
      user_id     integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_id  integer NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
      category_id integer NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      source_from text NOT NULL DEFAULT '',
      received_on date NOT NULL,
      amount      numeric(14,2) NOT NULL CHECK (amount > 0),
      comment     text NOT NULL DEFAULT '',
      created_at  timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX expenses_user_date_idx ON expenses (user_id, spent_on DESC);
    CREATE INDEX incomes_user_date_idx  ON incomes  (user_id, received_on DESC);
    CREATE INDEX expenses_account_idx   ON expenses (account_id);
    CREATE INDEX incomes_account_idx    ON incomes  (account_id);
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS incomes;
    DROP TABLE IF EXISTS expenses;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS accounts;
    DROP TABLE IF EXISTS users;
  `);
};
