/**
 * Audits safe-area-inset implementations across fixed elements
 */

export function auditSafeAreaImplementation() {
  const elements = {
    'Header/Navigation': document.querySelector('header'),
    'Bottom Nav': document.querySelector('nav[style*="bottom"]'),
    'Footer Ads': document.querySelector('[class*="ad"][style*="bottom"]'),
  };

  const results = {};

  Object.entries(elements).forEach(([name, el]) => {
    if (!el) {
      results[name] = { exists: false };
      return;
    }

    const styles = getComputedStyle(el);
    const hasVars = el.style.cssText.includes('--sat') || 
                   el.style.cssText.includes('--sab') ||
                   el.style.cssText.includes('env(safe-area-inset');

    const paddingTop = styles.paddingTop;
    const paddingBottom = styles.paddingBottom;

    results[name] = {
      exists: true,
      hasSafeAreaVars: hasVars,
      paddingTop,
      paddingBottom,
      position: styles.position,
      zIndex: styles.zIndex,
      element: el,
    };
  });

  return results;
}

export function logSafeAreaIssues() {
  if (process.env.NODE_ENV !== 'development') return;

  const results = auditSafeAreaImplementation();
  console.log('📱 Safe Area Audit Results:', results);

  Object.entries(results).forEach(([name, config]) => {
    if (!config.exists) {
      console.warn(`  ⚠️ ${name}: Not found in DOM`);
    } else if (!config.hasSafeAreaVars && (name === 'Header/Navigation' || name === 'Bottom Nav')) {
      console.warn(`  ⚠️ ${name}: Missing safe-area-inset variables`);
    } else {
      console.log(`  ✅ ${name}: Safe area implemented`);
    }
  });
}