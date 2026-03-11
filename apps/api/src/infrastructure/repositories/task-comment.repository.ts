/**
 * File Description:
 * This file implements apps/api/src/infrastructure/repositories/task-comment.repository.ts.
 *
 * Purpose:
 * Provide persistence access and data retrieval operations.
 *
 * Key Responsibilities:
 * - Query and persist data.
 * - Encapsulate storage-specific logic.
 * - Return typed data objects.
 */

import { prisma } from '@/infrastructure/db/prisma';

/** Purpose: Expose taskCommentRepository operations for this module. */
export const taskCommentRepository = {
  /** Purpose: Execute listByTaskId operation for this module. */
  listByTaskId(taskId: string) {
    return prisma.taskComment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  },

  /** Purpose: Execute create operation for this module. */
  create(input: { taskId: string; authorId: string; content: string }) {
    return prisma.taskComment.create({
      data: {
        taskId: input.taskId,
        authorId: input.authorId,
        content: input.content
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }
};
