// ============================================================
// Button — 按钮组件
// 设计规范：6.1 按钮
// 类型: primary / secondary / text / icon
// 状态: Normal / Hover / Active / Disabled / Loading
// ============================================================

'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

const variantStyles: Record<string, string> = {
  primary:
    'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] active:translate-y-[1px] shadow-[var(--shadow-1)]',
  secondary:
    'bg-transparent text-[var(--color-primary)] border border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] active:brightness-90',
  text:
    'bg-transparent text-[var(--color-text-body)] hover:bg-[var(--color-bg)] active:brightness-90',
  icon:
    'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text-primary)] active:brightness-90',
};

const sizeStyles: Record<string, string> = {
  sm: 'h-8 text-[12px] px-2',
  md: 'h-10 text-[14px] px-6',
  lg: 'h-12 text-[16px] px-8',
};

const iconSizeStyles: Record<string, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, icon, children, className = '', disabled, ...props }, ref) => {
    const isIconOnly = variant === 'icon' || (icon && !children);

    const base = isIconOnly
      ? iconSizeStyles[size]
      : sizeStyles[size];

    const variantClass = variantStyles[variant] ?? variantStyles.primary;

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2
          rounded-[var(--radius-sm)] font-medium
          transition-all duration-150 ease-out
          disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
          ${base}
          ${variantClass}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin"
              width="16" height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            {children && <span className="opacity-70">{children}</span>}
          </span>
        ) : (
          <>
            {icon}
            {children}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
