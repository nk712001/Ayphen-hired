import React, { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'default' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2';
  
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-white hover:bg-primary-dark hover:shadow-md focus:ring-primary-400 border border-transparent transition-all duration-200',
    secondary: 'bg-secondary text-white hover:bg-secondary-dark hover:shadow-md focus:ring-secondary-400 border border-transparent transition-all duration-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-md focus:ring-red-500 border border-transparent transition-all duration-200',
    ghost: 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm focus:ring-gray-300 border border-transparent transition-all duration-200',
    outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 hover:border-primary-300 hover:text-primary-700 hover:shadow-md focus:ring-primary-100 shadow-sm transition-all duration-200',
    link: 'bg-transparent text-primary hover:underline underline-offset-4 focus:ring-primary-100',
    default: 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md focus:ring-gray-200 border border-gray-300 transition-all duration-200',
  };

  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    icon: 'p-2',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
