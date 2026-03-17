import { ModuleWebFallback } from '@/components/module-web-fallback';

export default function WorkoutsPage() {
  return (
    <ModuleWebFallback
      moduleName="MyWorkouts"
      title="Workouts"
      routePath="/workouts"
      summary="Body-map guided workouts and builder. Plan workouts, track exercises, and log your progress."
      accentColor="#EF4444"
      primaryHref="/"
      primaryLabel="Open MyLife Hub"
      links={[
        { href: '/workouts/workouts', label: 'My Workouts' },
        { href: '/workouts/explore', label: 'Explore' },
        { href: '/workouts/progress', label: 'Progress' },
      ]}
    />
  );
}
