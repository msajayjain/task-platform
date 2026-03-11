/**
 * File Description:
 * AI task parsing service.
 *
 * Purpose:
 * Convert natural-language task input into a normalized, safe task payload.
 *
 * Key Responsibilities:
 * - Call AI parser service.
 * - Normalize and clamp generated fields.
 * - Throw structured application errors on invalid AI output.
 */

import { TaskPriority, TaskStatus } from '@task-platform/types';
import { AppError } from '@/application/errors/app-error';
import { aiService } from '@/services/aiService';
interface ParsedTask {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string | null;
  status: TaskStatus;
}

/** Purpose: Normalize and bound AI-generated titles to a readable max length. */
function clampTitle(title: string, max = 120) {
  const clean = title.trim().replaceAll(/\s+/g, ' ');
  if (clean.length <= max) return clean;

  const bounded = clean.slice(0, max);
  const lastSpace = bounded.lastIndexOf(' ');
  return (lastSpace > 20 ? bounded.slice(0, lastSpace) : bounded).trim();
}

/** Purpose: Expose aiTaskService operations for this module. */
export const aiTaskService = {
  /** Purpose: Parse natural-language text into validated task fields for creation flow. */
  async parseNaturalLanguageToTask(text: string): Promise<ParsedTask> {
    try {
      const parsed = await aiService.parseNaturalLanguageTask({ text });
      if (!parsed.title || !parsed.priority || !parsed.status) {
        throw new Error('Invalid AI response payload');
      }

      const title = clampTitle(parsed.title ?? 'Untitled issue');
      const description = (parsed.description ?? '').trim();
      const normalizedPriority: TaskPriority = parsed.priority === 'UNKNOWN' ? 'MEDIUM' : parsed.priority;

      if (title.length > 120) {
        throw new Error('AI-generated title exceeds 120 characters');
      }

      return {
        title: title.trim(),
        description: description.trim(),
        priority: normalizedPriority,
        dueDate: parsed.dueDate ?? null,
        status: parsed.status
      };
    } catch {
      throw new AppError('Failed to parse AI task response', 422);
    }
  }
};
