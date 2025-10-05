import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}

export function AnimatedCounter({ 
  value, 
  duration = 1000, 
  suffix = '', 
  prefix = '' 
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    // Only animate if value has changed
    if (prevValueRef.current === value) {
      setCount(value);
      return;
    }

    setIsAnimating(true);
    const startValue = prevValueRef.current;
    const endValue = value;
    const startTime = Date.now();
    const difference = endValue - startValue;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (easeOutQuad)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(startValue + difference * easeProgress);

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
        setIsAnimating(false);
        prevValueRef.current = endValue;
      }
    };

    requestAnimationFrame(animate);

    return () => {
      prevValueRef.current = value;
    };
  }, [value, duration]);

  return (
    <span className={`inline-block transition-all ${isAnimating ? 'scale-110' : 'scale-100'}`}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}