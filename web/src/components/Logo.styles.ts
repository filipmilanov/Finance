import type { ElementType } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { FONT_DISPLAY } from '../theme/tokens';

type Poly = { component?: ElementType };

export const WordmarkRoot = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
}));

/**
 * The mark sits in a filled badge because the leaf is a pale mint that only
 * carries contrast against the pine — not against the page.
 */
export const Badge = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'size',
})<{ size: number }>(({ theme, size }) => ({
  display: 'grid',
  placeItems: 'center',
  flex: 'none',
  width: size,
  height: size,
  borderRadius: 10,
  backgroundColor: theme.app.brand.main,
  color: theme.app.brand.contrast,
  boxShadow: theme.app.shadow.raised,
}));

export const WordmarkText = styled(Typography)<Poly>({
  fontFamily: FONT_DISPLAY,
  fontWeight: 600,
  fontSize: '1.32rem',
  letterSpacing: '-0.03em',
});
