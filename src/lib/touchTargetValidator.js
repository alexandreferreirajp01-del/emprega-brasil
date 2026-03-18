/**
 * Validates touch target sizes across the app
 * Mobile touch targets should be at least 44x44px (Apple iOS guideline)
 */

export function validateTouchTargetSize(element) {
  if (!element) return { valid: true, size: null };

  const rect = element.getBoundingClientRect();
  const minSize = 44;

  return {
    valid: rect.width >= minSize && rect.height >= minSize,
    size: { width: Math.round(rect.width), height: Math.round(rect.height) },
    minSize,
    element: element.tagName,
  };
}

export function auditAllTouchTargets() {
  const interactiveElements = document.querySelectorAll(
    'button, a, input[type="button"], input[type="checkbox"], input[type="radio"], [role="button"]'
  );

  const results = [];
  const violations = [];

  interactiveElements.forEach((el) => {
    const validation = validateTouchTargetSize(el);
    results.push(validation);

    if (!validation.valid) {
      violations.push({
        element: el,
        ...validation,
      });
    }
  });

  return { results, violations, totalElements: interactiveElements.length };
}

export function logTouchTargetIssues() {
  if (process.env.NODE_ENV !== 'development') return;

  const { violations, totalElements } = auditAllTouchTargets();

  if (violations.length > 0) {
    console.warn(`⚠️ Found ${violations.length}/${totalElements} touch targets below 44x44px`);
    violations.forEach((v) => {
      console.warn(`  ${v.element}: ${v.size.width}x${v.size.height}px`, v.element);
    });
  } else {
    console.log(`✅ All ${totalElements} touch targets meet minimum 44x44px requirement`);
  }
}