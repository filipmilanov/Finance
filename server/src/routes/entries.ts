import { Router } from 'express';
import { z } from 'zod';
import { one, query } from '../db.js';

/**
 * Expenses and incomes are the same shape apart from one text column and the
 * name of the date column, so both routers are built from one definition.
 */
type EntryConfig = {
  table: 'expenses' | 'incomes';
  dateColumn: 'spent_on' | 'received_on';
  /** The free-text column: `country` for expenses, `source_from` for incomes. */
  textColumn: 'country' | 'source_from';
  /** What the client calls that column. */
  textField: 'country' | 'from';
  categoryKind: 'expense' | 'income';
};

function buildEntryRouter(cfg: EntryConfig): Router {
  const router = Router();

  const selectSql = `
    SELECT
      t.id,
      to_char(t.${cfg.dateColumn}, 'YYYY-MM-DD') AS date,
      t.${cfg.textColumn}   AS "${cfg.textField}",
      t.amount,
      t.comment,
      t.account_id          AS "accountId",
      a.name                AS "accountName",
      a.currency            AS currency,
      t.category_id         AS "categoryId",
      c.name                AS "categoryName"
    FROM ${cfg.table} t
    JOIN accounts   a ON a.id = t.account_id
    JOIN categories c ON c.id = t.category_id
    WHERE t.user_id = $1
  `;

  // `country` and `from` are both accepted; only the one this table owns is
  // read, so the two routers can share a single schema.
  const bodySchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date.'),
    country: z.string().trim().max(80).optional(),
    from: z.string().trim().max(80).optional(),
    amount: z.coerce.number().positive('Amount must be more than zero.'),
    accountId: z.coerce.number().int().positive('Choose an account.'),
    categoryId: z.coerce.number().int().positive('Choose a category.'),
    comment: z.string().trim().max(500).optional(),
  });

  type EntryBody = z.infer<typeof bodySchema>;
  const textValue = (body: EntryBody) => body[cfg.textField] ?? '';

  /** Confirms the account and category belong to this user before writing. */
  async function assertOwnership(userId: number, accountId: number, categoryId: number) {
    const account = await one('SELECT id FROM accounts WHERE id = $1 AND user_id = $2', [
      accountId,
      userId,
    ]);
    if (!account) throw Object.assign(new Error('That account does not exist.'), { status: 400 });

    const category = await one(
      'SELECT id FROM categories WHERE id = $1 AND user_id = $2 AND kind = $3',
      [categoryId, userId, cfg.categoryKind],
    );
    if (!category) throw Object.assign(new Error('That category does not exist.'), { status: 400 });
  }

  router.get('/', async (req, res, next) => {
    try {
      const params: unknown[] = [req.user!.id];
      const filters: string[] = [];

      if (req.query.accountId) {
        params.push(req.query.accountId);
        filters.push(`t.account_id = $${params.length}`);
      }
      if (req.query.categoryId) {
        params.push(req.query.categoryId);
        filters.push(`t.category_id = $${params.length}`);
      }
      if (req.query.from) {
        params.push(req.query.from);
        filters.push(`t.${cfg.dateColumn} >= $${params.length}`);
      }
      if (req.query.to) {
        params.push(req.query.to);
        filters.push(`t.${cfg.dateColumn} <= $${params.length}`);
      }

      const where = filters.length ? ` AND ${filters.join(' AND ')}` : '';
      const rows = await query(
        `${selectSql}${where} ORDER BY t.${cfg.dateColumn} DESC, t.id DESC LIMIT 500`,
        params,
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }
      const body = parsed.data;
      await assertOwnership(req.user!.id, body.accountId, body.categoryId);

      const created = await one(
        `INSERT INTO ${cfg.table}
           (user_id, account_id, category_id, ${cfg.textColumn}, ${cfg.dateColumn}, amount, comment)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          req.user!.id,
          body.accountId,
          body.categoryId,
          textValue(body),
          body.date,
          body.amount,
          body.comment ?? '',
        ],
      );
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }
      const body = parsed.data;
      await assertOwnership(req.user!.id, body.accountId, body.categoryId);

      const updated = await one(
        `UPDATE ${cfg.table} SET
           account_id = $1, category_id = $2, ${cfg.textColumn} = $3,
           ${cfg.dateColumn} = $4, amount = $5, comment = $6
         WHERE id = $7 AND user_id = $8 RETURNING id`,
        [
          body.accountId,
          body.categoryId,
          textValue(body),
          body.date,
          body.amount,
          body.comment ?? '',
          req.params.id,
          req.user!.id,
        ],
      );
      if (!updated) return res.status(404).json({ error: 'Entry not found.' });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const deleted = await one(
        `DELETE FROM ${cfg.table} WHERE id = $1 AND user_id = $2 RETURNING id`,
        [req.params.id, req.user!.id],
      );
      if (!deleted) return res.status(404).json({ error: 'Entry not found.' });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export const expensesRouter = buildEntryRouter({
  table: 'expenses',
  dateColumn: 'spent_on',
  textColumn: 'country',
  textField: 'country',
  categoryKind: 'expense',
});

export const incomesRouter = buildEntryRouter({
  table: 'incomes',
  dateColumn: 'received_on',
  textColumn: 'source_from',
  textField: 'from',
  categoryKind: 'income',
});
