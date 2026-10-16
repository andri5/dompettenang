/**
 * Dompet Tenang - Page Transition Component
 * Provides animated transitions between pages with fade and slide effects
 */

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: ReactNode;
  delay?: number;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -20,
  },
};

const pageTransition = {
  type: 'tween' as const,
  ease: 'anticipate' as const,
  duration: 0.4,
};

export function PageTransition({
  children,
  delay = 0,
}: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={{ ...pageTransition, delay }}
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  );
}
