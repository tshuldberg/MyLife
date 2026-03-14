import { ModuleBetaScreen } from '../../components/ModuleBetaScreen';

export default function ForumsCommunitiesScreen() {
  return (
    <ModuleBetaScreen
      badge="Forums beta"
      title="Communities"
      summary="Community routing is stable and create/join flows now target the correct snake_case columns. The remaining work is the full directory, moderation dashboard, and onboarding UX."
      accentColor="#F43F5E"
      highlights={[
        'Community create writes now use display_name, community_type, and linked_module_id',
        'Membership counts guard against negative values when users leave',
        'Community creation can post into social when the creator has opted in',
      ]}
    />
  );
}
