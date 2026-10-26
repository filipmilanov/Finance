import {
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  fullName: text('full_name').notNull(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const accounts = pgTable(
  'accounts',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    kind: text('kind').notNull().default('cash'),
    currency: text('currency').notNull().default('EUR'),
    openingBalance: numeric('opening_balance', {
      precision: 14,
      scale: 2,
      mode: 'number',
    })
      .notNull()
      .default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('accounts_user_id_name_key').on(table.userId, table.name),
    check(
      'accounts_kind_check',
      sql`${table.kind} IN ('cash', 'bank', 'card', 'savings')`
    ),
  ]
);

export const categories = pgTable(
  'categories',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    kind: text('kind').notNull(),
  },
  (table) => [
    unique('categories_user_id_kind_name_key').on(
      table.userId,
      table.kind,
      table.name
    ),
    check(
      'categories_kind_check',
      sql`${table.kind} IN ('expense', 'income')`
    ),
  ]
);

export const expenses = pgTable(
  'expenses',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accountId: integer('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'restrict' }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    country: text('country').notNull().default(''),
    spentOn: date('spent_on').notNull(),
    amount: numeric('amount', { precision: 14, scale: 2, mode: 'number' })
      .notNull(),
    comment: text('comment').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('expenses_user_date_idx').on(table.userId, table.spentOn.desc()),
    index('expenses_account_idx').on(table.accountId),
    check('expenses_amount_check', sql`${table.amount} > 0`),
  ]
);

export const incomes = pgTable(
  'incomes',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accountId: integer('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'restrict' }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    sourceFrom: text('source_from').notNull().default(''),
    receivedOn: date('received_on').notNull(),
    amount: numeric('amount', { precision: 14, scale: 2, mode: 'number' })
      .notNull(),
    comment: text('comment').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('incomes_user_date_idx').on(table.userId, table.receivedOn.desc()),
    index('incomes_account_idx').on(table.accountId),
    check('incomes_amount_check', sql`${table.amount} > 0`),
  ]
);
