/**
 * File Description:
 * This file implements packages/ui/src/index.tsx.
 *
 * Purpose:
 * Provide module-specific logic used by the project runtime.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import React from 'react';

/** Purpose: Execute Card logic for this module. */
export function Card({ children, className = '' }: Readonly<{ children: React.ReactNode; className?: string }>) {
  return <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>;
}

/** Purpose: Execute Pill logic for this module. */
export function Pill({ text, tone = 'neutral' }: Readonly<{ text: string; tone?: 'neutral' | 'success' | 'warning' }>) {
  const styles = {
    neutral: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700'
  } as const;
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[tone]}`}>{text}</span>;
}
