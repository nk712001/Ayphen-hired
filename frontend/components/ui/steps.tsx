'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StepProps {
  title: string;
  completed?: boolean;
  active?: boolean;
  children?: React.ReactNode;
}

interface StepsProps {
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
}

export const Step: React.FC<StepProps> = ({
  title,
  completed = false,
  active = false,
  children,
}) => {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
          completed
            ? "bg-primary border-primary text-white"
            : active
            ? "border-primary text-primary"
            : "border-gray-300 text-gray-400"
        )}
      >
        {completed ? (
          <Check className="h-4 w-4" />
        ) : (
          <span className="text-sm font-medium">{active ? "•" : ""}</span>
        )}
      </div>
      <span
        className={cn(
          "mt-2 text-sm font-medium",
          completed
            ? "text-primary"
            : active
            ? "text-primary"
            : "text-gray-500"
        )}
      >
        {title}
      </span>
      {children}
    </div>
  );
};

export const Steps: React.FC<StepsProps> = ({
  currentStep,
  totalSteps,
  children,
}) => {
  // Convert children to array to make it easier to work with
  const childrenArray = React.Children.toArray(children);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center relative">
        {/* Progress bar */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${Math.max(0, (currentStep / (totalSteps - 1)) * 100)}%`,
            }}
          />
        </div>

        {/* Steps */}
        {React.Children.map(childrenArray, (child, index) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<StepProps>, {
              completed: index < currentStep,
              active: index === currentStep,
            });
          }
          return child;
        })}
      </div>
    </div>
  );
};
