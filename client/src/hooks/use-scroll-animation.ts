import { useAnimation, Variants } from "motion/react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

export function useScrollAnimation(
  variants: Variants,
  triggerOnce = true,
  threshold = 0.1,
  delay = 0
) {
  const controls = useAnimation();
  const [ref, inView] = useInView({ triggerOnce, threshold });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    } else if (!triggerOnce) {
      controls.start("hidden");
    }
  }, [controls, inView, triggerOnce]);

  return {
    ref,
    controls,
    initial: "hidden",
    animate: controls,
    variants,
    transition: { delay },
  };
}
