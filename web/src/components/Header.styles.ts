import { styled } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import { NavLink } from 'react-router-dom';
import { Link } from 'react-router-dom';

export const HeaderBar = styled(AppBar)(({ theme }) => ({
  position: 'sticky',
  backgroundColor: theme.app.canvasVeil,
  backdropFilter: 'blur(14px) saturate(1.4)',
  borderBottom: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  color: theme.palette.text.primary,
}));

export const HeaderInner = styled(Toolbar)(({ theme }) => ({
  width: '100%',
  maxWidth: 1140,
  margin: '0 auto',
  gap: theme.spacing(3),
  minHeight: 66,
  [theme.breakpoints.down('sm')]: {
    flexWrap: 'wrap',
    minHeight: 0,
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    gap: theme.spacing(1.5),
  },
}));

export const LogoLink = styled(Link)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  textDecoration: 'none',
  borderRadius: theme.app.radius.field,
  padding: theme.spacing(0.5, 1),
  marginLeft: theme.spacing(-1),
  color: theme.palette.text.primary,
  transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1)',
  '&:hover': { transform: 'translateY(-1px)' },
  '&:active': { transform: 'translateY(0) scale(0.985)' },
  '&:focus-visible': { outline: `2px solid ${theme.app.brand.main}`, outlineOffset: 2 },
}));

export const MainNav = styled('nav')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  marginLeft: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    order: 3,
    width: '100%',
    marginLeft: 0,
    overflowX: 'auto',
  },
}));

export const NavItem = styled(NavLink)(({ theme }) => ({
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.app.radius.field,
  color: theme.palette.text.secondary,
  textDecoration: 'none',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  transition: 'color 0.18s ease, background-color 0.18s ease',
  '&:hover': { color: theme.palette.text.primary, backgroundColor: theme.app.sunken },
  '&.active': { color: theme.app.brand.main, backgroundColor: theme.app.brand.wash },
  '&:focus-visible': { outline: `2px solid ${theme.app.brand.main}`, outlineOffset: 2 },
}));

export const HeaderEnd = styled(Box)(({ theme }) => ({
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

export const UserChip = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(0.5, 1, 0.5, 0.5),
  borderRadius: 999,
  backgroundColor: theme.app.sunken,
  fontSize: '0.88rem',
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(0.5),
    '& .user-name': { display: 'none' },
  },
}));

export const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: 28,
  height: 28,
  fontSize: '0.76rem',
  fontWeight: 600,
  backgroundColor: theme.app.brand.main,
  color: theme.app.brand.contrast,
}));

export const ThemeToggle = styled('div')(({ theme }) => ({
  '& .MuiIconButton-root': {
    width: 36,
    height: 36,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.secondary,
    '&:hover': { color: theme.app.brand.main, borderColor: theme.app.brand.main },
  },
}));
