import React from 'react';
import { motion } from 'framer-motion';
import { useNavigation } from '@/lib/NavigationProvider';
import { pageTransitionVariants, mobilePageTransitionVariants } from '@/lib/pageTransitions';
import { useMediaQuery } from '@/hooks/use-mobile';

export default function PageTransitionWrapper({ children, pageName }) {
  const { isBackNavigation } = useNavigation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const direction = isBackNavigation ? 'back' : 'forward';
  const variants = isMobile ? mobilePageTransitionVariants : pageTransitionVariants;

  return (
    <motion.div
      key={pageName}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      custom={direction}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}