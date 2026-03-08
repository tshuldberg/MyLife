'use client';

export default function GardenPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">MyGarden</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Plants" value="0" />
        <MetricCard label="Healthy" value="0" />
        <MetricCard label="Overdue" value="0" />
        <MetricCard label="Harvested" value="0" />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-[var(--color-text-secondary)]">
          My Plants
        </h2>
        <p className="py-8 text-center text-[var(--color-text-secondary)]">
          No plants yet. Add your first plant to get growing.
        </p>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color: '#22C55E' }}>{value}</p>
    </div>
  );
}
