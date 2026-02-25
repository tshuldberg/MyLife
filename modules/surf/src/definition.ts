import type { ModuleDefinition } from '@mylife/module-registry';

export const SURF_MODULE: ModuleDefinition = {
  id: 'surf',
  name: 'MySurf',
  tagline: 'Surf forecasts and spot intel',
  icon: '\u{1F3C4}',
  accentColor: '#3B82F6',
  tier: 'premium',
  storageType: 'supabase',
  navigation: {
    tabs: [
      { key: 'forecast', label: 'Forecast', icon: 'cloud' },
      { key: 'map', label: 'Map', icon: 'map' },
      { key: 'spots', label: 'Spots', icon: 'map-pin' },
      { key: 'alerts', label: 'Alerts', icon: 'bell' },
      { key: 'profile', label: 'Profile', icon: 'user' },
    ],
    screens: [
      { name: 'spot-detail', title: 'Spot Details' },
      { name: 'buoy-detail', title: 'Buoy Data' },
      { name: 'session-log', title: 'Session Log' },
    ],
  },
  requiresAuth: true,
  requiresNetwork: true,
  version: '0.1.0',
};
