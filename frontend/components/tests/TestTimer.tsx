'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestTimerProps {
  initialTimeRemaining: number; // in seconds
  onTimeUp: () => void;
  onTick?: (timeRemaining: number) => void;
  className?: string;
}

export default function TestTimer({
  initialTimeRemaining,
  onTimeUp,
  onTick,
  className,
}: TestTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining);
  const [isMounted, setIsMounted] = useState(false);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle timer countdown
  useEffect(() => {
    setIsMounted(true);

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []); // Only run once on mount

  // Handle side effects
  useEffect(() => {
    if (timeRemaining <= 0) {
      onTimeUp();
    } else {
      onTick?.(timeRemaining);
    }
  }, [timeRemaining, onTimeUp, onTick]);

  // Calculate warning and danger thresholds
  const isWarning = timeRemaining <= 300; // 5 minutes
  const isDanger = timeRemaining <= 60; // 1 minute

  if (!isMounted) {
    return (
      <div className={cn("flex items-center text-muted-foreground", className)}>
        <Clock className="w-4 h-4 mr-1.5" />
        <span>--:--</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center font-medium",
        isDanger ? "text-red-600" : isWarning ? "text-amber-500" : "text-foreground",
        className
      )}
    >
      <Clock className={cn("w-4 h-4 mr-1.5", {
        "animate-pulse": isDanger,
      })} />
      <span>{formatTime(timeRemaining)}</span>

      {isWarning && (
        <span className="ml-2 text-xs font-normal">
          {isDanger ? 'Hurry!' : 'Time running out'}
        </span>
      )}
    </div>
  );
}
