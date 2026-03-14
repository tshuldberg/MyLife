import { ModuleBetaScreen } from '../../components/ModuleBetaScreen';

export default function MarketMessagesScreen() {
  return (
    <ModuleBetaScreen
      badge="Market beta"
      title="Buyer and seller messages"
      summary="Conversation routes are stable and the market messaging contracts are wired. Full inbox UX, moderation, and unread states are still being built on top of the live tables."
      accentColor="#E11D48"
      highlights={[
        'Conversation and message rows now map correctly into the shared types',
        'Listing message counts update on insert and delete instead of drifting',
        'This shell keeps module navigation and deep links stable while UI fills in',
      ]}
    />
  );
}
