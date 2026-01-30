import React, { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'default' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}, ref) => {
  const baseStyles = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 inline-flex items-center justify-center';

  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md focus:ring-primary/50 border border-transparent transition-all duration-200',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-md focus:ring-secondary/50 border border-transparent transition-all duration-200',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-md focus:ring-destructive/50 border border-transparent transition-all duration-200',
    ghost: 'hover:bg-accent hover:text-accent-foreground transition-all duration-200',
    outline: 'bg-background text-primary border border-input hover:bg-accent hover:text-accent-foreground hover:border-primary hover:shadow-md focus:ring-primary/20 shadow-sm transition-all duration-200',
    link: 'bg-transparent text-primary hover:underline underline-offset-4 focus:ring-primary/20',
    default: 'bg-background text-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-md focus:ring-ring border border-input transition-all duration-200',
  };

  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    icon: 'p-2 h-9 w-9',
  };

  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
