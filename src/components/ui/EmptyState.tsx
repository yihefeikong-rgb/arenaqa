// ============================================================
// EmptyState — 空状态组件
// 设计规范：6.4 表格空状态
// ============================================================

'use client';

import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 py-12">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary-light)] flex items-center justify-center mb-4 text-[var(--color-primary)]">
          {icon}
        </div>
      )}
      <h3 className="text-[var(--font-h3)] font-medium text-[var(--color-text-primary)] mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-[var(--font-body)] text-[var(--color-text-secondary)] leading-relaxed max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
