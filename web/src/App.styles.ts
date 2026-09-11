import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';

export const AppShell = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
});

export const ShellMain = styled('main')(({ theme }) => ({
  flex: 1,
  width: '100%',
  maxWidth: 1140,
  margin: '0 auto',
  padding: theme.spacing(4, 3, 8),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3, 2, 6),
  },
}));
