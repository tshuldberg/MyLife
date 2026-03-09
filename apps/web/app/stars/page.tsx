'use client';

export default function StarsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">MyStars</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Profiles" value="0" />
        <MetricCard label="Transits" value="0" />
        <MetricCard label="Readings" value="0" />
        <MetricCard label="Charts" value="0" />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-[var(--color-text-secondary)]">
          Birth Profiles
        </h2>
        <p className="py-8 text-center text-[var(--color-text-secondary)]">
          No birth profiles yet. Add your first profile to get started.
        </p>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color: '#8B5CF6' }}>{value}</p>
    </div>
  );
}
