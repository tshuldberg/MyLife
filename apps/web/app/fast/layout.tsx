'use client';

import { Providers } from '@myfast-web/app/providers';

export default function FastLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
