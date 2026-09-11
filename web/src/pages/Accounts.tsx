import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import { api } from '../lib/api';
import { money } from '../lib/format';
import { ACCOUNT_KINDS, accountKindLabel, type Account, type AccountKind } from '../lib/types';
import { EmptyState, FormDialog, Loading, AlertSlot } from '../components/ui';
import {
  Amount,
  CategoryChip,
  FormActions,
  FormGrid,
  Lede,
  PageHeader,
  PageTitle,
  RowActions,
} from '../theme/shared.styles';
import { LedgerRow, PaddedCard, TableCard, TotalsRow } from './Accounts.styles';

type Draft = {
  name: string;
  kind: AccountKind;
  currency: string;
  openingBalance: string;
};

const BLANK: Draft = { name: '', kind: 'cash', currency: 'EUR', openingBalance: '0' };

export function Accounts() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Account | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(() => {
    api<Account[]>('/accounts')
      .then(setAccounts)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(load, [load]);

  function openNew() {
    setEditing(null);
    setDraft(BLANK);
    setFormError('');
    setOpen(true);
  }

  function openEdit(account: Account) {
    setEditing(account);
    setDraft({
      name: account.name,
      kind: account.kind,
      currency: account.currency,
      openingBalance: String(account.openingBalance),
    });
    setFormError('');
    setOpen(true);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      const body = { ...draft, openingBalance: Number(draft.openingBalance || 0) };
      if (editing) {
        await api(`/accounts/${editing.id}`, { method: 'PUT', body });
      } else {
        await api('/accounts', { method: 'POST', body });
      }
      setOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save the account.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(account: Account) {
    if (!confirm(`Delete ${account.name}? This cannot be undone.`)) return;
    try {
      await api(`/accounts/${account.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the account.');
    }
  }

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!accounts) return <Loading label="Loading your accounts" />;

  const total = accounts.reduce((sum, account) => sum + account.balance, 0);
  const currency = accounts[0]?.currency ?? 'EUR';

  return (
    <>
      <PageHeader>
        <div>
          <PageTitle component="h1">Accounts</PageTitle>
          <Lede variant="body2">
            Each balance is your opening amount plus everything in, minus everything out.
          </Lede>
        </div>
        <Button variant="contained" onClick={openNew}>
          Add account
        </Button>
      </PageHeader>

      {accounts.length === 0 ? (
        <PaddedCard>
          <EmptyState
            title="No accounts yet"
            hint="Add a cash wallet, a bank account or a card to start tracking."
            action={
              <Button variant="contained" onClick={openNew}>
                Add account
              </Button>
            }
          />
        </PaddedCard>
      ) : (
        <TableCard>
          <TableContainer>
            <Table>
              <TableHead>
                <LedgerRow>
                  <TableCell>Account</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Opening</TableCell>
                  <TableCell align="right">In</TableCell>
                  <TableCell align="right">Out</TableCell>
                  <TableCell align="right">Balance</TableCell>
                  <TableCell />
                </LedgerRow>
              </TableHead>
              <TableBody>
                {accounts.map((account) => (
                  <LedgerRow key={account.id} hover>
                    <TableCell>{account.name}</TableCell>
                    <TableCell>
                      <CategoryChip label={accountKindLabel(account.kind)} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Amount component="span" color="text.secondary">
                        {money(account.openingBalance, account.currency)}
                      </Amount>
                    </TableCell>
                    <TableCell align="right">
                      <Amount component="span" flow="earn">
                        {money(account.incomeTotal, account.currency)}
                      </Amount>
                    </TableCell>
                    <TableCell align="right">
                      <Amount component="span" flow="spend">
                        {money(account.expenseTotal, account.currency)}
                      </Amount>
                    </TableCell>
                    <TableCell align="right">
                      <Amount component="span" strong>
                        {money(account.balance, account.currency)}
                      </Amount>
                    </TableCell>
                    <TableCell>
                      <RowActions>
                        <Button onClick={() => openEdit(account)}>Edit</Button>
                        <Button color="error" onClick={() => remove(account)}>
                          Delete
                        </Button>
                      </RowActions>
                    </TableCell>
                  </LedgerRow>
                ))}
              </TableBody>
              <TableFooter>
                <TotalsRow>
                  <TableCell colSpan={5}>Total across accounts</TableCell>
                  <TableCell align="right">
                    <Amount component="span" strong color="text.primary">
                      {money(total, currency)}
                    </Amount>
                  </TableCell>
                  <TableCell />
                </TotalsRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </TableCard>
      )}

      <FormDialog
        open={open}
        title={editing ? `Edit ${editing.name}` : 'Add an account'}
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
              label="Name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Everyday card"
              size="small"
              required
              slotProps={{ htmlInput: { 'data-autofocus': true } }}
            />

            <TextField
              select
              label="Type"
              value={draft.kind}
              onChange={(e) => setDraft({ ...draft, kind: e.target.value as AccountKind })}
              size="small"
            >
              {ACCOUNT_KINDS.map((kind) => (
                <MenuItem key={kind.value} value={kind.value}>
                  {kind.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Currency"
              value={draft.currency}
              onChange={(e) => setDraft({ ...draft, currency: e.target.value.toUpperCase() })}
              size="small"
              required
              slotProps={{ htmlInput: { maxLength: 3 } }}
            />

            <TextField
              label="Opening balance"
              type="number"
              value={draft.openingBalance}
              onChange={(e) => setDraft({ ...draft, openingBalance: e.target.value })}
              size="small"
              required
              slotProps={{ htmlInput: { step: '0.01' } }}
            />
          </FormGrid>

          <FormActions>
            <Button type="submit" variant="contained" disabled={busy}>
              {busy ? 'Saving' : editing ? 'Save changes' : 'Add account'}
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
