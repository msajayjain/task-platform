/**
 * File Description:
 * This file implements apps/api/src/application/services/ui-config.service.ts.
 *
 * Purpose:
 * Implement business/feature orchestration logic.
 *
 * Key Responsibilities:
 * - Execute feature/business rules.
 * - Coordinate dependencies (repositories/AI/cache).
 * - Return normalized results/errors.
 */

import { AppError } from '@/application/errors/app-error';
import { uiConfigRepository } from '@/infrastructure/repositories/ui-config.repository';

const defaultConfig: Record<string, Array<{ fieldName: string; displayOrder: number; isVisible: boolean }>> = {
  'create-task': [
    { fieldName: 'title', displayOrder: 0, isVisible: true },
    { fieldName: 'description', displayOrder: 1, isVisible: true },
    { fieldName: 'priority', displayOrder: 2, isVisible: true },
    { fieldName: 'dueDate', displayOrder: 3, isVisible: true },
    { fieldName: 'assignedTeam', displayOrder: 4, isVisible: true },
    { fieldName: 'assignedUser', displayOrder: 5, isVisible: true },
    { fieldName: 'comments', displayOrder: 6, isVisible: true }
  ],
  'task-details': [
    { fieldName: 'title', displayOrder: 0, isVisible: true },
    { fieldName: 'description', displayOrder: 1, isVisible: true },
    { fieldName: 'status', displayOrder: 2, isVisible: true },
    { fieldName: 'priority', displayOrder: 3, isVisible: true },
    { fieldName: 'dueDate', displayOrder: 4, isVisible: true },
    { fieldName: 'assignedTeam', displayOrder: 5, isVisible: true },
    { fieldName: 'assignedUser', displayOrder: 6, isVisible: true },
    { fieldName: 'createdBy', displayOrder: 7, isVisible: true },
    { fieldName: 'createdDate', displayOrder: 8, isVisible: true },
    { fieldName: 'updatedDate', displayOrder: 9, isVisible: true },
    { fieldName: 'comments', displayOrder: 10, isVisible: true },
    { fieldName: 'declineHistory', displayOrder: 11, isVisible: true }
  ],
  'my-created-grid': [
    { fieldName: 'title', displayOrder: 0, isVisible: true },
    { fieldName: 'description', displayOrder: 1, isVisible: true },
    { fieldName: 'status', displayOrder: 2, isVisible: true },
    { fieldName: 'priority', displayOrder: 3, isVisible: true },
    { fieldName: 'dueDate', displayOrder: 4, isVisible: true },
    { fieldName: 'assignedTeam', displayOrder: 5, isVisible: true },
    { fieldName: 'createdDate', displayOrder: 6, isVisible: true },
    { fieldName: 'actions', displayOrder: 7, isVisible: true }
  ]
};

function normalize(screenName: string, fields: Array<{ fieldName: string; displayOrder: number; isVisible: boolean }>) {
  return {
    screenName,
    fields: fields
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((field) => ({
        fieldName: field.fieldName,
        displayOrder: field.displayOrder,
        isVisible: field.isVisible
      }))
  };
}

/** Purpose: Expose uiConfigService operations for this module. */
export const uiConfigService = {
  /** Purpose: Execute getSupportedScreens operation for this module. */
  getSupportedScreens() {
    return Object.keys(defaultConfig);
  },

  /** Purpose: Execute getScreenConfig operation for this module. */
  async getScreenConfig(screenName: string) {
    const defaults = defaultConfig[screenName];
    if (!defaults) {
      throw new AppError('Unsupported screenName', 400);
    }

    const configured = await uiConfigRepository.list(screenName);
    if (configured.length === 0) {
      return normalize(screenName, defaults);
    }

    return normalize(
      screenName,
      configured.map((item) => ({
        fieldName: item.fieldName,
        displayOrder: item.displayOrder,
        isVisible: item.isVisible
      }))
    );
  },

  /** Purpose: Execute listAllConfigs operation for this module. */
  async listAllConfigs() {
    const screens = this.getSupportedScreens();
    const configs = await Promise.all(screens.map((screen) => this.getScreenConfig(screen)));
    return configs;
  },

  /** Purpose: Execute saveScreenConfig operation for this module. */
  async saveScreenConfig(input: { screenName: string; fields: Array<{ fieldName: string; displayOrder: number; isVisible: boolean }> }) {
    const defaults = defaultConfig[input.screenName];
    if (!defaults) {
      throw new AppError('Unsupported screenName', 400);
    }

    const defaultFieldSet = new Set(defaults.map((field) => field.fieldName));
    for (const field of input.fields) {
      if (!defaultFieldSet.has(field.fieldName)) {
        throw new AppError(`Unsupported field ${field.fieldName} for screen ${input.screenName}`, 400);
      }
    }

    const complete = defaults.map((field, index) => {
      const found = input.fields.find((entry) => entry.fieldName === field.fieldName);
      return {
        fieldName: field.fieldName,
        displayOrder: found?.displayOrder ?? index,
        isVisible: found?.isVisible ?? field.isVisible
      };
    });

    const saved = await uiConfigRepository.replaceScreenConfig(input.screenName, complete);
    return normalize(
      input.screenName,
      saved.map((item) => ({
        fieldName: item.fieldName,
        displayOrder: item.displayOrder,
        isVisible: item.isVisible
      }))
    );
  }
};
