'use client';

export default function MailPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">MyMail</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Unread" value="0" />
        <MetricCard label="Total" value="0" />
        <MetricCard label="Starred" value="0" />
        <MetricCard label="Drafts" value="0" />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-[var(--color-text-secondary)]">
          Inbox
        </h2>
        <p className="py-8 text-center text-[var(--color-text-secondary)]">
          No messages yet. Set up a mail server to get started.
        </p>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color: '#3B82F6' }}>{value}</p>
    </div>
  );
}
