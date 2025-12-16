'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DrawerContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface DrawerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface DrawerTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

interface DrawerDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

interface DrawerFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface DrawerCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

const Drawer = ({ open, onOpenChange, children }: DrawerProps) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  );
};

const DrawerContent = React.forwardRef<HTMLDivElement, DrawerContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-lg transform transition-transform duration-300 ease-in-out",
          "flex flex-col",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DrawerContent.displayName = 'DrawerContent';

const DrawerHeader = React.forwardRef<HTMLDivElement, DrawerHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between p-6 border-b",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DrawerHeader.displayName = 'DrawerHeader';

const DrawerTitle = React.forwardRef<HTMLHeadingElement, DrawerTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h2
        ref={ref}
        className={cn(
          "text-lg font-semibold text-gray-900",
          className
        )}
        {...props}
      >
        {children}
      </h2>
    );
  }
);
DrawerTitle.displayName = 'DrawerTitle';

const DrawerDescription = React.forwardRef<HTMLParagraphElement, DrawerDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(
          "text-sm text-gray-500",
          className
        )}
        {...props}
      >
        {children}
      </p>
    );
  }
);
DrawerDescription.displayName = 'DrawerDescription';

const DrawerClose = React.forwardRef<HTMLButtonElement, DrawerCloseProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:pointer-events-none",
          className
        )}
        {...props}
      >
        {children || <X className="h-4 w-4" />}
        <span className="sr-only">Close</span>
      </button>
    );
  }
);
DrawerClose.displayName = 'DrawerClose';

const DrawerFooter = React.forwardRef<HTMLDivElement, DrawerFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-end gap-3 p-6 border-t mt-auto",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DrawerFooter.displayName = 'DrawerFooter';

export {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  DrawerFooter,
};
