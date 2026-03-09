'use client';

export default function TrailsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">MyTrails</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Recordings" value="0" />
        <MetricCard label="Distance" value="0 km" />
        <MetricCard label="Elevation" value="0 m" />
        <MetricCard label="Avg Pace" value="-- min/km" />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-[var(--color-text-secondary)]">
          Recent Activity
        </h2>
        <p className="py-8 text-center text-[var(--color-text-secondary)]">
          No trail recordings yet. Start your first hike to see activity here.
        </p>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color: '#65A30D' }}>{value}</p>
    </div>
  );
}
