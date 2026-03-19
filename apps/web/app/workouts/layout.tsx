import Link from 'next/link';

const links = [
  { href: '/workouts/explore', label: 'Explore' },
  { href: '/workouts/progress', label: 'Progress' },
  { href: '/workouts/recordings', label: 'Recordings' },
];

export default function WorkoutsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 20,
          marginBottom: 24,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Link
          href="/workouts"
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: 'var(--accent-workouts)',
            textDecoration: 'none',
          }}
        >
          MyWorkouts
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </section>
  );
}
