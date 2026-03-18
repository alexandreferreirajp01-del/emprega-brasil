# Mobile Optimization Guide

## Overview
This guide documents all mobile optimizations implemented across the app, including safe-area handling, touch targets, and performance improvements.

---

## 1. Safe Area Inset Implementation

### What is it?
Safe area insets protect content from being covered by device notches, home indicators, and gesture areas.

### How it's implemented
- **CSS Variables**: `--sat` (top), `--sab` (bottom), `--sal` (left), `--sar` (right)
- **Fixed Elements**: Header and bottom nav automatically adjust padding
- **Fallback**: Uses `env(safe-area-inset-*)` with `max(0px, ...)` to prevent negative values

### Where to apply
```jsx
// Fixed header
<header style={{
  paddingTop: 'max(0px, var(--sat, env(safe-area-inset-top, 0px)))',
  paddingLeft: 'var(--sal, env(safe-area-inset-left, 0px))',
  paddingRight: 'var(--sar, env(safe-area-inset-right, 0px))'
}}>

// Bottom nav
<nav style={{
  paddingBottom: 'max(0px, var(--sab, env(safe-area-inset-bottom, 0px)))',
}}>
```

### Testing
```javascript
// In browser console
console.log(getComputedStyle(document.documentElement).getPropertyValue('--sat'));
// Should return: "20px" on iPhone notch, "0px" on regular device
```

---

## 2. Touch Target Sizes (44px minimum)

### Requirements
- Minimum 44x44px for all interactive elements (Apple iOS guideline)
- Includes buttons, links, inputs, checkboxes, radios

### Implementation
```jsx
// All buttons automatically enforce 44px minimum
<button className="min-h-[44px] min-w-[44px]">Click me</button>

// Input fields
<input className="min-h-[44px] p-3" />

// Links (as buttons)
<a href="#" className="min-h-[44px] inline-flex items-center justify-center">Link</a>
```

### Validation
```javascript
// Development audit
import { auditAllTouchTargets } from '@/lib/touchTargetValidator';
const { violations } = auditAllTouchTargets();
console.warn(`Found ${violations.length} undersized touch targets`);
```

---

## 3. User Select - Content vs UI

### Strategy
- **UI Elements**: `user-select: none` (buttons, inputs, nav)
- **Content**: `user-select: text` (articles, posts, prose)

### Usage
```jsx
// Automatically disabled for UI
<button>Click me</button>

// Automatically enabled for content
<article>User can select this text</article>

// Manual override
<div data-selectable="true">This text can be selected</div>
```

---

## 4. Bottom Sheet Select Component

### When to use
Replace all native `<select>` dropdowns with `MobileBottomSheetSelect` for better mobile UX.

### Example
```jsx
import MobileBottomSheetSelect from '@/components/ui/mobile-bottom-sheet-select';

<MobileBottomSheetSelect
  label="Choose category"
  value={category}
  onChange={setCategory}
  options={[
    { value: 'work', label: 'Work' },
    { value: 'personal', label: 'Personal' },
  ]}
  searchable={true}
  multiple={false}
/>
```

### Features
- ✅ Bottom sheet animation (Framer Motion)
- ✅ Searchable options
- ✅ Single and multi-select support
- ✅ Dark mode support
- ✅ Safe area aware
- ✅ Touch targets 44px+

---

## 5. Performance Optimizations

### Memoization Hooks
```javascript
import { useFilteredList, useMappedList, usePaginatedList } from '@/hooks/useMemoized';

// Filter without re-rendering unnecessarily
const filtered = useFilteredList(items, item => item.active);

// Map items
const mapped = useMappedList(items, item => ({ ...item, selected: false }));

// Paginate
const { data, totalPages } = usePaginatedList(items, 20, currentPage);
```

### Memoized Components
```jsx
import OptimizedListRenderer from '@/components/common/OptimizedListRenderer';
import OptimizedCardItem from '@/components/common/OptimizedCardItem';

// Only re-renders if data actually changes
<OptimizedListRenderer
  items={newsList}
  renderItem={(news) => <OptimizedCardItem>{news.title}</OptimizedCardItem>}
  pageSize={20}
/>
```

### React.memo Usage
```jsx
const MyComponent = React.memo(({ prop1, prop2 }) => {
  return <div>{prop1}</div>;
}, (prevProps, nextProps) => {
  // Custom comparison - return true if props are equal (no re-render)
  return prevProps.prop1 === nextProps.prop1;
});
```

---

## 6. Audit & Debugging

### Development Mode Audits
```jsx
import { useMobileOptimizationAudit, useMobileViewportDebug } from '@/hooks/useMobileOptimizationAudit';

function MyPage() {
  useMobileOptimizationAudit(); // Logs touch target issues and safe-area problems
  useMobileViewportDebug();     // Logs viewport info on resize
  
  return <div>...</div>;
}
```

### Console Output Examples
```
✅ All 150 touch targets meet minimum 44x44px requirement
⚠️ Safe Area Audit Results: { Header: {...}, BottomNav: {...} }
📱 Viewport: 390x844px | DPR: 3
```

---

## 7. Migration Checklist

When refactoring a page:

- [ ] Replace `<select>` with `MobileBottomSheetSelect`
- [ ] Ensure all buttons have `min-h-[44px]`
- [ ] Check fixed elements have safe-area padding
- [ ] Memoize heavy list renders with `OptimizedListRenderer`
- [ ] Run `useMobileOptimizationAudit()` in dev mode
- [ ] Test on actual device (notch, home indicator, safe areas)
- [ ] Verify touch targets with audit tools

---

## 8. Browser Support

- ✅ iOS 11+ (safe-area-inset support)
- ✅ Android 10+ (gesture area support)
- ✅ Chrome 99+
- ✅ Safari 15+

### Graceful Degradation
All safe-area values default to `0px` on browsers without support.

---

## References
- [WebKit Safe Area Insets](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Gesture Navigation](https://developer.android.com/training/gesture-navigation)