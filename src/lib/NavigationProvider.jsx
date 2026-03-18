import React, { createContext, useContext } from 'react';
import { useNavigationHistory } from '@/hooks/useNavigationHistory';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

const NavigationContext = createContext({
  canGoBack: false,
  goBack: () => false,
  isPulling: false,
  pullProgress: 0,
});

export function NavigationProvider({ children }) {
  const history = useNavigationHistory();
  const pullToRefresh = usePullToRefresh(() => window.location.reload());

  return (
    <NavigationContext.Provider
      value={{
        ...history,
        ...pullToRefresh,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}