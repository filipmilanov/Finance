/**
 * Creates a demo user with a few months of accounts, expenses and income so
 * the dashboard has something to show. Safe to re-run: it reuses the login if
 * the user already exists.
 *
 *   npm run seed
 */
const API = process.env.API ?? 'http://localhost:4000/api';
const CREDENTIALS = { fullName: 'Filip Milanov', username: 'filip', password: 'verdant123' };

async function call(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${method} ${path} → ${response.status}: ${payload?.error}`);
  return payload;
}

/** `daysAgo(40)` → the YYYY-MM-DD date 40 days back. */
function daysAgo(n) {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().slice(0, 10);
}

const session =
  (await call('/auth/register', { method: 'POST', body: CREDENTIALS }).catch(() => null)) ??
  (await call('/auth/login', {
    method: 'POST',
    body: { username: CREDENTIALS.username, password: CREDENTIALS.password },
  }));

const token = session.token;
console.log(`Signed in as ${session.user.username}`);

const existing = await call('/accounts', { token });
if (existing.some((a) => a.name !== 'Cash')) {
  console.log('Demo data already present. Nothing to do.');
  process.exit(0);
}

const cash = existing.find((a) => a.name === 'Cash');
await call(`/accounts/${cash.id}`, {
  method: 'PUT',
  token,
  body: { name: 'Cash', kind: 'cash', currency: 'EUR', openingBalance: 250 },
});

for (const account of [
  { name: 'Everyday card', kind: 'card', currency: 'EUR', openingBalance: 1840 },
  { name: 'Savings', kind: 'savings', currency: 'EUR', openingBalance: 6200 },
]) {
  await call('/accounts', { method: 'POST', token, body: account });
}

const accounts = await call('/accounts', { token });
const byName = Object.fromEntries(accounts.map((a) => [a.name, a.id]));

const expenseCats = await call('/categories?kind=expense', { token });
const incomeCats = await call('/categories?kind=income', { token });
const cat = (list, name) => list.find((c) => c.name === name).id;

const expenses = [
  ['Groceries', 'Germany', 3, 74.2, 'Cash', 'Weekly shop'],
  ['Car', 'Germany', 5, 62.0, 'Everyday card', 'Fuel'],
  ['Eating out', 'Germany', 6, 38.5, 'Everyday card', 'Dinner with Ana'],
  ['Laundry', 'Germany', 9, 12.0, 'Cash', ''],
  ['Groceries', 'Germany', 11, 91.35, 'Everyday card', ''],
  ['Rent', 'Germany', 14, 950.0, 'Everyday card', 'September'],
  ['Utilities', 'Germany', 16, 118.4, 'Everyday card', 'Electricity and internet'],
  ['Travel', 'Netherlands', 22, 240.0, 'Everyday card', 'Weekend in Utrecht'],
  ['Eating out', 'Netherlands', 23, 56.8, 'Cash', ''],
  ['Car', 'Germany', 34, 210.0, 'Everyday card', 'Winter tyres'],
  ['Groceries', 'Germany', 41, 82.1, 'Everyday card', ''],
  ['Rent', 'Germany', 45, 950.0, 'Everyday card', 'August'],
  ['Health', 'Germany', 52, 45.0, 'Cash', 'Dentist'],
  ['Groceries', 'Germany', 68, 77.9, 'Everyday card', ''],
  ['Rent', 'Germany', 76, 950.0, 'Everyday card', 'July'],
  ['Travel', 'Italy', 88, 620.0, 'Everyday card', 'Flights and hotel'],
];

for (const [category, country, ago, amount, account, comment] of expenses) {
  await call('/expenses', {
    method: 'POST',
    token,
    body: {
      date: daysAgo(ago),
      country,
      amount,
      accountId: byName[account],
      categoryId: cat(expenseCats, category),
      comment,
    },
  });
}

const incomes = [
  ['Salary', 'Nordwind GmbH', 2, 3200, 'Everyday card', 'September pay'],
  ['Freelance', 'Studio Vell', 12, 640, 'Everyday card', 'Landing page build'],
  ['Salary', 'Nordwind GmbH', 33, 3200, 'Everyday card', 'August pay'],
  ['Refund', 'Airline', 40, 128.5, 'Everyday card', 'Cancelled leg'],
  ['Salary', 'Nordwind GmbH', 63, 3200, 'Everyday card', 'July pay'],
  ['Interest', 'Bank', 65, 21.4, 'Savings', ''],
  ['Salary', 'Nordwind GmbH', 94, 3200, 'Everyday card', 'June pay'],
  ['Gift', 'Family', 100, 200, 'Cash', 'Birthday'],
];

for (const [category, from, ago, amount, account, comment] of incomes) {
  await call('/incomes', {
    method: 'POST',
    token,
    body: {
      date: daysAgo(ago),
      from,
      amount,
      accountId: byName[account],
      categoryId: cat(incomeCats, category),
      comment,
    },
  });
}

const dashboard = await call('/dashboard', { token });
console.log(`Seeded. Net worth: ${dashboard.netWorth.toFixed(2)} EUR`);
console.log(`Sign in with ${CREDENTIALS.username} / ${CREDENTIALS.password}`);
