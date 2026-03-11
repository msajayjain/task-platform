/**
 * File Description:
 * This file implements apps/web/src/hooks/use-ui-config.ts.
 *
 * Purpose:
 * Encapsulate reusable client-side state/behavior logic.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

'use client';

import useSWR from 'swr';
import { UIScreenConfigDto, UIScreenName } from '@task-platform/types';
import { swrFetcher } from '@/lib/swr-fetcher';

const fallbackByScreen: Record<UIScreenName, UIScreenConfigDto> = {
  'create-task': {
    screenName: 'create-task',
    fields: [
      { fieldName: 'title', displayOrder: 0, isVisible: true },
      { fieldName: 'description', displayOrder: 1, isVisible: true },
      { fieldName: 'priority', displayOrder: 2, isVisible: true },
      { fieldName: 'dueDate', displayOrder: 3, isVisible: true },
      { fieldName: 'assignedTeam', displayOrder: 4, isVisible: true },
      { fieldName: 'assignedUser', displayOrder: 5, isVisible: true },
      { fieldName: 'comments', displayOrder: 6, isVisible: true }
    ]
  },
  'task-details': {
    screenName: 'task-details',
    fields: [
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
    ]
  },
  'my-created-grid': {
    screenName: 'my-created-grid',
    fields: [
      { fieldName: 'title', displayOrder: 0, isVisible: true },
      { fieldName: 'description', displayOrder: 1, isVisible: true },
      { fieldName: 'status', displayOrder: 2, isVisible: true },
      { fieldName: 'priority', displayOrder: 3, isVisible: true },
      { fieldName: 'dueDate', displayOrder: 4, isVisible: true },
      { fieldName: 'assignedTeam', displayOrder: 5, isVisible: true },
      { fieldName: 'createdDate', displayOrder: 6, isVisible: true },
      { fieldName: 'actions', displayOrder: 7, isVisible: true }
    ]
  }
};

/** Purpose: Execute useUiConfig logic for this module. */
export function useUiConfig(screenName: UIScreenName) {
  const { data, isLoading, error } = useSWR<UIScreenConfigDto>(`/config/ui?screenName=${screenName}`, swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000
  });

  const effective = data ?? fallbackByScreen[screenName];
  const orderedVisibleFields = effective.fields.filter((field) => field.isVisible).sort((a, b) => a.displayOrder - b.displayOrder).map((field) => field.fieldName);

  return {
    config: effective,
    orderedVisibleFields,
    isVisible: (fieldName: string) => effective.fields.some((field) => field.fieldName === fieldName && field.isVisible),
    isLoading,
    error
  };
}
