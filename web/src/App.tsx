import { Navigate, Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Accounts } from './pages/Accounts';
import { Transactions } from './pages/EntryPage';
import { Login } from './pages/Login';
import { useAuth } from './state/AuthContext';
import { AppShell, ShellMain } from './App.styles';

export function App() {
  const { user, ready } = useAuth();

  if (!ready) return null;
  if (!user) return <Login />;

  return (
    <AppShell>
      <Header />
      <ShellMain>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/transactions" element={<Navigate to="/transactions/expenses" replace />} />
          <Route path="/transactions/:kind" element={<Transactions />} />
          <Route path="/expenses" element={<Navigate to="/transactions/expenses" replace />} />
          <Route path="/income" element={<Navigate to="/transactions/income" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ShellMain>
    </AppShell>
  );
}
