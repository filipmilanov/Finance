import type { ElementType } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import { FONT_DISPLAY } from '../theme/tokens';

type Poly = { component?: ElementType };

export const DialogHead = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1.5),
  fontFamily: FONT_DISPLAY,
  fontWeight: 500,
  fontSize: '1.06rem',
  letterSpacing: '-0.018em',
  padding: theme.spacing(3, 3, 0),
}));

export const DialogBody = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
  // Cancels the default that clips focus rings on the first row of fields.
  overflowY: 'visible',
}));

export const EmptyRoot = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(6, 3),
  color: theme.palette.text.secondary,
}));

export const EmptyTitle = styled(Typography)<Poly>(({ theme }) => ({
  fontFamily: FONT_DISPLAY,
  fontSize: '1.1rem',
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(1),
}));

export const EmptyAction = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

export const AlertSlot = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));
