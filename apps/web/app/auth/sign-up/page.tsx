'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import Link from 'next/link';
import { registerUser, createAuthTables } from '@mylife/auth';
import { WebAuthForm } from '../../../components/AuthForm';

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = useCallback(
    async (email: string, password: string, displayName?: string) => {
      setError(undefined);

      // In local-first mode, use the local SQLite auth service.
      // The DatabaseProvider exposes a global db reference on window for web.
      const db = (globalThis as Record<string, unknown>).__mylife_db as
        | import('@mylife/db').DatabaseAdapter
        | undefined;

      if (!db) {
        // Fallback: local mode not yet initialized, redirect home
        router.push('/');
        return;
      }

      createAuthTables(db);
      const result = registerUser(db, email, password, displayName);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Store session indicator and redirect
      sessionStorage.setItem('mylife_user_id', result.data.id);
      router.push('/');
      router.refresh();
    },
    [router],
  );

  return (
    <WebAuthForm
      mode="sign-up"
      onSubmit={handleSubmit}
      error={error}
      altLink={
        <span>
          Already have an account?{' '}
          <Link href="/auth/sign-in" style={{ color: 'var(--text, #F4EDE2)' }}>
            Sign in
          </Link>
        </span>
      }
    />
  );
}
