import { useEffect, useRef, useState, useCallback } from 'react';

export function usePullToRefresh(onRefresh, threshold = 100) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const isRefreshing = useRef(false);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing.current) return;
    
    isRefreshing.current = true;
    setIsPulling(true);

    try {
      await onRefresh?.();
    } finally {
      isRefreshing.current = false;
      setIsPulling(false);
      setPullProgress(0);
    }
  }, [onRefresh]);

  useEffect(() => {
    const element = document.documentElement;

    const handleTouchStart = (e) => {
      if (element.scrollTop === 0) {
        touchStartY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (element.scrollTop === 0) {
        touchCurrentY.current = e.touches[0].clientY;
        const diff = touchCurrentY.current - touchStartY.current;

        if (diff > 0 && !isRefreshing.current) {
          setIsPulling(true);
          setPullProgress(Math.min(diff / threshold, 1));
        }
      }
    };

    const handleTouchEnd = () => {
      if (pullProgress >= 1 && !isRefreshing.current) {
        handleRefresh();
      } else {
        setIsPulling(false);
        setPullProgress(0);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, false);
    document.addEventListener('touchmove', handleTouchMove, false);
    document.addEventListener('touchend', handleTouchEnd, false);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullProgress, handleRefresh]);

  return { isPulling, pullProgress, handleRefresh };
}