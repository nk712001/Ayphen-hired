"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  className?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(({ 
  value = 0, 
  max = 100, 
  className, 
  ...props 
}, ref) => {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100)
  
  // Extract any bg-* classes from className
  const bgColorClass = className?.split(' ').find(cls => cls.startsWith('bg-')) || 'bg-primary'

  return (
    <div
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full transition-all duration-300 ease-in-out",
          bgColorClass
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
})

Progress.displayName = "Progress"

export { Progress }
