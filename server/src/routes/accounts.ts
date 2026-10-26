import { Router } from 'express';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db.js';
import { accounts, expenses, incomes } from '../db/schema.js';

export const accountsRouter = Router();

/**
 * An account's current balance is never stored — it is derived, so it can
 * never drift out of sync with the transactions that produced it.
 */
async function listAccountsWithBalances(userId: number) {
  const result = await db.execute<{
    id: number;
    name: string;
    kind: string;
    currency: string;
    openingBalance: number;
    incomeTotal: number;
    expenseTotal: number;
    balance: number;
  }>(sql`
    SELECT
      a.id,
      a.name,
      a.kind,
      a.currency,
      a.opening_balance                                            AS "openingBalance",
      COALESCE(i.total, 0)                                         AS "incomeTotal",
      COALESCE(e.total, 0)                                         AS "expenseTotal",
      a.opening_balance + COALESCE(i.total, 0) - COALESCE(e.total, 0) AS balance
    FROM accounts a
    LEFT JOIN (
      SELECT account_id, SUM(amount) AS total FROM incomes  WHERE user_id = ${userId} GROUP BY account_id
    ) i ON i.account_id = a.id
    LEFT JOIN (
      SELECT account_id, SUM(amount) AS total FROM expenses WHERE user_id = ${userId} GROUP BY account_id
    ) e ON e.account_id = a.id
    WHERE a.user_id = ${userId}
    ORDER BY a.created_at
  `);

  return result.rows;
}

const accountSchema = z.object({
  name: z.string().trim().min(1, 'Give the account a name.').max(80),
  kind: z.enum(['cash', 'bank', 'card', 'savings']),
  currency: z
    .string()
    .trim()
    .length(3, 'Use a 3-letter currency code.')
    .toUpperCase(),
  openingBalance: z.coerce.number().finite(),
});

accountsRouter.get('/', async (req, res, next) => {
  try {
    res.json(await listAccountsWithBalances(req.user!.id));
  } catch (err) {
    next(err);
  }
});

accountsRouter.post('/', async (req, res, next) => {
  try {
    const parsed = accountSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { name, kind, currency, openingBalance } = parsed.data;

    const duplicate = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(
        and(
          eq(accounts.userId, req.user!.id),
          sql`lower(${accounts.name}) = lower(${name})`
        )
      )
      .limit(1);

    if (duplicate.length > 0) {
      return res
        .status(409)
        .json({ error: `You already have an account called ${name}.` });
    }

    const [created] = await db
      .insert(accounts)
      .values({
        userId: req.user!.id,
        name,
        kind,
        currency,
        openingBalance,
      })
      .returning({ id: accounts.id });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

accountsRouter.put('/:id', async (req, res, next) => {
  try {
    const parsed = accountSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { name, kind, currency, openingBalance } = parsed.data;
    const accountId = Number(req.params.id);

    const [updated] = await db
      .update(accounts)
      .set({ name, kind, currency, openingBalance })
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, req.user!.id)))
      .returning({ id: accounts.id });

    if (!updated) return res.status(404).json({ error: 'Account not found.' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

accountsRouter.delete('/:id', async (req, res, next) => {
  try {
    const accountId = Number(req.params.id);

    const expenseUse = await db
      .select({ id: expenses.id })
      .from(expenses)
      .where(eq(expenses.accountId, accountId))
      .limit(1);

    const incomeUse =
      expenseUse.length === 0
        ? await db
            .select({ id: incomes.id })
            .from(incomes)
            .where(eq(incomes.accountId, accountId))
            .limit(1)
        : [];

    if (expenseUse.length > 0 || incomeUse.length > 0) {
      return res.status(409).json({
        error: 'This account has transactions. Move or delete them first.',
      });
    }

    const [deleted] = await db
      .delete(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, req.user!.id)))
      .returning({ id: accounts.id });

    if (!deleted) return res.status(404).json({ error: 'Account not found.' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
