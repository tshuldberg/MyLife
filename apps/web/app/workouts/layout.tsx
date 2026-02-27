import Link from 'next/link';

const links = [
  { href: '/workouts/explore', label: 'Explore' },
  { href: '/workouts', label: 'Workouts' },
  { href: '/workouts/progress', label: 'Progress' },
  { href: '/workouts/recordings', label: 'Recordings' },
];

export default function WorkoutsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        margin: '-32px',
        minHeight: '100vh',
        backgroundColor: '#F9FAFB',
        color: '#111827',
      }}
    >
      <div
        style={{
          borderBottom: '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF',
        }}
      >
        <div
          style={{
            margin: '0 auto',
            maxWidth: 1280,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
          }}
        >
          <Link href="/workouts" style={{ fontSize: 30, fontWeight: 700, color: '#2563EB' }}>
            MyWorkouts
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {links.map((link) => (
              <Link key={link.href} href={link.href} style={{ fontSize: 14, color: '#4B5563' }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div style={{ margin: '0 auto', maxWidth: 1280, padding: '24px' }}>{children}</div>
    </section>
  );
}
