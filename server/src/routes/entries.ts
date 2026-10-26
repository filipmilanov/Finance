import { Router } from 'express';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db.js';
import { accounts, categories, expenses, incomes } from '../db/schema.js';

/**
 * Expenses and incomes are the same shape apart from one text column and the
 * name of the date column, so both routers are built from one definition.
 */
type EntryConfig = {
  tableName: 'expenses' | 'incomes';
  dateColumn: 'spent_on' | 'received_on';
  /** The free-text column: `country` for expenses, `source_from` for incomes. */
  textColumn: 'country' | 'source_from';
  /** What the client calls that column. */
  textField: 'country' | 'from';
  categoryKind: 'expense' | 'income';
};

function buildEntryRouter(cfg: EntryConfig): Router {
  const router = Router();

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
  async function assertOwnership(
    userId: number,
    accountId: number,
    categoryId: number
  ) {
    const [account] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
      .limit(1);

    if (!account) {
      throw Object.assign(new Error('That account does not exist.'), {
        status: 400,
      });
    }

    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.userId, userId),
          eq(categories.kind, cfg.categoryKind)
        )
      )
      .limit(1);

    if (!category) {
      throw Object.assign(new Error('That category does not exist.'), {
        status: 400,
      });
    }
  }

  router.get('/', async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const filters: ReturnType<typeof sql>[] = [sql`t.user_id = ${userId}`];

      if (req.query.accountId) {
        filters.push(sql`t.account_id = ${Number(req.query.accountId)}`);
      }
      if (req.query.categoryId) {
        filters.push(sql`t.category_id = ${Number(req.query.categoryId)}`);
      }
      if (req.query.from) {
        filters.push(sql`t.${sql.raw(cfg.dateColumn)} >= ${String(req.query.from)}`);
      }
      if (req.query.to) {
        filters.push(sql`t.${sql.raw(cfg.dateColumn)} <= ${String(req.query.to)}`);
      }

      const whereClause = sql.join(filters, sql` AND `);
      const textAlias = cfg.textField === 'from' ? 'from' : 'country';

      const result = await db.execute<{
        id: number;
        date: string;
        country?: string;
        from?: string;
        amount: number;
        comment: string;
        accountId: number;
        accountName: string;
        currency: string;
        categoryId: number;
        categoryName: string;
      }>(sql`
        SELECT
          t.id,
          to_char(t.${sql.raw(cfg.dateColumn)}, 'YYYY-MM-DD') AS date,
          t.${sql.raw(cfg.textColumn)}   AS ${sql.raw(`"${textAlias}"`)},
          t.amount,
          t.comment,
          t.account_id          AS "accountId",
          a.name                AS "accountName",
          a.currency            AS currency,
          t.category_id         AS "categoryId",
          c.name                AS "categoryName"
        FROM ${sql.raw(cfg.tableName)} t
        JOIN accounts   a ON a.id = t.account_id
        JOIN categories c ON c.id = t.category_id
        WHERE ${whereClause}
        ORDER BY t.${sql.raw(cfg.dateColumn)} DESC, t.id DESC
        LIMIT 500
      `);

      res.json(result.rows);
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

      const base = {
        userId: req.user!.id,
        accountId: body.accountId,
        categoryId: body.categoryId,
        amount: body.amount,
        comment: body.comment ?? '',
      };

      const [created] =
        cfg.tableName === 'expenses'
          ? await db
              .insert(expenses)
              .values({ ...base, country: textValue(body), spentOn: body.date })
              .returning({ id: expenses.id })
          : await db
              .insert(incomes)
              .values({
                ...base,
                sourceFrom: textValue(body),
                receivedOn: body.date,
              })
              .returning({ id: incomes.id });

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
      const entryId = Number(req.params.id);

      const [updated] =
        cfg.tableName === 'expenses'
          ? await db
              .update(expenses)
              .set({
                accountId: body.accountId,
                categoryId: body.categoryId,
                country: textValue(body),
                spentOn: body.date,
                amount: body.amount,
                comment: body.comment ?? '',
              })
              .where(
                and(eq(expenses.id, entryId), eq(expenses.userId, req.user!.id))
              )
              .returning({ id: expenses.id })
          : await db
              .update(incomes)
              .set({
                accountId: body.accountId,
                categoryId: body.categoryId,
                sourceFrom: textValue(body),
                receivedOn: body.date,
                amount: body.amount,
                comment: body.comment ?? '',
              })
              .where(
                and(eq(incomes.id, entryId), eq(incomes.userId, req.user!.id))
              )
              .returning({ id: incomes.id });

      if (!updated) return res.status(404).json({ error: 'Entry not found.' });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const entryId = Number(req.params.id);

      const [deleted] =
        cfg.tableName === 'expenses'
          ? await db
              .delete(expenses)
              .where(
                and(eq(expenses.id, entryId), eq(expenses.userId, req.user!.id))
              )
              .returning({ id: expenses.id })
          : await db
              .delete(incomes)
              .where(
                and(eq(incomes.id, entryId), eq(incomes.userId, req.user!.id))
              )
              .returning({ id: incomes.id });

      if (!deleted) return res.status(404).json({ error: 'Entry not found.' });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export const expensesRouter = buildEntryRouter({
  tableName: 'expenses',
  dateColumn: 'spent_on',
  textColumn: 'country',
  textField: 'country',
  categoryKind: 'expense',
});

export const incomesRouter = buildEntryRouter({
  tableName: 'incomes',
  dateColumn: 'received_on',
  textColumn: 'source_from',
  textField: 'from',
  categoryKind: 'income',
});
