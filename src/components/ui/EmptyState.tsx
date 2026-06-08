// ============================================================
// EmptyState — 空状态组件 v2.1
// 对齐设计规范：内容为王、视觉层次
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
    <div className="flex flex-col items-center justify-center h-full text-center px-8 py-12 animate-fade-in">
      {icon && (
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-[var(--color-primary)]"
             style={{ background: 'var(--color-primary-light)' }}>
          {icon}
        </div>
      )}
      <h3 className="text-[var(--font-h3)] font-medium text-[var(--color-text-primary)] mb-1.5 leading-tight">
        {title}
      </h3>
      {description && (
        <p className="text-[var(--font-body)] text-[var(--color-text-secondary)] leading-relaxed max-w-[260px]">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
