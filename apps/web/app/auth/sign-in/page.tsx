'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import Link from 'next/link';
import { loginUser, createAuthTables } from '@mylife/auth';
import { WebAuthForm } from '../../../components/AuthForm';

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = useCallback(
    async (email: string, password: string) => {
      setError(undefined);

      const db = (globalThis as Record<string, unknown>).__mylife_db as
        | import('@mylife/db').DatabaseAdapter
        | undefined;

      if (!db) {
        router.push('/');
        return;
      }

      createAuthTables(db);
      const result = loginUser(db, email, password);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      sessionStorage.setItem('mylife_user_id', result.data.user.id);
      router.push('/');
      router.refresh();
    },
    [router],
  );

  return (
    <WebAuthForm
      mode="sign-in"
      onSubmit={handleSubmit}
      error={error}
      altLink={
        <span>
          Don't have an account?{' '}
          <Link href="/auth/sign-up" style={{ color: 'var(--text, #F4EDE2)' }}>
            Create one
          </Link>
        </span>
      }
    />
  );
}
