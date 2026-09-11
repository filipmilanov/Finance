import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import { Wordmark } from './Logo';
import { useAuth } from '../state/AuthContext';
import { useThemeMode } from '../state/ThemeContext';
import { initials } from '../lib/format';
import {
  HeaderBar,
  HeaderEnd,
  HeaderInner,
  LogoLink,
  MainNav,
  NavItem,
  ThemeToggle,
  UserAvatar,
  UserChip,
} from './Header.styles';

const PAGES = [
  { to: '/accounts', label: 'Accounts' },
  { to: '/transactions', label: 'Transactions' },
];

export function Header() {
  const { user, signOut } = useAuth();
  const { mode, toggle } = useThemeMode();
  const nextTheme = mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <HeaderBar elevation={0}>
      <HeaderInner>
        <LogoLink to="/" aria-label="Verdant — go to your dashboard">
          <Wordmark />
        </LogoLink>

        <MainNav aria-label="Main">
          {PAGES.map((page) => (
            <NavItem key={page.to} to={page.to}>
              {page.label}
            </NavItem>
          ))}
        </MainNav>

        <HeaderEnd>
          <ThemeToggle>
            <IconButton onClick={toggle} aria-label={nextTheme} title={nextTheme}>
              {mode === 'dark' ? (
                <LightModeOutlinedIcon fontSize="small" />
              ) : (
                <DarkModeOutlinedIcon fontSize="small" />
              )}
            </IconButton>
          </ThemeToggle>

          {user && (
            <>
              <UserChip>
                <UserAvatar aria-hidden>{initials(user.fullName)}</UserAvatar>
                <Typography component="span" variant="body2" className="user-name">
                  {user.fullName}
                </Typography>
              </UserChip>
              <Button onClick={signOut}>Sign out</Button>
            </>
          )}
        </HeaderEnd>
      </HeaderInner>
    </HeaderBar>
  );
}
