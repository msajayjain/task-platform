/**
 * File Description:
 * This file implements apps/web/src/store/task.store.ts.
 *
 * Purpose:
 * Manage shared client-side state and actions.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import { create } from 'zustand';
import axios from 'axios';
import { TaskCommentDto, TaskDto } from '@task-platform/types';
import { api } from '@/lib/api-client';

interface TaskState {
  tasks: TaskDto[];
  commentsByTaskId: Record<string, TaskCommentDto[]>;
  loading: boolean;
  filters: Record<string, string>;
  fetchTasks: () => Promise<void>;
  fetchComments: (taskId: string) => Promise<void>;
  addComment: (taskId: string, content: string) => Promise<void>;
  setFilters: (filters: Record<string, string>) => void;
  createTask: (task: Partial<TaskDto> & { assignedUserId?: string; title: string; description: string; comment?: string }) => Promise<void>;
  updateTask: (id: string, task: Partial<TaskDto>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED_PENDING_APPROVAL') => Promise<void>;
  createTaskFromAI: (text: string, assignedUserId: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  commentsByTaskId: {},
  loading: false,
  filters: {},

  async fetchTasks() {
    set({ loading: true });
    try {
      const params = new URLSearchParams(get().filters);
      const response = await api.get(`/tasks/filter?${params.toString()}`);
      set({ tasks: response.data.data });
    } finally {
      set({ loading: false });
    }
  },

  setFilters(filters) {
    set({ filters });
  },

  async fetchComments(taskId) {
    const response = await api.get(`/tasks/${taskId}/comments`);
    set((state) => ({
      commentsByTaskId: {
        ...state.commentsByTaskId,
        [taskId]: response.data.data
      }
    }));
  },

  async addComment(taskId, content) {
    await api.post(`/tasks/${taskId}/comments`, { content });
    await get().fetchComments(taskId);
  },

  async createTask(task) {
    const parsedDueDate = task.dueDate ? new Date(task.dueDate) : null;
    const normalizedDueDate = parsedDueDate && !Number.isNaN(parsedDueDate.getTime()) ? parsedDueDate.toISOString() : null;
    const normalizedAssignedUserId = task.assignedUserId?.trim();
    const normalizedComment = task.comment?.trim();

    try {
      await api.post('/tasks', {
        title: task.title,
        description: task.description,
        status: task.status ?? 'TODO',
        priority: task.priority ?? 'MEDIUM',
        dueDate: normalizedDueDate,
        ...(normalizedAssignedUserId ? { assignedUserId: normalizedAssignedUserId } : {}),
        ...(normalizedComment ? { comment: normalizedComment } : {})
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.error?.message ??
          error.response?.data?.message ??
          error.message ??
          'Failed to create task';

        const details = error.response?.data?.error?.details;
        if (Array.isArray(details) && details.length > 0) {
          const detailMessage = details
            .map((detail: { path?: string[]; message?: string }) => {
              const field = Array.isArray(detail?.path) ? detail.path.join('.') : 'field';
              return `${field}: ${detail?.message ?? 'Invalid value'}`;
            })
            .join('; ');
          throw new Error(`${message}. ${detailMessage}`);
        }

        throw new Error(message);
      }

      throw error;
    }

    await get().fetchTasks();
  },

  async updateTask(id, task) {
    await api.put(`/tasks/${id}`, task);
    await get().fetchTasks();
  },

  async deleteTask(id) {
    await api.delete(`/tasks/${id}`);
    await get().fetchTasks();
  },

  async moveTask(id, status) {
    const previous = get().tasks;
    set({ tasks: previous.map((task) => (task.id === id ? { ...task, status } : task)) });

    try {
      await api.put(`/tasks/${id}`, { status });
    } catch {
      // Rollback optimistic update on error.
      set({ tasks: previous });
      throw new Error('Failed to move task');
    }
  },

  async createTaskFromAI(text, assignedUserId) {
    await api.post('/tasks/ai-create', { text, assignedUserId });
    await get().fetchTasks();
  }
}));
