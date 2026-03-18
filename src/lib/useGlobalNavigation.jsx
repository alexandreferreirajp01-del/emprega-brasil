import { useNavigate, useLocation } from 'react-router-dom';
import { useRef, useCallback } from 'react';

const backStackHistory = [];

/**
 * Global navigation controller with back-stack management
 */
export function useGlobalNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const stackRef = useRef(backStackHistory);

  const push = useCallback((path, state = {}) => {
    // Add current location to back-stack before navigating
    if (location.pathname !== '/') {
      stackRef.current.push({
        path: location.pathname,
        state: location.state || {},
        timestamp: Date.now(),
      });
    }
    navigate(path, { state });
  }, [navigate, location.pathname, location.state]);

  const goBack = useCallback(() => {
    if (stackRef.current.length > 0) {
      const previousRoute = stackRef.current.pop();
      navigate(previousRoute.path, { state: previousRoute.state, replace: true });
    } else {
      navigate(-1);
    }
  }, [navigate]);

  const canGoBack = stackRef.current.length > 0 || window.history.length > 1;

  const clearStack = useCallback(() => {
    stackRef.current = [];
  }, []);

  const getBackStackSize = () => stackRef.current.length;

  return {
    push,
    goBack,
    canGoBack,
    clearStack,
    getBackStackSize,
    currentPath: location.pathname,
  };
}