import type { Metadata } from 'next';
import { Sidebar } from '@/components/Sidebar';
import { Providers } from '@/components/Providers';
import { getEnabledModuleIds } from './actions';
import './globals.css';

export const metadata: Metadata = {
  title: 'MyLife',
  description: 'Your private life hub',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const enabledIds = await getEnabledModuleIds();

  return (
    <html lang="en">
      <body>
        <Providers initialEnabledIds={enabledIds}>
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main
              style={{
                flex: 1,
                marginLeft: 'var(--sidebar-width)',
                padding: '32px',
              }}
            >
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
