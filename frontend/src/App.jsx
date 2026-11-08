import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ButtonLoaderTracker } from './components/common/ButtonLoader';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ButtonLoaderTracker />
        <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px' } }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
