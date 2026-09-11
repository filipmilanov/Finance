import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { FONT_DISPLAY } from '../theme/tokens';

/** Filters sit in one recessed row above the ledger, per the interaction spec. */
export const FilterBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-end',
  gap: theme.spacing(1.5),
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.app.radius.raised,
  backgroundColor: theme.app.sunken,
  '& .MuiTextField-root': { minWidth: 150 },
}));

export const FilterTotal = styled(Box)({
  marginLeft: 'auto',
  textAlign: 'right',
});

export const FilterCount = styled(Typography)(({ theme }) => ({
  color: theme.app.textFaint,
  fontSize: '0.82rem',
}));

export const FilterValue = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'flow',
})<{ flow: 'earn' | 'spend' }>(({ theme, flow }) => ({
  fontFamily: FONT_DISPLAY,
  fontSize: '1.28rem',
  fontWeight: 500,
  fontVariantNumeric: 'tabular-nums',
  color: flow === 'earn' ? theme.app.earn.text : theme.app.spend.text,
}));

export const CommentCell = styled(Box)({
  maxWidth: 240,
});
