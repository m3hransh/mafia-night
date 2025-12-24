import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'success' | 'danger' | 'secondary';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  scaleOnHover?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800',
  success: 'bg-green-600 hover:bg-green-700 disabled:bg-gray-600',
  danger: 'bg-red-600 hover:bg-red-700 disabled:bg-red-800',
  secondary: 'bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-3 text-lg',
  xl: 'px-12 py-4 text-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  scaleOnHover = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'text-white font-bold rounded-xl transition-all disabled:cursor-not-allowed';
  const widthStyles = fullWidth ? 'w-full' : '';
  const scaleStyles = scaleOnHover ? 'transform hover:scale-105' : '';

  const combinedClassName = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    widthStyles,
    scaleStyles,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={combinedClassName}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
