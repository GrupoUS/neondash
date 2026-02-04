import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: "circle" | "square" | "star";
}

interface CelebrationEffectProps {
  trigger: boolean;
  onComplete?: () => void;
  className?: string;
  duration?: number;
  particleCount?: number;
  colors?: string[];
}

/**
 * CelebrationEffect - Canvas-based confetti celebration animation
 *
 * Features:
 * - Lightweight canvas particles
 * - Gold-themed colors by default
 * - Respects prefers-reduced-motion
 * - Auto-cleanup after animation
 * - Multiple particle shapes
 */
export function CelebrationEffect({
  trigger,
  onComplete,
  className,
  duration = 1500,
  particleCount = 30,
  colors = [
    "hsl(38 60% 45%)", // Gold primary
    "hsl(38 70% 55%)", // Gold light
    "hsl(38 50% 35%)", // Gold dark
    "hsl(45 90% 60%)", // Yellow gold
    "hsl(30 80% 50%)", // Orange gold
  ],
}: CelebrationEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [isAnimating, setIsAnimating] = useState(false);

  const createParticles = useCallback(
    (centerX: number, centerY: number): Particle[] => {
      const particles: Particle[] = [];
      const shapes: Array<"circle" | "square" | "star"> = ["circle", "square", "star"];

      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
        const velocity = 3 + Math.random() * 4;

        particles.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - 2,
          size: 4 + Math.random() * 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          opacity: 1,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
        });
      }
      return particles;
    },
    [colors, particleCount]
  );

  const drawParticle = useCallback((ctx: CanvasRenderingContext2D, particle: Particle) => {
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    ctx.globalAlpha = particle.opacity;
    ctx.fillStyle = particle.color;

    switch (particle.shape) {
      case "circle":
        ctx.beginPath();
        ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "square":
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        break;
      case "star":
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
          const x = Math.cos(angle) * particle.size;
          const y = Math.sin(angle) * particle.size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          const innerAngle = angle + Math.PI / 5;
          const innerX = Math.cos(innerAngle) * (particle.size / 2);
          const innerY = Math.sin(innerAngle) * (particle.size / 2);
          ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
        break;
    }
    ctx.restore();
  }, []);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!trigger || prefersReducedMotion) {
      if (trigger && prefersReducedMotion && onComplete) {
        onComplete();
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Create particles from center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const particles = createParticles(centerX, centerY);

    setIsAnimating(true);
    const startTime = performance.now();
    const gravity = 0.15;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        // Clear canvas before hiding to prevent frozen stars
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsAnimating(false);
        if (onComplete) onComplete();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const particle of particles) {
        // Update physics
        particle.vy += gravity;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;

        // Fade out
        particle.opacity = 1 - progress;

        // Draw
        drawParticle(ctx, particle);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Clear canvas on cleanup to prevent frozen frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [trigger, duration, createParticles, drawParticle, onComplete]);

  if (!isAnimating && !trigger) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={cn("pointer-events-none absolute inset-0 z-50", className)}
    />
  );
}

/**
 * Hook for triggering celebration effect
 */
export function useCelebration() {
  const [celebrationKey, setCelebrationKey] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const celebrate = useCallback(() => {
    setCelebrationKey((prev) => prev + 1);
    setIsActive(true);
  }, []);

  const handleComplete = useCallback(() => {
    setIsActive(false);
  }, []);

  return {
    celebrationKey,
    isActive,
    celebrate,
    handleComplete,
  };
}
