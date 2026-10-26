import { Router } from 'express';
import { and, asc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db.js';
import { categories, expenses, incomes } from '../db/schema.js';

export const categoriesRouter = Router();

categoriesRouter.get('/', async (req, res, next) => {
  try {
    const kind = req.query.kind;
    const rows =
      kind === 'expense' || kind === 'income'
        ? await db
            .select({
              id: categories.id,
              name: categories.name,
              kind: categories.kind,
            })
            .from(categories)
            .where(
              and(eq(categories.userId, req.user!.id), eq(categories.kind, kind))
            )
            .orderBy(asc(categories.name))
        : await db
            .select({
              id: categories.id,
              name: categories.name,
              kind: categories.kind,
            })
            .from(categories)
            .where(eq(categories.userId, req.user!.id))
            .orderBy(asc(categories.kind), asc(categories.name));

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

categoriesRouter.post('/', async (req, res, next) => {
  try {
    const parsed = z
      .object({
        name: z.string().trim().min(1, 'Name the category.').max(60),
        kind: z.enum(['expense', 'income']),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const [existing] = await db
      .select({
        id: categories.id,
        name: categories.name,
        kind: categories.kind,
      })
      .from(categories)
      .where(
        and(
          eq(categories.userId, req.user!.id),
          eq(categories.kind, parsed.data.kind),
          sql`lower(${categories.name}) = lower(${parsed.data.name})`
        )
      )
      .limit(1);

    // Adding a category you already have is not an error worth blocking a
    // form submit over — hand back the existing one.
    if (existing) return res.status(200).json(existing);

    const [created] = await db
      .insert(categories)
      .values({
        userId: req.user!.id,
        name: parsed.data.name,
        kind: parsed.data.kind,
      })
      .returning({
        id: categories.id,
        name: categories.name,
        kind: categories.kind,
      });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

categoriesRouter.delete('/:id', async (req, res, next) => {
  try {
    const categoryId = Number(req.params.id);

    const expenseUse = await db
      .select({ id: expenses.id })
      .from(expenses)
      .where(eq(expenses.categoryId, categoryId))
      .limit(1);

    const incomeUse =
      expenseUse.length === 0
        ? await db
            .select({ id: incomes.id })
            .from(incomes)
            .where(eq(incomes.categoryId, categoryId))
            .limit(1)
        : [];

    if (expenseUse.length > 0 || incomeUse.length > 0) {
      return res
        .status(409)
        .json({ error: 'This category is used by existing entries.' });
    }

    const [deleted] = await db
      .delete(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.userId, req.user!.id)
        )
      )
      .returning({ id: categories.id });

    if (!deleted) return res.status(404).json({ error: 'Category not found.' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
