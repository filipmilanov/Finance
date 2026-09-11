export type User = { id: number; username: string; fullName: string };

export type AccountKind = 'cash' | 'bank' | 'card' | 'savings';

export type Account = {
  id: number;
  name: string;
  kind: AccountKind;
  currency: string;
  openingBalance: number;
  incomeTotal: number;
  expenseTotal: number;
  balance: number;
};

export type Category = { id: number; name: string; kind: 'expense' | 'income' };

export type Entry = {
  id: number;
  date: string;
  amount: number;
  comment: string;
  accountId: number;
  accountName: string;
  currency: string;
  categoryId: number;
  categoryName: string;
  country?: string;
  from?: string;
};

export const ACCOUNT_KINDS: Array<{ value: AccountKind; label: string }> = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank account' },
  { value: 'card', label: 'Card' },
  { value: 'savings', label: 'Savings' },
];

/** Never show the stored enum value to a person. */
export function accountKindLabel(kind: AccountKind): string {
  return ACCOUNT_KINDS.find((k) => k.value === kind)?.label ?? kind;
}
