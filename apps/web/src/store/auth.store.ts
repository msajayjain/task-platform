/**
 * File Description:
 * This file implements apps/web/src/store/auth.store.ts.
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
import { api } from '@/lib/api-client';
import axios from 'axios';
import { clearClientCaches } from '@/lib/cache';

interface UserState {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  teamId?: string | null;
  teamName?: string | null;
}

interface AuthState {
  user: UserState | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, teamId: string) => Promise<{ message: string }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,

  clearError() {
    set({ error: null });
  },

  async login(email, password) {
    set({ loading: true, error: null });
    try {
      await clearClientCaches();
      const response = await api.post('/auth/login', { email, password });
      const payload = response.data.data;
      localStorage.setItem('accessToken', payload.accessToken);
      localStorage.setItem('refreshToken', payload.refreshToken);
      localStorage.setItem('csrfToken', payload.csrfToken);
      set({ user: payload.user });
    } catch (error) {
      let message = 'Login failed';
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.error?.message ?? error.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  async register(name, email, password, teamId) {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/register', { name, email, password, teamId });
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('csrfToken');
      set({ user: null, error: null });
      return {
        message: response.data?.data?.message ?? 'User created successfully'
      };
    } catch (error) {
      let message = 'Registration failed';
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.error?.message ?? error.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  async logout() {
    await clearClientCaches();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('csrfToken');
    set({ user: null, error: null });
  }
}));
