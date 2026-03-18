import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Memoized card item to prevent unnecessary re-renders
 */
const OptimizedCardItem = memo(({ children, className = '', ...props }) => (
  <Card className={`touch-feedback hover:shadow-lg transition ${className}`} {...props}>
    <CardContent className="p-4 sm:p-6">
      {children}
    </CardContent>
  </Card>
), (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className
  );
});

OptimizedCardItem.displayName = 'OptimizedCardItem';

export default OptimizedCardItem;