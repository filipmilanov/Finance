import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { api, queryString } from '../lib/api';
import { currencySymbol, money, shortDate, today } from '../lib/format';
import { COUNTRIES } from '../lib/countries';
import type { Account, Category, Entry } from '../lib/types';
import { AlertSlot, EmptyState, FormDialog, Loading } from '../components/ui';
import {
  Amount,
  CategoryChip,
  FormActions,
  FormGrid,
  FormGridFull,
  Lede,
  PageHeader,
  PageTitle,
  RowActions,
} from '../theme/shared.styles';
import { LedgerRow, PaddedCard, TableCard } from './Accounts.styles';
import {
  CommentCell,
  FilterBar,
  FilterCount,
  FilterTotal,
  FilterValue,
} from './EntryPage.styles';

type EntryPageProps = {
  kind: 'expense' | 'income';
  path: '/expenses' | '/incomes';
  title: string;
  lede: string;
  /** Label and behaviour for the one column that differs between the two pages. */
  textField: { name: 'country' | 'from'; label: string; placeholder: string; suggest?: string[] };
  addLabel: string;
  emptyTitle: string;
  emptyHint: string;
};

type Draft = {
  date: string;
  amount: string;
  accountId: string;
  categoryId: string;
  comment: string;
  text: string;
};

const NEW_CATEGORY = '__new__';

function blankDraft(): Draft {
  return { date: today(), amount: '', accountId: '', categoryId: '', comment: '', text: '' };
}

