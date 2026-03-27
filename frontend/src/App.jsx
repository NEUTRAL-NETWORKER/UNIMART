import { BrowserRouter, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { OrderProvider } from './context/OrderContext';
import { ChatProvider } from './context/ChatContext';
import { NotificationProvider } from './context/NotificationContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import MobileNav from './components/layout/MobileNav';
import Toast from './components/common/Toast';
import AppRoutes from './routes/AppRoutes';
import { useBackNavigation } from './hooks/useBackNavigation';

function BackNavigationHandler() {
  useBackNavigation();
  return null;
}

function AppLayout() {
  const location = useLocation();
  const isAuthPage = ['/', '/login', '/register'].includes(location.pathname);
  const isAdminPage = location.pathname.startsWith('/admin');

  // Don't show main app layout (navbar/footer) on admin pages
  if (isAdminPage) {
    return (
      <>
        <BackNavigationHandler />
        <AppRoutes />
      </>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <BackNavigationHandler />
      {!isAuthPage && <Navbar />}
      <main className={`flex-1 ${!isAuthPage ? 'pt-16 pb-16 md:pb-0' : ''}`}>
        <AppRoutes />
      </main>
      {!isAuthPage && <Footer />}
      {!isAuthPage && <MobileNav />}
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <OrderProvider>
              <ChatProvider>
                <NotificationProvider>
                  <AppLayout />
                </NotificationProvider>
              </ChatProvider>
            </OrderProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

