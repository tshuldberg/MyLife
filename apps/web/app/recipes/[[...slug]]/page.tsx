import { ModuleWebFallback } from '@/components/module-web-fallback';

const TITLE_MAP: Record<string, string> = {
  '': 'MyRecipes Web',
  library: 'Recipe Library',
  add: 'Add Recipe',
  import: 'Import Recipes',
  'import/review': 'Import Review',
  grocery: 'Grocery List',
  'meal-planner': 'Meal Planner',
  garden: 'Garden',
  events: 'Events',
  pantry: 'Pantry',
};

function resolveTitle(slug: string[] | undefined): string {
  const key = slug?.join('/') ?? '';
  if (key.startsWith('library/')) return 'Recipe Detail';
  if (key.startsWith('events/invite/')) return 'Event Invite';
  return TITLE_MAP[key] ?? `MyRecipes: ${key}`;
}

export default function RecipesCatchAllPage({
  params,
}: {
  params: { slug?: string[] };
}) {
  const slug = params.slug ?? [];
  const routePath = `/recipes${slug.length > 0 ? `/${slug.join('/')}` : ''}`;

  return (
    <ModuleWebFallback
      moduleName="MyRecipes"
      title={resolveTitle(slug)}
      routePath={routePath}
      summary="The archived MyRecipes web app has been consolidated into MyLife. These routes are now safe native placeholders while recipe web workflows are rebuilt inside the suite."
      accentColor="#B45309"
      primaryHref="/"
      primaryLabel="Open MyLife Hub"
      links={[
        { href: '/recipes/library', label: 'Library' },
        { href: '/recipes/grocery', label: 'Grocery' },
        { href: '/recipes/pantry', label: 'Pantry' },
      ]}
    />
  );
}
