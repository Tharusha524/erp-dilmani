import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * A hook that saves the current route path to localStorage
 * and helps maintain the route when the page is refreshed
 */
export const useRoutePreserver = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Don't save login or register routes
    if (location.pathname !== '/' && location.pathname !== '/register') {
      localStorage.setItem('lastRoute', location.pathname);
    }
  }, [location]);

  return {
    getLastRoute: () => localStorage.getItem('lastRoute') || '/dashboard'
  };
};