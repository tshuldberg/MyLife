import { ModuleWebFallback } from '@/components/module-web-fallback';

const TITLE_MAP: Record<string, string> = {
  '': 'MyWorkouts Web',
  explore: 'Explore Exercises',
  progress: 'Progress',
  recordings: 'Form Recordings',
  plans: 'Plans',
  'plans/builder': 'Plan Builder',
  workouts: 'Workout Library',
  'workouts/builder': 'Workout Builder',
  pricing: 'Pricing',
  profile: 'Profile',
};

function resolveTitle(slug: string[] | undefined): string {
  const key = slug?.join('/') ?? '';
  if (key.startsWith('exercise/')) return 'Exercise Detail';
  if (key.startsWith('plans/')) return 'Plan Detail';
  if (key.startsWith('recordings/')) return 'Recording Detail';
  if (key.startsWith('workout/')) return 'Workout Session';
  return TITLE_MAP[key] ?? `MyWorkouts: ${key}`;
}

export default function WorkoutsCatchAllPage({
  params,
}: {
  params: { slug?: string[] };
}) {
  const slug = params.slug ?? [];
  const routePath = `/workouts${slug.length > 0 ? `/${slug.join('/')}` : ''}`;

  return (
    <ModuleWebFallback
      moduleName="MyWorkouts"
      title={resolveTitle(slug)}
      routePath={routePath}
      summary="The archived MyWorkouts web app has been folded into MyLife. These routes stay live while the consolidated workouts web experience is completed inside the hub."
      accentColor="#2563EB"
      primaryHref="/"
      primaryLabel="Open MyLife Hub"
      links={[
        { href: '/workouts/explore', label: 'Explore' },
        { href: '/workouts/progress', label: 'Progress' },
        { href: '/workouts/recordings', label: 'Recordings' },
      ]}
    />
  );
}
