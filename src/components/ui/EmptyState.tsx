// ============================================================
// EmptyState — 空状态组件 v2.0
// 深色主题优化
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
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3.5 text-[var(--color-primary)]"
             style={{ background: 'var(--color-primary-light)' }}>
          {icon}
        </div>
      )}
      <h3 className="text-[15px] font-medium text-[var(--color-text-primary)] mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed max-w-[240px]">
          {description}
        </p>
      )}
      {action && <div className="mt-3.5">{action}</div>}
    </div>
  );
}
