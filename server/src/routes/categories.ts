import { Router } from 'express';
import { z } from 'zod';
import { one, query } from '../db.js';

export const categoriesRouter = Router();

categoriesRouter.get('/', async (req, res, next) => {
  try {
    const kind = req.query.kind;
    const rows =
      kind === 'expense' || kind === 'income'
        ? await query(
            'SELECT id, name, kind FROM categories WHERE user_id = $1 AND kind = $2 ORDER BY name',
            [req.user!.id, kind],
          )
        : await query(
            'SELECT id, name, kind FROM categories WHERE user_id = $1 ORDER BY kind, name',
            [req.user!.id],
          );
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

    const existing = await one<{ id: number; name: string; kind: string }>(
      `SELECT id, name, kind FROM categories
       WHERE user_id = $1 AND kind = $2 AND lower(name) = lower($3)`,
      [req.user!.id, parsed.data.kind, parsed.data.name],
    );
    // Adding a category you already have is not an error worth blocking a
    // form submit over — hand back the existing one.
    if (existing) return res.status(200).json(existing);

    const created = await one(
      `INSERT INTO categories (user_id, name, kind) VALUES ($1, $2, $3)
       RETURNING id, name, kind`,
      [req.user!.id, parsed.data.name, parsed.data.kind],
    );
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

categoriesRouter.delete('/:id', async (req, res, next) => {
  try {
    const inUse = await one(
      `SELECT 1 FROM (
         SELECT category_id FROM expenses WHERE category_id = $1
         UNION ALL
         SELECT category_id FROM incomes  WHERE category_id = $1
       ) t LIMIT 1`,
      [req.params.id],
    );
    if (inUse) {
      return res.status(409).json({ error: 'This category is used by existing entries.' });
    }

    const deleted = await one(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user!.id],
    );
    if (!deleted) return res.status(404).json({ error: 'Category not found.' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