export function EntryPage(props: EntryPageProps) {
  const { kind, path, textField } = props;

  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({ accountId: '', categoryId: '', from: '', to: '' });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [newCategory, setNewCategory] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const loadEntries = useCallback(() => {
    api<Entry[]>(`${path}${queryString(filters)}`)
      .then(setEntries)
      .catch((err) => setError(err.message));
  }, [path, filters]);

  useEffect(loadEntries, [loadEntries]);

  const loadLookups = useCallback(() => {
    Promise.all([api<Account[]>('/accounts'), api<Category[]>(`/categories?kind=${kind}`)])
      .then(([nextAccounts, nextCategories]) => {
        setAccounts(nextAccounts);
        setCategories(nextCategories);
      })
      .catch((err) => setError(err.message));
  }, [kind]);

  useEffect(loadLookups, [loadLookups]);

  const total = useMemo(
    () => (entries ?? []).reduce((sum, entry) => sum + Number(entry.amount), 0),
    [entries],
  );

  const currency = accounts[0]?.currency ?? 'EUR';
  // The form prefix follows the account being paid from, not the first account.
  const selectedCurrency =
    accounts.find((account) => String(account.id) === draft.accountId)?.currency ?? currency;

  function openNew() {
    setEditing(null);
    setDraft({
      ...blankDraft(),
      accountId: String(accounts[0]?.id ?? ''),
      categoryId: String(categories[0]?.id ?? ''),
    });
    setNewCategory('');
    setFormError('');
    setOpen(true);
  }

  function openEdit(entry: Entry) {
    setEditing(entry);
    setDraft({
      date: entry.date,
      amount: String(entry.amount),
      accountId: String(entry.accountId),
      categoryId: String(entry.categoryId),
      comment: entry.comment,
      text: (entry[textField.name] as string | undefined) ?? '',
    });
    setNewCategory('');
    setFormError('');
    setOpen(true);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      let categoryId = draft.categoryId;

      // A brand-new category is created on the way through, so the user never
      // has to leave this form to add one.
      if (categoryId === NEW_CATEGORY) {
        if (!newCategory.trim()) throw new Error('Name the new category.');
        const created = await api<Category>('/categories', {
          method: 'POST',
          body: { name: newCategory.trim(), kind },
        });
        categoryId = String(created.id);
        loadLookups();
      }

      const body = {
        date: draft.date,
        amount: Number(draft.amount),
        accountId: Number(draft.accountId),
        categoryId: Number(categoryId),
        comment: draft.comment,
        [textField.name]: draft.text,
      };

      if (editing) {
        await api(`${path}/${editing.id}`, { method: 'PUT', body });
      } else {
        await api(path, { method: 'POST', body });
      }

      setOpen(false);
      loadEntries();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save this entry.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(entry: Entry) {
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    try {
      await api(`${path}/${entry.id}`, { method: 'DELETE' });
      loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the entry.');
    }
  }

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!entries) return <Loading label={`Loading ${props.title.toLowerCase()}`} />;

  const noAccounts = accounts.length === 0;
  const flow = kind === 'expense' ? 'spend' : 'earn';

  return (
    <>
      <PageHeader>
        <div>
          <PageTitle component="h1">{props.title}</PageTitle>
          <Lede variant="body2">{props.lede}</Lede>
        </div>
        <Button
          variant="contained"
          onClick={openNew}
          disabled={noAccounts}
          title={noAccounts ? 'Add an account first' : undefined}
        >
          {props.addLabel}
        </Button>
      </PageHeader>

      {noAccounts && (
        <AlertSlot>
          <Alert severity="info">
            Add an account first — every entry has to be paid from one.
          </Alert>
        </AlertSlot>
      )}

      <Stack spacing={3}>
        <FilterBar>
          <TextField
            select
            label="Account"
            value={filters.accountId}
            onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
            size="small"
          >
            <MenuItem value="">All accounts</MenuItem>
            {accounts.map((account) => (
              <MenuItem key={account.id} value={String(account.id)}>
                {account.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Category"
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            size="small"
          >
            <MenuItem value="">All categories</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={String(category.id)}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="From"
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            label="To"
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <FilterTotal>
            <FilterCount>{entries.length} shown</FilterCount>
            <FilterValue flow={flow}>{money(total, currency)}</FilterValue>
          </FilterTotal>
        </FilterBar>

        {entries.length === 0 ? (
          <PaddedCard>
            <EmptyState
              title={props.emptyTitle}
              hint={props.emptyHint}
              action={
                !noAccounts && (
                  <Button variant="contained" onClick={openNew}>
                    {props.addLabel}
                  </Button>
                )
              }
            />
          </PaddedCard>
        ) : (
          <TableCard>
            <TableContainer>
              <Table>
                <TableHead>
                  <LedgerRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>{textField.label}</TableCell>
                    <TableCell>Account</TableCell>
                    <TableCell>Comment</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell />
                  </LedgerRow>
                </TableHead>
                <TableBody>
                  {entries.map((entry) => (
                    <LedgerRow key={entry.id} hover>
                      <TableCell>{shortDate(entry.date)}</TableCell>
                      <TableCell>
                        <CategoryChip
                          label={entry.categoryName}
                          size="small"
                          flow={kind === 'income' ? 'earn' : undefined}
                        />
                      </TableCell>
                      <TableCell>{(entry[textField.name] as string) || '—'}</TableCell>
                      <TableCell>{entry.accountName}</TableCell>
                      <TableCell>
                        <CommentCell>
                          <Typography variant="body2" color="text.secondary">
                            {entry.comment || '—'}
                          </Typography>
                        </CommentCell>
                      </TableCell>
                      <TableCell align="right">
                        <Amount component="span" flow={flow} strong>
                          {money(entry.amount, entry.currency)}
                        </Amount>
                      </TableCell>
                      <TableCell>
                        <RowActions>
                          <Button onClick={() => openEdit(entry)}>Edit</Button>
                          <Button color="error" onClick={() => remove(entry)}>
                            Delete
                          </Button>
                        </RowActions>
                      </TableCell>
                    </LedgerRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TableCard>
        )}
      </Stack>

      <FormDialog
        open={open}
        title={editing ? 'Edit entry' : props.addLabel}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={save}>
          {formError && (
            <AlertSlot>
              <Alert severity="error">{formError}</Alert>
            </AlertSlot>
          )}

          <FormGrid>
            <TextField
              label="Date"
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              size="small"
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="Amount"
              type="number"
              value={draft.amount}
              onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
              placeholder="0.00"
              size="small"
              required
              slotProps={{
                htmlInput: { step: '0.01', min: '0.01', 'data-autofocus': true },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      {currencySymbol(selectedCurrency)}
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              select
              label="Category"
              value={draft.categoryId}
              onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
              size="small"
              required
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={String(category.id)}>
                  {category.name}
                </MenuItem>
              ))}
              <MenuItem value={NEW_CATEGORY}>Add a new category…</MenuItem>
            </TextField>

            {draft.categoryId === NEW_CATEGORY && (
              <TextField
                label="New category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder={kind === 'expense' ? 'Parking' : 'Bonus'}
                size="small"
                required
              />
            )}

            <TextField
              select
              label="Account"
              value={draft.accountId}
              onChange={(e) => setDraft({ ...draft, accountId: e.target.value })}
              size="small"
              required
            >
              {accounts.map((account) => (
                <MenuItem key={account.id} value={String(account.id)}>
                  {account.name}
                </MenuItem>
              ))}
            </TextField>

            {textField.suggest ? (
              <Autocomplete
                freeSolo
                options={textField.suggest}
                value={draft.text}
                onInputChange={(_, value) => setDraft({ ...draft, text: value })}
                size="small"
                renderInput={(params) => (
                  <TextField {...params} label={textField.label} placeholder={textField.placeholder} />
                )}
              />
            ) : (
              <TextField
                label={textField.label}
                value={draft.text}
                onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                placeholder={textField.placeholder}
                size="small"
              />
            )}

            <FormGridFull>
              <TextField
                label="Comment"
                value={draft.comment}
                onChange={(e) => setDraft({ ...draft, comment: e.target.value })}
                placeholder="Anything you want to remember about this one"
                size="small"
                multiline
                minRows={3}
                fullWidth
              />
            </FormGridFull>
          </FormGrid>

          <FormActions>
            <Button type="submit" variant="contained" disabled={busy}>
              {busy ? 'Saving' : editing ? 'Save changes' : 'Save entry'}
            </Button>
            <Button variant="outlined" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </FormActions>
        </form>
      </FormDialog>
    </>
  );
}

type TransactionKind = 'expenses' | 'income';

const ENTRY_PAGE_PROPS: Record<TransactionKind, EntryPageProps> = {
  expenses: {
    kind: 'expense',
    path: '/expenses',
    title: 'Expenses',
    lede: 'Everything that left one of your accounts, and where it went.',
    textField: {
      name: 'country',
      label: 'Country',
      placeholder: 'Where you spent it',
      suggest: COUNTRIES,
    },
    addLabel: 'Add expense',
    emptyTitle: 'Nothing logged yet',
    emptyHint: 'Add your first expense to see it here, with the account it came out of.',
  },
  income: {
    kind: 'income',
    path: '/incomes',
    title: 'Income',
    lede: 'Everything that came in, and which account received it.',
    textField: { name: 'from', label: 'From', placeholder: 'Who paid you' },
    addLabel: 'Add income',
    emptyTitle: 'No income logged yet',
    emptyHint: 'Add a salary, a refund or anything else that landed in an account.',
  },
};

export function Transactions() {
  const { kind } = useParams<{ kind: string }>();
  const navigate = useNavigate();
  const active: TransactionKind = kind === 'income' ? 'income' : 'expenses';

  return (
    <>
      <Tabs
        value={active}
        onChange={(_, value: TransactionKind) => navigate(`/transactions/${value}`)}
        sx={{ mb: 3, minHeight: 0, '& .MuiTabs-indicator': { height: 2 } }}
      >
        <Tab disableRipple label="Expenses" value="expenses" sx={{ minHeight: 0, py: 1.25 }} />
        <Tab disableRipple label="Income" value="income" sx={{ minHeight: 0, py: 1.25 }} />
      </Tabs>
      <EntryPage key={active} {...ENTRY_PAGE_PROPS[active]} />
    </>
  );
}
