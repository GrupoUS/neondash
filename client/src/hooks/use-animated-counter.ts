import { animate, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";

export function useAnimatedCounter(
  from: number,
  to: number,
  duration = 1,
  delay = 0
) {
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, to, { duration, delay, ease: "easeOut" });
    return controls.stop;
  }, [from, to, duration, delay, count]);

  return rounded;
}
