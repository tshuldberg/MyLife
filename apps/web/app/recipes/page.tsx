import { ModuleWebFallback } from '@/components/module-web-fallback';

export default function RecipesPage() {
  return (
    <ModuleWebFallback
      moduleName="MyGarden"
      title="Recipes & Garden"
      routePath="/recipes"
      summary="Grow it, cook it, host it. Manage recipes, plan meals, track your garden, and organize events."
      accentColor="#22C55E"
      primaryHref="/"
      primaryLabel="Open MyLife Hub"
      links={[
        { href: '/recipes/library', label: 'Recipe Library' },
        { href: '/recipes/meal-planner', label: 'Meal Planner' },
        { href: '/recipes/garden', label: 'Garden' },
      ]}
    />
  );
}
