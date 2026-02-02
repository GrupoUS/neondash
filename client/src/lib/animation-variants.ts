import type { Variants } from "motion/react";

// Prefers-reduced-motion detection
const prefersReducedMotion =
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// No-op variants for reduced motion
const noOpVariants: Variants = {
  initial: {},
  animate: {},
  exit: {},
};

// Helper to conditionally return variants based on motion preference
export function getVariants(variants: Variants): Variants {
  return prefersReducedMotion ? noOpVariants : variants;
}

export const transition = prefersReducedMotion
  ? { duration: 0 }
  : {
      type: "spring",
      stiffness: 300,
      damping: 30,
    };

export const springTransition = prefersReducedMotion
  ? { duration: 0 }
  : {
      type: "spring",
      stiffness: 500,
      damping: 30,
    };

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const slideDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const slideLeft: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const slideRight: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: prefersReducedMotion ? 0 : 0.05,
      delayChildren: 0.1,
    },
  },
};

export const accordion: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
};

// Advanced Variants

export const textVariant = (delay: number): Variants => ({
  hidden: {
    y: 50,
    opacity: 0,
  },
  show: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      duration: 1.25,
      delay,
    },
  },
});

export const glowPulse: Variants = {
  initial: { boxShadow: "0 0 0 rgba(255, 215, 0, 0)" },
  animate: {
    boxShadow: [
      "0 0 0 rgba(255, 215, 0, 0)",
      "0 0 20px rgba(255, 215, 0, 0.3)",
      "0 0 0 rgba(255, 215, 0, 0)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const floatingAnimation: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const animations = {
  fadeIn,
  slideUp,
  slideDown,
  slideLeft,
  slideRight,
  scaleIn,
  staggerContainer,
  accordion,
  textVariant,
  glowPulse,
  floatingAnimation,
};
