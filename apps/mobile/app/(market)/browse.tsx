import { ModuleBetaScreen } from '../../components/ModuleBetaScreen';

export default function MarketBrowseScreen() {
  return (
    <ModuleBetaScreen
      badge="Market beta"
      title="Browse listings"
      summary="Marketplace navigation is now live inside MyLife. The remaining work is a full browse UI on top of the real Supabase listing, category, and watchlist contracts."
      accentColor="#E11D48"
      highlights={[
        'Host route and module registration are wired for MyMarket',
        'Cloud and cache clients now return the declared listing shapes',
        'Listing lifecycle hooks can emit social activity when a profile is opted in',
      ]}
    />
  );
}
