# Quick Testing Checklist

Test the refactoring across desktop and mobile views.

## Desktop Browser Testing (Chrome DevTools)

### 1. Navigation Controller
- [ ] Click back button works consistently
- [ ] Page history displays correct sequence
- [ ] Refresh maintains correct page
- [ ] URL matches displayed page

### 2. Touch Target Sizes (Right-click → Inspect)
In DevTools Console:
```javascript
import { auditAllTouchTargets } from '@/lib/touchTargetValidator.js';
const { violations } = auditAllTouchTargets();
console.log(`Violations: ${violations.length}`);
// Should be 0
```

- [ ] All buttons are at least 44x44px
- [ ] All inputs are at least 44x44px
- [ ] All interactive elements have minimum size

### 3. Focus States
- [ ] Tab through page - focus ring visible
- [ ] Focus ring color matches brand primary
- [ ] Focus outline has 2px offset
- [ ] Disabled buttons have NO focus ring

### 4. Select Elements
- [ ] **Jobs page**: Desktop Radix Select still works
- [ ] **GerenciarNoticias2**: Bottom sheet select opens correctly
- [ ] Search in select works (if searchable)
- [ ] Dark mode styles apply

### 5. Optimistic Updates
#### Like/Unlike (Feed Page)
- [ ] Click heart icon - likes update immediately (no loading)
- [ ] Refresh page - likes stay synced
- [ ] Offline simulation - rollback works

#### Save/Bookmark (Feed Page)
- [ ] Click bookmark - saves immediately
- [ ] Icon fills with color instantly
- [ ] Refresh page - saved state persists

#### Favorite Job (Jobs Page)
- [ ] Click heart on job - favorited instantly
- [ ] Count increases immediately
- [ ] Refresh page - favorite persists

### 6. Safe Area & Layout
- [ ] Header doesn't get hidden by browser UI
- [ ] Bottom nav stays above all content
- [ ] No horizontal scroll on any screen
- [ ] Padding looks consistent across pages

### 7. Keyboard Accessibility
- [ ] Tab navigates through all links/buttons
- [ ] Shift+Tab goes backwards
- [ ] Enter activates buttons
- [ ] Space activates checkboxes
- [ ] Esc closes modals

---

## Mobile Testing (iPhone 12 in DevTools)

### 1. Bottom Sheet Select
**On GerenciarNoticias2 page:**
- [ ] Tap category select - opens bottom sheet
- [ ] Bottom sheet slides up with animation
- [ ] Search box filters options
- [ ] Tap option - selects and closes
- [ ] Handle bar visible at top
- [ ] Close button works

### 2. Touch Targets
**Visual inspection:**
- [ ] All buttons are easily tappable (not tiny)
- [ ] All inputs are at least 44x44px tall
- [ ] Spacing between buttons is adequate
- [ ] No accidental button hits

### 3. Safe Area Insets
**Simulate notch:**
- [ ] In DevTools, toggle "Simulate a notch"
- [ ] Header not clipped by notch
- [ ] Bottom nav above home indicator
- [ ] No horizontal scroll in landscape

### 4. Optimistic Updates on Mobile
#### Feed Page
- [ ] Tap heart - immediate feedback (no delay)
- [ ] Bookmark fills immediately
- [ ] Share button works
- [ ] Comments load quickly

#### Jobs Page
- [ ] Favorite heart updates instantly
- [ ] Pull to refresh works smoothly
- [ ] Filters respond quickly
- [ ] Job list scrolls smoothly

### 5. Mobile Navigation
- [ ] Back button in header works
- [ ] Bottom nav tabs navigate correctly
- [ ] Page transitions are smooth
- [ ] No page flicker on navigation

### 6. Responsive Design
- [ ] Content adapts to viewport width
- [ ] Images scale appropriately
- [ ] Text readable without zoom
- [ ] No horizontal overflow

### 7. Performance (DevTools Performance Tab)
- [ ] List render doesn't cause jank
- [ ] Optimistic updates feel instant
- [ ] Page transitions smooth (60fps)
- [ ] No yellow/red marks in perf timeline

---

## iOS Specific (if testing on real device)

