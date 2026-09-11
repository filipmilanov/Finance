import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { one, transaction } from '../db.js';
import { requireAuth, signToken } from '../auth.js';

export const authRouter = Router();

const DEFAULT_EXPENSE_CATEGORIES = [
  'Car',
  'Laundry',
  'Groceries',
  'Rent',
  'Utilities',
  'Eating out',
  'Travel',
  'Health',
];

const DEFAULT_INCOME_CATEGORIES = ['Salary', 'Freelance', 'Gift', 'Refund', 'Interest'];

const registerSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter your name.').max(120),
  username: z
    .string()
    .trim()
    .min(3, 'Username needs at least 3 characters.')
    .max(40)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Use letters, numbers, dots, dashes or underscores.'),
  password: z.string().min(6, 'Password needs at least 6 characters.').max(200),
});

authRouter.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { fullName, username, password } = parsed.data;

    const existing = await one('SELECT id FROM users WHERE lower(username) = lower($1)', [
      username,
    ]);
    if (existing) {
      return res.status(409).json({ error: 'That username is taken. Pick another.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await transaction(async (client) => {
      const inserted = await client.query<{
        id: number;
        username: string;
        full_name: string;
      }>(
        `INSERT INTO users (full_name, username, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, username, full_name`,
        [fullName, username, passwordHash],
      );
      const created = inserted.rows[0];

      // Give every new account a starting Cash account and a usable set of
      // categories, so the first expense can be logged without setup.
      await client.query(
        `INSERT INTO accounts (user_id, name, kind, currency, opening_balance)
         VALUES ($1, 'Cash', 'cash', 'EUR', 0)`,
        [created.id],
      );

      for (const name of DEFAULT_EXPENSE_CATEGORIES) {
        await client.query(
          `INSERT INTO categories (user_id, name, kind) VALUES ($1, $2, 'expense')`,
          [created.id, name],
        );
      }
      for (const name of DEFAULT_INCOME_CATEGORIES) {
        await client.query(
          `INSERT INTO categories (user_id, name, kind) VALUES ($1, $2, 'income')`,
          [created.id, name],
        );
      }

      return created;
    });

    const authUser = { id: user.id, username: user.username, fullName: user.full_name };
    res.status(201).json({ token: signToken(authUser), user: authUser });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const schema = z.object({
      username: z.string().trim().min(1),
      password: z.string().min(1),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Enter your username and password.' });
    }

    const user = await one<{
      id: number;
      username: string;
      full_name: string;
      password_hash: string;
    }>(
      'SELECT id, username, full_name, password_hash FROM users WHERE lower(username) = lower($1)',
      [parsed.data.username],
    );

    const ok = user ? await bcrypt.compare(parsed.data.password, user.password_hash) : false;
    if (!user || !ok) {
      return res.status(401).json({ error: 'That username and password do not match.' });
    }

    const authUser = { id: user.id, username: user.username, fullName: user.full_name };
    res.json({ token: signToken(authUser), user: authUser });
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});
