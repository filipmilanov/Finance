import { useState, type FormEvent } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { LogoMark } from '../components/Logo';
import { useAuth } from '../state/AuthContext';
import { Lede, PageTitle } from '../theme/shared.styles';
import {
  AsideWordmark,
  AuthAside,
  AuthFootnote,
  AuthForm,
  AuthNote,
  AuthPage,
  AuthPanel,
  AuthPitch,
  AuthSwitch,
} from './Login.styles';

export function Login() {
  const { signIn, register } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const signingUp = mode === 'signup';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (signingUp) {
        await register(fullName, username, password);
      } else {
        await signIn(username, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPage>
      <AuthAside component="aside">
        <AsideWordmark>
          <LogoMark size={32} />
          <Typography component="span" className="aside-wordmark-text">
            Verdant
          </Typography>
        </AsideWordmark>

        <div>
          <AuthPitch component="h1">Every euro, accounted for.</AuthPitch>
          <AuthNote>
            Log what you spend and what comes in, and Verdant works out where each account
            actually stands.
          </AuthNote>
        </div>

        <AuthFootnote className="auth-footnote">
          Runs on your own Postgres. Nothing leaves the machine.
        </AuthFootnote>
      </AuthAside>

      <AuthPanel component="main">
        <AuthForm onSubmit={handleSubmit}>
          <div>
            <PageTitle component="h2">
              {signingUp ? 'Create your account' : 'Welcome back'}
            </PageTitle>
            <Lede variant="body2">
              {signingUp
                ? 'You start with a Cash account and a set of everyday categories.'
                : 'Sign in to pick up where you left off.'}
            </Lede>
          </div>

          {error && <Alert severity="error">{error}</Alert>}

          {signingUp && (
            <TextField
              label="Your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              size="small"
              required
              fullWidth
            />
          )}

          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            size="small"
            required
            fullWidth
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={signingUp ? 'new-password' : 'current-password'}
            size="small"
            required
            fullWidth
          />

          <Button type="submit" variant="contained" disabled={busy} fullWidth>
            {busy ? 'One moment' : signingUp ? 'Create account' : 'Sign in'}
          </Button>

          <AuthSwitch>
            {signingUp ? 'Already have an account? ' : 'New to Verdant? '}
            <Link
              component="button"
              type="button"
              onClick={() => {
                setMode(signingUp ? 'signin' : 'signup');
                setError('');
              }}
            >
              {signingUp ? 'Sign in' : 'Create one'}
            </Link>
          </AuthSwitch>
        </AuthForm>
      </AuthPanel>
    </AuthPage>
  );
}
