import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1', withCredentials: true });

api.interceptors.request.use((config) => {
  if (!config.headers['X-Idempotency-Key'] && config.method === 'post') {
    config.headers['X-Idempotency-Key'] = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  return config;
});

let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && original && !original._retry && !original.url?.includes('/auth/') && !window.location.pathname.includes('/login')) {
      original._retry = true;
      try {
        if (!refreshing) refreshing = api.post('/auth/refresh');
        await refreshing;
        refreshing = null;
        return api(original);
      } catch {
        refreshing = null;
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const authApi = { login: (d) => api.post('/auth/login', d), logout: () => api.post('/auth/logout'), refresh: () => api.post('/auth/refresh'), profile: () => api.get('/auth/profile'), register: (d) => api.post('/auth/register', d) };
export const webauthnApi = { registerOptions: () => api.get('/webauthn/register-options'), register: (d) => api.post('/webauthn/register', d), loginOptions: (email) => api.get(`/webauthn/login-options?email=${encodeURIComponent(email)}`), login: (d) => api.post('/webauthn/login', d), list: () => api.get('/webauthn/credentials'), remove: (id) => api.delete(`/webauthn/credentials/${id}`) };
export const dashboardApi = { summary: () => api.get('/dashboard/summary'), incomeExpense: (days=30) => api.get(`/dashboard/income-expense?days=${days}`), categoryExpenses: () => api.get('/dashboard/category-expenses'), bankBalances: () => api.get('/dashboard/bank-balances') };
export const accountApi = { list: () => api.get('/accounts'), create: (d) => api.post('/accounts', d), update: (id,d) => api.patch(`/accounts/${id}`, d), remove: (id) => api.delete(`/accounts/${id}`), archive: (id) => api.post(`/accounts/${id}/archive`) };
export const txApi = { list: (p={}) => api.get('/transactions', { params: p }), create: (d) => api.post('/transactions', d), transfer: (d) => api.post('/transactions/transfer', d), reverse: (id) => api.post(`/transactions/${id}/reverse`), remove: (id) => api.delete(`/transactions/${id}`), statement: (accountId, params = {}) => api.get(`/transactions/statement?accountId=${accountId}`, { params }), transfers: (p={}) => api.get('/transactions/transfers', { params: p }) };
export const categoryApi = { list: () => api.get('/categories'), create: (d) => api.post('/categories', d), update: (id,d) => api.patch(`/categories/${id}`, d), remove: (id) => api.delete(`/categories/${id}`) };
export const budgetApi = { list: () => api.get('/budgets'), upsert: (d) => api.post('/budgets', d) };
export const goalApi = { list: () => api.get('/goals'), create: (d) => api.post('/goals', d), update: (id,d) => api.patch(`/goals/${id}`, d), contribute: (id,d) => api.post(`/goals/${id}/contribute`, d) };
export const reminderApi = { list: () => api.get('/reminders'), create: (d) => api.post('/reminders', d), toggle: (id) => api.patch(`/reminders/${id}/toggle`) };
export const reportApi = { monthly: (m) => api.get(`/reports/monthly?month=${m}`), yearly: (y) => api.get(`/reports/yearly?year=${y}`), bankWise: () => api.get('/reports/bank-wise'), categoryWise: () => api.get('/reports/category-wise'), pdf: () => api.get('/reports/export/pdf', { responseType: 'blob' }), excel: () => api.get('/reports/export/excel', { responseType: 'blob' }) };
export default api;