- [ ] Safe area respected near notch
- [ ] Home indicator area clear
- [ ] Bottom sheet smooth swipe gesture
- [ ] Native keyboard doesn't overlap inputs
- [ ] Pull-to-refresh iOS gesture works
- [ ] Double tap doesn't zoom unexpectedly

---

## Android Specific (if testing on real device)

- [ ] Navigation bar not covering content
- [ ] System back gesture works smoothly
- [ ] Bottom sheet swipeable
- [ ] Native keyboard integrates well
- [ ] Pull-to-refresh gesture works
- [ ] Dark mode toggle works

---

## Dark Mode Testing

- [ ] All pages work in dark mode
- [ ] Focus ring visible on dark bg
- [ ] Select component colors work
- [ ] Optimistic update indicators visible
- [ ] No contrast issues
- [ ] Smooth transition when toggling

---

## Accessibility Testing (WAVE Browser Extension)

- [ ] No contrast errors
- [ ] No missing alt text on images
- [ ] All form inputs have labels
- [ ] Semantic HTML structure correct
- [ ] Focus order logical
- [ ] Links descriptive (not "click here")

---

## Data Integrity Testing

### Optimistic Updates with Error Simulation
1. Open DevTools Network tab
2. Throttle to "Slow 3G"
3. Click like/favorite/bookmark
4. Verify UI updates immediately
5. Go offline (DevTools Network > offline)
6. Click like - should rollback if it fails
7. Go back online
8. Refresh - correct state loads from server

- [ ] UI updates immediately
- [ ] Rollback works on network error
- [ ] Server state matches after refresh
- [ ] Error messages clear and helpful

---

## Performance Testing (Lighthouse)

Run Lighthouse audit:
1. DevTools → Lighthouse
2. Device: Mobile
3. Throttling: Fast 3G
4. Run audit

Target scores:
- [ ] Performance: > 85
- [ ] Accessibility: > 90
- [ ] Best Practices: > 85
- [ ] SEO: > 85

---

## Quick Test Script (Copy to Console)

```javascript
// Comprehensive test suite
async function runTests() {
  console.log('🧪 Running Mobile Optimization Tests...\n');
  
  // 1. Touch targets
  const { auditAllTouchTargets } = await import('@/lib/touchTargetValidator.js');
  const { violations } = auditAllTouchTargets();
  console.log(`✅ Touch targets: ${violations.length} violations (should be 0)`);
  
  // 2. Safe areas
  const sat = getComputedStyle(document.documentElement).getPropertyValue('--sat');
  const sab = getComputedStyle(document.documentElement).getPropertyValue('--sab');
  console.log(`✅ Safe area top: ${sat}, bottom: ${sab}`);
  
  // 3. Viewport
  console.log(`✅ Viewport: ${window.innerWidth}x${window.innerHeight}`);
  
  // 4. Focus visible
  const focusElements = document.querySelectorAll(':focus-visible');
  console.log(`✅ Focus visible elements: ${focusElements.length}`);
  
  console.log('\n🎉 Test suite complete!');
}

runTests();
```

---

## Regression Testing

Make sure nothing broke:

- [ ] Job search and filters work
- [ ] Favorites persist after refresh
- [ ] Feed posts load and display
- [ ] Comments can be posted
- [ ] User profile editable
- [ ] Premium features gated correctly
- [ ] Admin panels functional
- [ ] No console errors

---

## Common Issues & Solutions

### Issue: Focus ring not showing
**Solution**: Check DevTools → Styles, look for `outline: 2px` CSS rule

### Issue: Select broken on mobile
**Solution**: Ensure `MobileBottomSheetSelect` imported (not native Select)

### Issue: Slow optimistic updates
**Solution**: Check React Query queryClient is properly configured

### Issue: Safe area not working
**Solution**: Check CSS variables loaded (DevTools → Styles → :root)

### Issue: Touch targets appear small
**Solution**: Check `min-h-[44px]` class applied via DevTools Inspector

---

## Sign-Off

When all tests pass, mark as complete:

- [ ] Desktop browser testing complete
- [ ] Mobile responsive testing complete
- [ ] Accessibility testing complete
- [ ] Performance testing complete
- [ ] Regression testing complete
- [ ] Dark mode testing complete
- [ ] iOS testing complete (if available)
- [ ] Android testing complete (if available)

**✅ Refactoring verified and production-ready!**