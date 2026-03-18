import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function useNavigationHistory() {
  const navigate = useNavigate();
  const location = useLocation();
  const historyStack = useRef([]);
  const isBackNavigation = useRef(false);

  useEffect(() => {
    const currentPath = location.pathname;

    // Detect if this is a back navigation
    if (historyStack.current.length > 0) {
      const lastPath = historyStack.current[historyStack.current.length - 1];
      if (lastPath !== currentPath) {
        // Check if we're going back
        if (historyStack.current.includes(currentPath)) {
          isBackNavigation.current = true;
          historyStack.current = historyStack.current.slice(0, historyStack.current.indexOf(currentPath) + 1);
        } else {
          // New navigation forward
          isBackNavigation.current = false;
          historyStack.current.push(currentPath);
        }
      }
    } else {
      historyStack.current.push(currentPath);
    }
  }, [location.pathname]);

  const handleAndroidBack = useCallback(() => {
    if (historyStack.current.length > 1) {
      historyStack.current.pop();
      const previousPath = historyStack.current[historyStack.current.length - 1];
      isBackNavigation.current = true;
      navigate(previousPath, { replace: true });
      return true;
    }
    return false;
  }, [navigate]);

  useEffect(() => {
    const handleBackButton = (event) => {
      if (handleAndroidBack()) {
        event.preventDefault();
      }
    };

    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, [handleAndroidBack]);

  return {
    canGoBack: historyStack.current.length > 1,
    goBack: handleAndroidBack,
    isBackNavigation: isBackNavigation.current,
    stack: historyStack.current,
  };
}