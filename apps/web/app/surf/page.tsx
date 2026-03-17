import { ModuleWebFallback } from '@/components/module-web-fallback';

export default function SurfPage() {
  return (
    <ModuleWebFallback
      moduleName="MySurf"
      title="Surf Forecasts"
      routePath="/surf"
      summary="Surf forecasts and spot intel. Check conditions, discover spots, and log sessions."
      accentColor="#3B82F6"
      primaryHref="/"
      primaryLabel="Open MyLife Hub"
      links={[
        { href: '/surf/spots', label: 'Spots' },
        { href: '/surf/forecast', label: 'Forecast' },
        { href: '/surf/sessions', label: 'Sessions' },
      ]}
    />
  );
}
