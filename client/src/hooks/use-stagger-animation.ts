import { useAnimation, Variants } from "motion/react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

export function useStaggerAnimation(
  delay = 0.05,
  triggerOnce = true,
  threshold = 0.1
) {
  const controls = useAnimation();
  const [ref, inView] = useInView({ triggerOnce, threshold });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delay,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return { ref, controls, containerVariants, itemVariants };
}
