import { ModuleWebFallback } from '@/components/module-web-fallback';

export default function HomesPage() {
  return (
    <ModuleWebFallback
      moduleName="MyHomes"
      title="Real Estate"
      routePath="/homes"
      summary="Real estate, reimagined. Discover listings, run mortgage calculations, and track your home search."
      accentColor="#D97706"
      primaryHref="/"
      primaryLabel="Open MyLife Hub"
      links={[
        { href: '/homes/discover', label: 'Discover' },
        { href: '/homes/saved', label: 'Saved' },
        { href: '/homes/mortgage', label: 'Mortgage Calculator' },
      ]}
    />
  );
}
