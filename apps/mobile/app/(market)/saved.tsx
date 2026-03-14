import { ModuleBetaScreen } from '../../components/ModuleBetaScreen';

export default function MarketSavedScreen() {
  return (
    <ModuleBetaScreen
      badge="Market beta"
      title="Saved listings"
      summary="Watchlist and saved search plumbing is live. The remaining work is a polished saved-state UI, alerts, and notification delivery."
      accentColor="#E11D48"
      highlights={[
        'Watchlist cache and cloud reads now return camelCase shapes',
        'Listing watch counts decrement safely instead of going negative',
        'Saved search contracts are wired for future alerts and filters',
      ]}
    />
  );
}
