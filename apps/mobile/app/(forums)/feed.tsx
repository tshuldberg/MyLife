import { ModuleBetaScreen } from '../../components/ModuleBetaScreen';

export default function ForumsFeedScreen() {
  return (
    <ModuleBetaScreen
      badge="Forums beta"
      title="Discussion feed"
      summary="MyForums is now routed inside MyLife. The next layer is the full thread list UI on top of the corrected community, thread, reply, and vote contracts."
      accentColor="#F43F5E"
      highlights={[
        'Community and thread rows now map correctly from Supabase into camelCase types',
        'Thread and reply counters decrement on delete instead of drifting upward forever',
        'Forum thread creation can emit social activity through the shared social package',
      ]}
    />
  );
}
