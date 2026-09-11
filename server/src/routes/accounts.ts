import { Router } from 'express';
import { z } from 'zod';
import { one, query } from '../db.js';

export const accountsRouter = Router();

/**
 * An account's current balance is never stored — it is derived, so it can
 * never drift out of sync with the transactions that produced it.
 */
const BALANCE_SQL = `
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
    SELECT account_id, SUM(amount) AS total FROM incomes  WHERE user_id = $1 GROUP BY account_id
  ) i ON i.account_id = a.id
  LEFT JOIN (
    SELECT account_id, SUM(amount) AS total FROM expenses WHERE user_id = $1 GROUP BY account_id
  ) e ON e.account_id = a.id
  WHERE a.user_id = $1
  ORDER BY a.created_at
`;

const accountSchema = z.object({
  name: z.string().trim().min(1, 'Give the account a name.').max(80),
  kind: z.enum(['cash', 'bank', 'card', 'savings']),
  currency: z.string().trim().length(3, 'Use a 3-letter currency code.').toUpperCase(),
  openingBalance: z.coerce.number().finite(),
});

accountsRouter.get('/', async (req, res, next) => {
  try {
    res.json(await query(BALANCE_SQL, [req.user!.id]));
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

    const duplicate = await one(
      'SELECT id FROM accounts WHERE user_id = $1 AND lower(name) = lower($2)',
      [req.user!.id, name],
    );
    if (duplicate) {
      return res.status(409).json({ error: `You already have an account called ${name}.` });
    }

    const created = await one(
      `INSERT INTO accounts (user_id, name, kind, currency, opening_balance)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [req.user!.id, name, kind, currency, openingBalance],
    );
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

    const updated = await one(
      `UPDATE accounts SET name = $1, kind = $2, currency = $3, opening_balance = $4
       WHERE id = $5 AND user_id = $6 RETURNING id`,
      [name, kind, currency, openingBalance, req.params.id, req.user!.id],
    );
    if (!updated) return res.status(404).json({ error: 'Account not found.' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

accountsRouter.delete('/:id', async (req, res, next) => {
  try {
    const inUse = await one(
      `SELECT 1 FROM (
         SELECT account_id FROM expenses WHERE account_id = $1
         UNION ALL
         SELECT account_id FROM incomes  WHERE account_id = $1
       ) t LIMIT 1`,
      [req.params.id],
    );
    if (inUse) {
      return res.status(409).json({
        error: 'This account has transactions. Move or delete them first.',
      });
    }

    const deleted = await one('DELETE FROM accounts WHERE id = $1 AND user_id = $2 RETURNING id', [
      req.params.id,
      req.user!.id,
    ]);
    if (!deleted) return res.status(404).json({ error: 'Account not found.' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
