import type { ElementType } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { FONT_DISPLAY } from './tokens';

/** The vertical rhythm every page uses between its major blocks. */
type Poly = { component?: ElementType };

export const PageStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(3),
}));

export const PageHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));

export const PageTitle = styled(Typography)<Poly>({
  fontFamily: FONT_DISPLAY,
  fontWeight: 500,
  fontSize: 'clamp(1.75rem, 1.3rem + 1.6vw, 2.35rem)',
  letterSpacing: '-0.026em',
  lineHeight: 1.12,
});

export const Lede = styled(Typography)<Poly>(({ theme }) => ({
  color: theme.palette.text.secondary,
  maxWidth: '62ch',
}));

export const CardHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(2),
}));

export const CardTitle = styled(Typography)<Poly>({
  fontFamily: FONT_DISPLAY,
  fontWeight: 500,
  fontSize: '1.06rem',
  letterSpacing: '-0.018em',
});

/**
 * Money. Tabular figures keep decimal points aligned down a column, which is
 * the whole reason a ledger is readable at a glance.
 */
export const Amount = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'flow' && prop !== 'strong',
})<{
  component?: ElementType;
  flow?: 'earn' | 'spend' | 'neutral';
  /** For the figure a row is really about — a balance, or a row total. */
  strong?: boolean;
}>(({ theme, flow = 'neutral', strong }) => ({
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: "'tnum' 1",
  fontWeight: strong ? 600 : 'inherit',
  color:
    flow === 'earn'
      ? theme.app.earn.text
      : flow === 'spend'
        ? theme.app.spend.text
        : 'inherit',
}));

export const CategoryChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'flow',
})<{ flow?: 'earn' | 'spend' }>(({ theme, flow }) =>
  flow === 'earn'
    ? {
        backgroundColor: theme.app.brand.wash,
        borderColor: theme.app.brand.main,
        color: theme.app.brand.main,
      }
    : {},
);

/** Right-aligned cell content, used for every amount column. */
export const RowActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(0.5),
  justifyContent: 'flex-end',
  '& .MuiButton-root': {
    padding: theme.spacing(0.5, 1),
    fontSize: '0.85rem',
    lineHeight: 1.4,
    minWidth: 0,
  },
}));

export const FormGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
  gap: theme.spacing(2),
}));

export const FormGridFull = styled(Box)({
  gridColumn: '1 / -1',
});

export const FormActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(3),
}));
