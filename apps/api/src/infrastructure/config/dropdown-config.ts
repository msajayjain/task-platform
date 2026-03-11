/**
 * File Description:
 * This file implements apps/api/src/infrastructure/config/dropdown-config.ts.
 *
 * Purpose:
 * Provide module-specific logic used by the project runtime.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { AppError } from '@/application/errors/app-error';

const dropdownSchema = z.object({
  declineReasons: z.array(z.string().trim().min(1)).min(1)
});

export type DropdownConfig = z.infer<typeof dropdownSchema>;

const candidatePaths = [
  resolve(process.cwd(), 'config/dropdowns.json'),
  resolve(process.cwd(), '../../config/dropdowns.json')
];

/** Purpose: Execute getDropdownConfig logic for this module. */
export function getDropdownConfig(): DropdownConfig {
  const configPath = candidatePaths.find((path) => existsSync(path));
  if (!configPath) {
    throw new AppError('Dropdown configuration not found', 500);
  }

  const raw = readFileSync(configPath, 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  return dropdownSchema.parse(parsed);
}
