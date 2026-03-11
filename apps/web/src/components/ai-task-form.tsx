/**
 * File Description:
 * This file implements apps/web/src/components/ai-task-form.tsx.
 *
 * Purpose:
 * Render reusable UI building blocks and interaction views.
 *
 * Key Responsibilities:
 * - Render UI states.
 * - Handle user interactions.
 * - Compose reusable presentation blocks.
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { UserDto } from '@task-platform/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RequiredLabel } from '@/components/ui/required-label';
import { Select } from '@/components/ui/select';

interface FormData {
  text: string;
  assignedUserId: string;
}

/** Purpose: Execute AITaskForm logic for this module. */
export function AITaskForm({
  onSubmit,
  users,
  defaultAssignedUserId
}: Readonly<{ onSubmit: (payload: FormData) => Promise<void>; users: UserDto[]; defaultAssignedUserId?: string }>) {
  const { register, handleSubmit, formState, watch, setValue } = useForm<FormData>({
    defaultValues: {
      assignedUserId: defaultAssignedUserId ?? users[0]?.id ?? ''
    }
  });
  const selectedAssigneeId = watch('assignedUserId');

  useEffect(() => {
    if (!selectedAssigneeId && users.length > 0) {
      setValue('assignedUserId', defaultAssignedUserId ?? users[0].id, { shouldValidate: true });
    }
  }, [defaultAssignedUserId, selectedAssigneeId, setValue, users]);

  return (
    <form className="space-y-3 rounded-xl border bg-white p-4" onSubmit={handleSubmit(onSubmit)}>
      <h3 className="font-semibold">Create Task with AI</h3>
      <RequiredLabel htmlFor="ai-task-prompt">Task Prompt</RequiredLabel>
      <Input id="ai-task-prompt" placeholder='E.g. "Create high priority report task by Friday"' {...register('text', { required: true })} />
      {formState.errors.text ? <p className="text-xs text-red-600">Task prompt is required.</p> : null}
      <RequiredLabel htmlFor="ai-task-assignee">Assignee</RequiredLabel>
      <Select id="ai-task-assignee" {...register('assignedUserId', { required: true })}>
        <option value="">Select assignee</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.email})
          </option>
        ))}
      </Select>
      {formState.errors.assignedUserId ? <p className="text-xs text-red-600">Assignee is required.</p> : null}
      <Button disabled={formState.isSubmitting} type="submit">
        Generate Task
      </Button>
    </form>
  );
}
