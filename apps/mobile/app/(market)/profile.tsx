import { ModuleBetaScreen } from '../../components/ModuleBetaScreen';

export default function MarketProfileScreen() {
  return (
    <ModuleBetaScreen
      badge="Market beta"
      title="Seller profile"
      summary="Seller profile routing is now part of MyLife. The remaining work is ratings, response-time UX, moderation tools, and a complete storefront view."
      accentColor="#E11D48"
      highlights={[
        'Seller stats now map correctly into activeListings and related counters',
        'Review aggregation is kept in sync via database triggers',
        'Marketplace activity can flow into social once users explicitly opt in',
      ]}
    />
  );
}
