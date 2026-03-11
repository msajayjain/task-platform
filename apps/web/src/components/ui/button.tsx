/**
 * File Description:
 * This file implements apps/web/src/components/ui/button.tsx.
 *
 * Purpose:
 * Render reusable UI building blocks and interaction views.
 *
 * Key Responsibilities:
 * - Render UI states.
 * - Handle user interactions.
 * - Compose reusable presentation blocks.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

/** Purpose: Execute Button logic for this module. */
export function Button({ className, ...props }: Readonly<React.ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      className={cn('rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50', className)}
      {...props}
    />
  );
}
