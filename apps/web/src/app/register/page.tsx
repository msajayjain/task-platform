/**
 * File Description:
 * This file implements apps/web/src/app/register/page.tsx.
 *
 * Purpose:
 * Provide module-specific logic used by the project runtime.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import useSWR from 'swr';
import { TeamDto } from '@task-platform/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RequiredLabel } from '@/components/ui/required-label';
import { Select } from '@/components/ui/select';
import { swrFetcher } from '@/lib/swr-fetcher';
import { useAuthStore } from '@/store/auth.store';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  teamId: string;
}

/** Purpose: Execute RegisterPage logic for this module. */
export default function RegisterPage() {
  const router = useRouter();
  const { register: doRegister, loading, error, clearError } = useAuthStore();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterForm>({
    defaultValues: {
      teamId: ''
    }
  });
  const { data: teams = [], isLoading: teamsLoading, error: teamsError } = useSWR<TeamDto[]>('/config/teams', swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    shouldRetryOnError: false
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  return (
    <main className="mx-auto mt-24 max-w-md rounded-xl border bg-white p-6">
      <h1 className="mb-4 text-xl font-bold">Register</h1>
      <form
        className="space-y-3"
        onSubmit={handleSubmit(async (values) => {
          try {
            if (!values.teamId) {
              return;
            }
            await doRegister(values.name, values.email, values.password, values.teamId);
            router.replace('/login');
          } catch {
            // Error is surfaced via store state.
          }
        })}
      >
        <RequiredLabel htmlFor="register-name">Name</RequiredLabel>
        <Input id="register-name" placeholder="Name" {...register('name', { required: true })} />
        {errors.name ? <p className="text-xs text-red-600">Name is required.</p> : null}
        <RequiredLabel htmlFor="register-email">Email</RequiredLabel>
        <Input id="register-email" type="email" placeholder="Email" {...register('email', { required: true })} />
        {errors.email ? <p className="text-xs text-red-600">Email is required.</p> : null}
        <RequiredLabel htmlFor="register-password">Password</RequiredLabel>
        <Input id="register-password" type="password" placeholder="Password" {...register('password', { required: true })} />
        {errors.password ? <p className="text-xs text-red-600">Password is required.</p> : null}
        <RequiredLabel htmlFor="register-team">Team</RequiredLabel>
        <Select id="register-team" {...register('teamId', { required: true })} disabled={teamsLoading}>
          <option value="">Select Team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </Select>
        {errors.teamId ? <p className="text-xs text-red-600">Team selection is required.</p> : null}
        {teamsError ? <p className="text-xs text-red-600">Unable to load teams. Please refresh and try again.</p> : null}
        {!teamsLoading && teams.length === 0 && !teamsError ? <p className="text-xs text-red-600">No teams available. Please contact admin.</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button disabled={loading || teamsLoading || teams.length === 0} type="submit">
          Create Account
        </Button>
      </form>
      <p className="mt-4 text-sm">
        Have account?{' '}
        <button className="text-brand-700" onClick={() => router.push('/login')} type="button">
          Login
        </button>
      </p>
    </main>
  );
}
