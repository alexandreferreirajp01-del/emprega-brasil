import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Enhanced Button with guaranteed 44px touch target and focus states
 */
const EnhancedButton = React.forwardRef(({
  className,
  size = 'default',
  children,
  asChild = false,
  ...props
}, ref) => {
  // Enforce minimum touch target size
  const sizeClasses = {
    default: 'min-h-[44px] min-w-[44px] px-4 py-2',
    sm: 'min-h-[44px] min-w-[44px] px-3 py-2',
    lg: 'min-h-[44px] min-w-[44px] px-8 py-3',
    icon: 'min-h-[44px] min-w-[44px]',
  };

  return (
    <Button
      ref={ref}
      size={size}
      className={cn(
        sizeClasses[size],
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        'active:scale-[0.98] transition-transform',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
});

EnhancedButton.displayName = 'EnhancedButton';

export default EnhancedButton;