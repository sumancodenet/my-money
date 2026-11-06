import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Landing from '../pages/landing/Landing';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Dashboard from '../pages/dashboard/Dashboard';
import Accounts from '../pages/accounts/Accounts';
import Transactions from '../pages/transactions/Transactions';
import Income from '../pages/income/Income';
import Expenses from '../pages/expenses/Expenses';
import Transfers from '../pages/transfers/Transfers';
import Categories from '../pages/categories/Categories';
import Budgets from '../pages/budgets/Budgets';
import Goals from '../pages/goals/Goals';
import Reminders from '../pages/reminders/Reminders';
import Reports from '../pages/reports/Reports';
import Settings from '../pages/settings/Settings';
import AppLayout from '../layouts/AppLayout';
import { useAuth } from '../context/AuthContext';

const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center"><p className="font-bold text-violet-600">Loading My Money...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center"><p className="font-bold text-violet-600">Loading My Money...</p></div>;
  if (user) return <Navigate to="/app/dashboard" replace />;
  return children;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicOnly><Landing /></PublicOnly>} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/app" element={<Protected><AppLayout /></Protected>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="income" element={<Income />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="transfers" element={<Transfers />} />
        <Route path="categories" element={<Categories />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="goals" element={<Goals />} />
        <Route path="reminders" element={<Reminders />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route index element={<Navigate to="/app/dashboard" replace />} />
      </Route>
      {/* Backward compat: /dashboard etc redirect to /app/... */}
      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/accounts" element={<Navigate to="/app/accounts" replace />} />
      <Route path="/transactions" element={<Navigate to="/app/transactions" replace />} />
      <Route path="/income" element={<Navigate to="/app/income" replace />} />
      <Route path="/expenses" element={<Navigate to="/app/expenses" replace />} />
      <Route path="/transfers" element={<Navigate to="/app/transfers" replace />} />
      <Route path="/categories" element={<Navigate to="/app/categories" replace />} />
      <Route path="/budgets" element={<Navigate to="/app/budgets" replace />} />
      <Route path="/goals" element={<Navigate to="/app/goals" replace />} />
      <Route path="/reminders" element={<Navigate to="/app/reminders" replace />} />
      <Route path="/reports" element={<Navigate to="/app/reports" replace />} />
      <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
