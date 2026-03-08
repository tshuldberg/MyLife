'use client';

export default function NotesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">MyNotes</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Notes" value="0" />
        <MetricCard label="Folders" value="0" />
        <MetricCard label="Tags" value="0" />
        <MetricCard label="Words" value="0" />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-[var(--color-text-secondary)]">
          Recent Notes
        </h2>
        <p className="py-8 text-center text-[var(--color-text-secondary)]">
          No notes yet. Create your first note to get started.
        </p>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color: '#64748B' }}>{value}</p>
    </div>
  );
}
