// Consistent Framer Motion animations for page transitions
export const pageTransitionVariants = {
  initial: (direction) => ({
    opacity: 0,
    x: direction === 'forward' ? 300 : -300,
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction === 'forward' ? -300 : 300,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  }),
};

export const mobilePageTransitionVariants = {
  initial: (direction) => ({
    opacity: 0,
    x: direction === 'forward' ? 200 : -200,
    y: 0,
  }),
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      duration: 0.25,
      ease: 'easeOut',
    },
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction === 'forward' ? -200 : 200,
    y: 0,
    transition: {
      duration: 0.25,
      ease: 'easeIn',
    },
  }),
};

// Simplified transition for reduced motion
export const reducedMotionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
};