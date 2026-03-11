/**
 * File Description:
 * This file implements apps/api/src/infrastructure/queues/task.queue.ts.
 *
 * Purpose:
 * Provide module-specific logic used by the project runtime.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import { Queue, Worker } from 'bullmq';
import { env } from '@/infrastructure/config/env';
import { logger } from '@/infrastructure/logger/logger';
import { taskRepository } from '@/infrastructure/repositories/task.repository';
import { aiService } from '@/services/aiService';

const connection = { url: env.REDIS_URL };

let queue: Queue | null = null;
let workerStarted = false;

/** Purpose: Execute getReminderQueue logic for this module. */
export function getReminderQueue() {
  queue ??= new Queue('task-reminders', { connection });

  if (!workerStarted && process.env.ENABLE_QUEUE_WORKER === 'true') {
    const worker = new Worker(
      'task-reminders',
      async (job) => {
        if (job.name === 'archive-task' && typeof job.data?.taskId === 'string') {
          await taskRepository.archiveTaskByIdIfDue(job.data.taskId);
          logger.info({ jobId: job.id, taskId: job.data.taskId }, 'Processed archive-task job');
          return;
        }

        if (
          job.name === 'ai-categorize-task' &&
          typeof job.data?.taskId === 'string' &&
          typeof job.data?.title === 'string' &&
          typeof job.data?.description === 'string'
        ) {
          const categoryResult = await aiService.categorizeIssue({
            title: job.data.title,
            description: job.data.description
          });

          await taskRepository.update(job.data.taskId, {
            category: categoryResult.category
          } as never);

          logger.info({ jobId: job.id, taskId: job.data.taskId, category: categoryResult.category }, 'Processed ai-categorize-task job');
          return;
        }

        // In production, integrate email/SMS/push provider.
        logger.info({ jobId: job.id, payload: job.data }, 'Processed reminder job');
      },
      { connection }
    );

    worker.on('error', (error) => {
      logger.error({ err: error }, 'Reminder worker error');
    });

    workerStarted = true;
  }

  return queue;
}

/** Purpose: Execute scheduleTaskArchive logic for this module. */
export async function scheduleTaskArchive(taskId: string, closedAt: Date) {
  const queueRef = getReminderQueue();
  const archiveAtMs = closedAt.getTime() + 30 * 24 * 60 * 60 * 1000;
  const delay = Math.max(0, archiveAtMs - Date.now());

  await queueRef.add(
    'archive-task',
    { taskId },
    {
      delay,
      removeOnComplete: true,
      removeOnFail: 50
    }
  );
}

/** Purpose: Execute scheduleAICategorization logic for this module. */
export async function scheduleAICategorization(taskId: string, title: string, description: string) {
  if (process.env.ENABLE_QUEUE_WORKER === 'true') {
    await getReminderQueue().add(
      'ai-categorize-task',
      { taskId, title, description },
      {
        removeOnComplete: true,
        removeOnFail: 100
      }
    );
    return;
  }

  void (async () => {
    try {
      const categoryResult = await aiService.categorizeIssue({ title, description });
      await taskRepository.update(taskId, { category: categoryResult.category } as never);
      logger.info({ taskId, category: categoryResult.category }, 'Processed ai-categorize-task fallback execution');
    } catch (error) {
      logger.warn({ err: error, taskId }, 'AI category background processing failed');
    }
  })();
}
