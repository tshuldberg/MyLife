import { ModuleWebFallback } from '@/components/module-web-fallback';

const TITLE_MAP: Record<string, string> = {
  '': 'MyMarket Web',
  browse: 'Browse Listings',
  sell: 'Create Listing',
  messages: 'Messages',
  saved: 'Saved Listings',
  profile: 'Seller Profile',
};

function resolveTitle(slug: string[] | undefined): string {
  const key = slug?.join('/') ?? '';
  return TITLE_MAP[key] ?? `MyMarket: ${key}`;
}

export default function MarketCatchAllPage({
  params,
}: {
  params: { slug?: string[] };
}) {
  const slug = params.slug ?? [];
  const routePath = `/market${slug.length > 0 ? `/${slug.join('/')}` : ''}`;

  return (
    <ModuleWebFallback
      moduleName="MyMarket"
      title={resolveTitle(slug)}
      routePath={routePath}
      summary="MyMarket is now routed inside MyLife. The beta shell keeps navigation and deep links stable while the full listing, messaging, and moderation workflows are completed on top of the corrected market contracts."
      accentColor="#E11D48"
      primaryHref="/"
      primaryLabel="Open MyLife Hub"
      links={[
        { href: '/market/browse', label: 'Browse' },
        { href: '/market/sell', label: 'Sell' },
        { href: '/market/messages', label: 'Messages' },
      ]}
    />
  );
}
