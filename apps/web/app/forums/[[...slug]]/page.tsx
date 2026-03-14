import { ModuleWebFallback } from '@/components/module-web-fallback';

const TITLE_MAP: Record<string, string> = {
  '': 'MyForums Web',
  feed: 'Discussion Feed',
  communities: 'Communities',
  search: 'Search Threads',
  saved: 'Saved Threads',
  profile: 'Forum Profile',
};

function resolveTitle(slug: string[] | undefined): string {
  const key = slug?.join('/') ?? '';
  return TITLE_MAP[key] ?? `MyForums: ${key}`;
}

export default function ForumsCatchAllPage({
  params,
}: {
  params: { slug?: string[] };
}) {
  const slug = params.slug ?? [];
  const routePath = `/forums${slug.length > 0 ? `/${slug.join('/')}` : ''}`;

  return (
    <ModuleWebFallback
      moduleName="MyForums"
      title={resolveTitle(slug)}
      routePath={routePath}
      summary="MyForums is now wired into the MyLife web shell. This beta route preserves navigation and shared contracts while the full community, thread, reply, and moderation UI is built on top of the corrected forum data layer."
      accentColor="#F43F5E"
      primaryHref="/"
      primaryLabel="Open MyLife Hub"
      links={[
        { href: '/forums/feed', label: 'Feed' },
        { href: '/forums/communities', label: 'Communities' },
        { href: '/forums/search', label: 'Search' },
      ]}
    />
  );
}
