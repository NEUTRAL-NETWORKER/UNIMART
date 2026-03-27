import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Custom hook to handle browser back button navigation
 * - On auth pages (login, register, admin/login): back goes to landing page (/)
 * - On home page (/home): back goes to authentication page (login or admin/login)
 * - On landing page (/): allow normal browser behavior
 * - On other protected pages: back goes to home page (/home)
 */
export function useBackNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    const authPages = ['/login', '/register', '/admin/login'];
    const landingPage = '/';
    const homePage = '/home';

    const handlePopState = () => {
      // Prevent double navigation
      if (isNavigatingRef.current) {
        return;
      }

      isNavigatingRef.current = true;

      const currentPath = window.location.pathname;

      // Check if we're on an auth page
      if (authPages.includes(currentPath)) {
        // On auth pages, go to landing page
        navigate(landingPage, { replace: true });
      } else if (currentPath === landingPage) {
        // On landing page, allow normal browser behavior (do nothing special)
        isNavigatingRef.current = false;
        return;
      } else if (currentPath === homePage) {
        // On home page, go back to appropriate auth page
        // Check which auth context is active based on localStorage
        const hasAdminToken = localStorage.getItem('unimart_admin_token');
        const hasUserToken = localStorage.getItem('unimart_token');

        if (hasAdminToken) {
          navigate('/admin/login', { replace: true });
        } else if (hasUserToken) {
          navigate('/login', { replace: true });
        } else {
          // No token found, go to landing page
          navigate(landingPage, { replace: true });
        }
      } else if (currentPath.startsWith('/admin')) {
        // On admin pages, go to admin dashboard
        navigate('/admin', { replace: true });
      } else {
        // On other protected pages, go to home
        navigate(homePage, { replace: true });
      }

      // Reset flag after a short delay
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 100);
    };

    // Add listener for popstate (browser back/forward)
    window.addEventListener('popstate', handlePopState);

    // Push initial state to enable popstate interception
    if (window.history.state === null) {
      window.history.replaceState({ customNav: true }, '', window.location.pathname);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  // Update history state when location changes (for internal navigation)
  useEffect(() => {
    if (!isNavigatingRef.current) {
      window.history.replaceState({ customNav: true }, '', location.pathname + location.search);
    }
  }, [location]);
}

export default useBackNavigation;
