import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Enhanced Input with guaranteed 44px touch target and focus states
 */
const EnhancedInput = React.forwardRef(({
  className,
  ...props
}, ref) => {
  return (
    <Input
      ref={ref}
      className={cn(
        'min-h-[44px] px-3 py-2.5',
        'text-base', // Prevent iOS zoom
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        className
      )}
      {...props}
    />
  );
});

EnhancedInput.displayName = 'EnhancedInput';

export default EnhancedInput;