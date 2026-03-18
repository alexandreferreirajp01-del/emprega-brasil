import { useEffect } from 'react';
import { logTouchTargetIssues } from '@/lib/touchTargetValidator';
import { logSafeAreaIssues } from '@/lib/safeAreaAudit';

/**
 * Development hook to audit mobile optimizations
 */
export function useMobileOptimizationAudit() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Initial audit
    logTouchTargetIssues();
    logSafeAreaIssues();

    // Re-audit on window resize
    const handleResize = () => {
      logTouchTargetIssues();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
}

export function useMobileViewportDebug() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const printViewportInfo = () => {
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      const dpr = window.devicePixelRatio;

      console.log(`📱 Viewport: ${vw}x${vh}px | DPR: ${dpr}`);
      console.log(`  Safe areas: top=${getComputedStyle(document.documentElement).getPropertyValue('--sat')} bottom=${getComputedStyle(document.documentElement).getPropertyValue('--sab')}`);
    };

    printViewportInfo();
    window.addEventListener('resize', printViewportInfo);
    return () => window.removeEventListener('resize', printViewportInfo);
  }, []);
}