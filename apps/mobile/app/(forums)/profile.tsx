import { ModuleBetaScreen } from '../../components/ModuleBetaScreen';

export default function ForumsProfileScreen() {
  return (
    <ModuleBetaScreen
      badge="Forums beta"
      title="Forum profile"
      summary="Profile routing is now part of the app shell. The remaining work is full karma, moderation history, flair, and contribution views."
      accentColor="#F43F5E"
      highlights={[
        'User stats now map correctly into threadCount, replyCount, and communitiesJoined',
        'Vote-triggered karma changes can be reversed on delete and update',
        'This shell keeps forum entry points stable while the full profile UI lands',
      ]}
    />
  );
}
