import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import TableRow from '@mui/material/TableRow';
import Box from '@mui/material/Box';

export const TableCard = styled(Card)({
  overflow: 'hidden',
});

export const PaddedCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
}));

/** First and last cells get extra inset so content clears the card's radius. */
export const LedgerRow = styled(TableRow)(({ theme }) => ({
  '& > td:first-of-type, & > th:first-of-type': { paddingLeft: theme.spacing(3) },
  '& > td:last-of-type, & > th:last-of-type': { paddingRight: theme.spacing(3) },
}));

/** The totals row is set off by a heavier rule so it does not read as data. */
export const TotalsRow = styled(LedgerRow)(({ theme }) => ({
  '& > td': {
    borderTop: `1px solid ${theme.app.lineStrong}`,
    borderBottom: 'none',
    backgroundColor: theme.app.sunken,
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    fontWeight: 500,
  },
}));

export const DialogFormBox = styled(Box)({
  width: '100%',
});
