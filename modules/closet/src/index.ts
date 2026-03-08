export { CLOSET_MODULE } from './definition';

export type {
  ClothingCategory,
  ClothingStatus,
  ClothingCondition,
  LaundryStatus,
  ClothingItem,
  Outfit,
  WearLog,
  ClosetTag,
  ClosetSetting,
  ClosetDashboard,
  CreateClothingItemInput,
  UpdateClothingItemInput,
  ClothingItemFilter,
  CreateOutfitInput,
  CreateWearLogInput,
} from './types';

export {
  ClothingCategorySchema,
  ClothingStatusSchema,
  ClothingConditionSchema,
  LaundryStatusSchema,
  ClothingItemSchema,
  OutfitSchema,
  WearLogSchema,
  ClosetTagSchema,
  ClosetSettingSchema,
  ClosetDashboardSchema,
  CreateClothingItemInputSchema,
  UpdateClothingItemInputSchema,
  ClothingItemFilterSchema,
  CreateOutfitInputSchema,
  CreateWearLogInputSchema,
} from './types';

export {
  createClothingItem,
  updateClothingItem,
  getClothingItemById,
  listClothingItems,
  listClosetTags,
  createOutfit,
  getOutfitById,
  listOutfits,
  logWearEvent,
  getWearLogById,
  listWearLogs,
  getClosetSetting,
  setClosetSetting,
  listDonationCandidates,
  getClosetDashboard,
} from './db';

export {
  calculateWardrobeValue,
  calculateCostPerWear,
  summarizeClosetDashboard,
} from './engine/analytics';
