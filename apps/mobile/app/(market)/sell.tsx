import { ModuleBetaScreen } from '../../components/ModuleBetaScreen';

export default function MarketSellScreen() {
  return (
    <ModuleBetaScreen
      badge="Market beta"
      title="Sell with confidence"
      summary="Listing creation now targets the real marketplace schema instead of impossible camelCase inserts. The next step is the full create and edit flow with photos, moderation, and shipping logic."
      accentColor="#E11D48"
      highlights={[
        'Create listing writes now map correctly into mk_listings',
        'Location inserts no longer send invalid latitude and longitude columns',
        'Seller stats and denormalized counters are being kept in sync server-side',
      ]}
    />
  );
}
