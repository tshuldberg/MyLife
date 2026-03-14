import { ModuleBetaScreen } from '../../components/ModuleBetaScreen';

export default function ForumsSavedScreen() {
  return (
    <ModuleBetaScreen
      badge="Forums beta"
      title="Saved threads"
      summary="Bookmarks are routed and typed correctly. The remaining work is the full saved-thread list, unread handling, and moderation affordances."
      accentColor="#F43F5E"
      highlights={[
        'Bookmark rows now return the declared profileId and threadId fields',
        'Vote removal correctly reverses score and karma changes server-side',
        'The route shell is ready for the final saved and moderation UI',
      ]}
    />
  );
}
