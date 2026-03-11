/**
 * File Description:
 * This file implements apps/web/src/app/layout.tsx.
 *
 * Purpose:
 * Provide module-specific logic used by the project runtime.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import './globals.css';
import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/toast-provider';

interface RootLayoutProps {
  readonly children: ReactNode;
}

/** Purpose: Execute RootLayout logic for this module. */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
