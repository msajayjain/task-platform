/**
 * File Description:
 * This file implements apps/web/src/app/login/page.tsx.
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RequiredLabel } from '@/components/ui/required-label';
import { useAuthStore } from '@/store/auth.store';

interface LoginForm {
  email: string;
  password: string;
}

/** Purpose: Execute LoginPage logic for this module. */
export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error, clearError } = useAuthStore();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>();

  useEffect(() => {
    clearError();
  }, [clearError]);

  return (
    <main className="mx-auto mt-24 max-w-md rounded-xl border bg-white p-6">
      <h1 className="mb-4 text-xl font-bold">Login</h1>
      <form
        className="space-y-3"
        onSubmit={handleSubmit(async (values) => {
          try {
            await login(values.email, values.password);
            router.replace('/my-created-tasks');
          } catch {
            // Error is surfaced via store state.
          }
        })}
      >
        <RequiredLabel htmlFor="login-email">Email</RequiredLabel>
        <Input id="login-email" type="email" placeholder="Email" {...register('email', { required: true })} />
        {errors.email ? <p className="text-xs text-red-600">Email is required.</p> : null}
        <RequiredLabel htmlFor="login-password">Password</RequiredLabel>
        <Input id="login-password" type="password" placeholder="Password" {...register('password', { required: true })} />
        {errors.password ? <p className="text-xs text-red-600">Password is required.</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button disabled={loading} type="submit">
          Sign In
        </Button>
      </form>
      <p className="mt-4 text-sm">
        No account?{' '}
        <button className="text-brand-700" onClick={() => router.push('/register')} type="button">
          Register
        </button>
      </p>
    </main>
  );
}
