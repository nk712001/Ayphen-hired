"use client";

import React, { useEffect, useState, useCallback } from 'react';

interface TimerProps {
  durationMinutes: number;
  onTimeUp: () => void;
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({
  durationMinutes,
  onTimeUp,
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [isWarning, setIsWarning] = useState(false);

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const pad = (num: number): string => num.toString().padStart(2, '0');

    return hours > 0
      ? `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`
      : `${pad(minutes)}:${pad(remainingSeconds)}`;
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeUp]);

  useEffect(() => {
    // Set warning state when 5 minutes or less remaining
    setIsWarning(timeLeft <= 300);
  }, [timeLeft]);

  return (
    <div
      className={`
        px-4 py-2 rounded-lg font-mono text-lg font-bold
        ${isWarning ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}
        ${className}
      `}
    >
      {formatTime(timeLeft)}
    </div>
  );
};
