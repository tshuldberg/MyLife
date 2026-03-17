import { ModuleWebFallback } from '@/components/module-web-fallback';

export default function HabitsPage() {
  return (
    <ModuleWebFallback
      moduleName="MyHabits"
      title="Habits"
      routePath="/habits"
      summary="Build habits that stick. Track daily completions, streaks, and build positive routines."
      accentColor="#8B5CF6"
      primaryHref="/"
      primaryLabel="Open MyLife Hub"
      links={[
        { href: '/habits/streaks', label: 'Streaks' },
        { href: '/habits/history', label: 'History' },
      ]}
    />
  );
}
