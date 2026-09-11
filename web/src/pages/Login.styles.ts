import type { ElementType } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { FONT_DISPLAY } from '../theme/tokens';

type Poly = { component?: ElementType };

export const AuthPage = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'grid',
  gridTemplateColumns: '1.05fr 1fr',
  [theme.breakpoints.down('md')]: { gridTemplateColumns: '1fr' },
}));

export const AuthAside = styled(Box)<Poly>(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  padding: theme.spacing(8, 6),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  backgroundColor: theme.palette.mode === 'dark' ? theme.app.floating : theme.app.brand.main,
  color: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.app.brand.contrast,
  borderRight: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',

  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 'auto auto -30% -20%',
    width: 620,
    height: 620,
    pointerEvents: 'none',
    background:
      theme.palette.mode === 'dark'
        ? `radial-gradient(circle, ${theme.app.brand.main}42, transparent 64%)`
        : `radial-gradient(circle, ${theme.app.leaf.fill}57, transparent 60%)`,
  },
  '& > *': { position: 'relative' },

  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(4, 3),
    gap: theme.spacing(3),
    '& .auth-footnote': { display: 'none' },
  },
}));

export const AuthPitch = styled(Typography)<Poly>({
  fontFamily: FONT_DISPLAY,
  fontWeight: 500,
  fontSize: 'clamp(2rem, 1.2rem + 2.6vw, 3rem)',
  letterSpacing: '-0.03em',
  lineHeight: 1.1,
  maxWidth: '14ch',
});

export const AuthNote = styled(Typography)(({ theme }) => ({
  opacity: 0.82,
  maxWidth: '40ch',
  marginTop: theme.spacing(2),
}));

export const AuthFootnote = styled(Typography)({
  opacity: 0.72,
  fontSize: '0.86rem',
});

export const AuthPanel = styled(Box)<Poly>(({ theme }) => ({
  display: 'grid',
  placeItems: 'center',
  padding: theme.spacing(6, 3),
}));

export const AuthForm = styled('form')(({ theme }) => ({
  width: '100%',
  maxWidth: 360,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

export const AuthSwitch = styled(Typography)(({ theme }) => ({
  fontSize: '0.9rem',
  color: theme.palette.text.secondary,
  textAlign: 'center',
}));

export const AsideWordmark = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  '& .aside-wordmark-text': {
    fontFamily: FONT_DISPLAY,
    fontWeight: 600,
    fontSize: '1.32rem',
    letterSpacing: '-0.03em',
  },
}));
