/**
 * File Description:
 * This file implements apps/web/src/components/ui/required-label.tsx.
 *
 * Purpose:
 * Provide a reusable label component that visually marks required form fields.
 *
 * Key Responsibilities:
 * - Render consistent label styling.
 * - Append a required indicator marker.
 * - Support htmlFor and standard label attributes.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

type RequiredLabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

/** Purpose: Render a standardized required-field label with a red asterisk marker. */
export function RequiredLabel({ className, children, ...props }: Readonly<RequiredLabelProps>) {
  return (
    <label className={cn('mb-1 block text-xs font-semibold text-slate-700', className)} {...props}>
      {children} <span aria-hidden="true" className="text-red-600">*</span>
    </label>
  );
}
