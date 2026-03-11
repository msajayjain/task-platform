/**
 * File Description:
 * This file implements apps/web/src/components/ui/select.tsx.
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

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn('w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500', className)}
        {...props}
      />
    );
  }
);
