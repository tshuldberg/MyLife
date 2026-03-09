export { CLOSET_MODULE } from './definition';

export type {
  ClothingCategory,
  ClothingStatus,
  ClothingCondition,
  LaundryStatus,
  CareInstruction,
  LaundryEventType,
  PackingListMode,
  PackingListSeason,
  ClothingItem,
  Outfit,
  WearLog,
  LaundryEvent,
  PackingListItem,
  PackingList,
  ClosetTag,
  ClosetSetting,
  ClosetDashboard,
  CreateClothingItemInput,
  UpdateClothingItemInput,
  ClothingItemFilter,
  CreateOutfitInput,
  CreateWearLogInput,
  MarkLaundryItemsCleanInput,
  CreatePackingListInput,
  AddPackingListCustomItemInput,
  ExportClosetDataInput,
  ClosetExportBundle,
} from './types';

export {
  ClothingCategorySchema,
  ClothingStatusSchema,
  ClothingConditionSchema,
  LaundryStatusSchema,
  CareInstructionSchema,
  LaundryEventTypeSchema,
  PackingListModeSchema,
  PackingListSeasonSchema,
  ClothingItemSchema,
  OutfitSchema,
  WearLogSchema,
  LaundryEventSchema,
  PackingListItemSchema,
  PackingListSchema,
  ClosetTagSchema,
  ClosetSettingSchema,
  ClosetDashboardSchema,
  CreateClothingItemInputSchema,
  UpdateClothingItemInputSchema,
  ClothingItemFilterSchema,
  CreateOutfitInputSchema,
  CreateWearLogInputSchema,
  MarkLaundryItemsCleanInputSchema,
  CreatePackingListInputSchema,
  AddPackingListCustomItemInputSchema,
  ExportClosetDataInputSchema,
  ClosetExportBundleSchema,
} from './types';

export {
  createClothingItem,
  updateClothingItem,
  getClothingItemById,
  listClothingItems,
  listDirtyClothingItems,
  listClosetTags,
  createOutfit,
  getOutfitById,
  listOutfits,
  logWearEvent,
  getWearLogById,
  listWearLogs,
  listLaundryEventsForItem,
  markLaundryItemsClean,
  getAverageWearsBetweenWashes,
  createPackingList,
  getPackingListById,
  listPackingLists,
  togglePackingListItemPacked,
  addPackingListCustomItem,
  getClosetSetting,
  setClosetSetting,
  listClosetSettings,
  listDonationCandidates,
  exportClosetData,
  getClosetDashboard,
} from './db';

export {
  calculateWardrobeValue,
  calculateCostPerWear,
  summarizeClosetDashboard,
} from './engine/analytics';

export {
  calculateAverageWearsBetweenWashes,
  groupDirtyItemsByCare,
} from './engine/laundry';

export {
  inferPackingSeason,
  generatePackingSuggestions,
} from './engine/packing';

export {
  serializeClosetExport,
} from './engine/export';
