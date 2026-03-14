import { ModuleBetaScreen } from '../../components/ModuleBetaScreen';

export default function ForumsSearchScreen() {
  return (
    <ModuleBetaScreen
      badge="Forums beta"
      title="Search"
      summary="Full-text search contracts are wired for communities and threads. The missing piece is the actual search UI, ranking controls, and rich filter surface."
      accentColor="#F43F5E"
      highlights={[
        'Search reads now map correctly from fr_communities and fr_threads',
        'Pinned-thread and vote-score fields retain the right runtime types',
        'The host route exists now, so saved links and module launch flows do not break',
      ]}
    />
  );
}
