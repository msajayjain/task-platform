/**
 * File Description:
 * This file implements apps/api/src/infrastructure/repositories/ui-config.repository.ts.
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

/** Purpose: Expose uiConfigRepository operations for this module. */
export const uiConfigRepository = {
  /** Purpose: Execute list operation for this module. */
  list(screenName?: string) {
    return prisma.uIConfiguration.findMany({
      where: screenName ? { screenName } : undefined,
      orderBy: [{ screenName: 'asc' }, { displayOrder: 'asc' }]
    });
  },

  /** Purpose: Execute replaceScreenConfig operation for this module. */
  async replaceScreenConfig(screenName: string, fields: Array<{ fieldName: string; displayOrder: number; isVisible: boolean }>) {
    await prisma.$transaction([
      prisma.uIConfiguration.deleteMany({ where: { screenName } }),
      prisma.uIConfiguration.createMany({
        data: fields.map((field) => ({
          screenName,
          fieldName: field.fieldName,
          displayOrder: field.displayOrder,
          isVisible: field.isVisible
        }))
      })
    ]);

    return this.list(screenName);
  }
};
