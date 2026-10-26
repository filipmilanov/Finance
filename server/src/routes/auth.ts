import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db.js';
import { accounts, categories, users } from '../db/schema.js';
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

const DEFAULT_INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Gift',
  'Refund',
  'Interest',
];

const registerSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter your name.').max(120),
  username: z
    .string()
    .trim()
    .min(3, 'Username needs at least 3 characters.')
    .max(40)
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      'Use letters, numbers, dots, dashes or underscores.'
    ),
  password: z.string().min(6, 'Password needs at least 6 characters.').max(200),
});

authRouter.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { fullName, username, password } = parsed.data;

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.username}) = lower(${username})`)
      .limit(1);

    if (existing) {
      return res
        .status(409)
        .json({ error: 'That username is taken. Pick another.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(users)
        .values({ fullName, username, passwordHash })
        .returning({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
        });

      // Give every new account a starting Cash account and a usable set of
      // categories, so the first expense can be logged without setup.
      await tx.insert(accounts).values({
        userId: created.id,
        name: 'Cash',
        kind: 'cash',
        currency: 'EUR',
        openingBalance: 0,
      });

      for (const name of DEFAULT_EXPENSE_CATEGORIES) {
        await tx.insert(categories).values({
          userId: created.id,
          name,
          kind: 'expense',
        });
      }
      for (const name of DEFAULT_INCOME_CATEGORIES) {
        await tx.insert(categories).values({
          userId: created.id,
          name,
          kind: 'income',
        });
      }

      return created;
    });

    const authUser = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
    };
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
      return res
        .status(400)
        .json({ error: 'Enter your username and password.' });
    }

    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(sql`lower(${users.username}) = lower(${parsed.data.username})`)
      .limit(1);

    const ok = user
      ? await bcrypt.compare(parsed.data.password, user.passwordHash)
      : false;
    if (!user || !ok) {
      return res
        .status(401)
        .json({ error: 'That username and password do not match.' });
    }

    const authUser = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
    };
    res.json({ token: signToken(authUser), user: authUser });
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});
