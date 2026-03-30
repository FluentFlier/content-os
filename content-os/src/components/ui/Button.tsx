'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Skeleton } from './Skeleton';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-[#EB5E55] text-white border-0 hover:opacity-90',
  secondary:
    'bg-[#F4F2EF] border-[0.5px] border-[rgba(26,23,20,0.12)] text-[#1A1714] hover:bg-[#EDECEA]',
  ghost:
    'bg-transparent border-[0.5px] border-[rgba(26,23,20,0.12)] text-[#4A4540] hover:bg-[#EDECEA]',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-[14px] py-[7px] text-[13px]',
  md: 'px-5 py-[10px] text-[13px]',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      className = '',
      children,
      ...rest
    },
    ref,
  ) => {
    const padding = variant === 'primary' ? sizeStyles[size] : sizeStyles.sm;

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 rounded-[7px] font-['Space_Grotesk'] font-medium transition-all duration-100 disabled:opacity-50 disabled:pointer-events-none ${variantStyles[variant]} ${padding} ${className}`}
        {...rest}
      >
        {loading && <Skeleton className="h-4 w-4 rounded" />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
export { Button };
export type { ButtonProps };
