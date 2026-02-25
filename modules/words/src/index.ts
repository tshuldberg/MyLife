export { WORDS_MODULE } from './definition';
export {
  getMyWordsLanguages,
  lookupWord,
  browseWordsAlphabetically,
  __resetMyWordsServiceCacheForTests,
} from './service';

export type {
  BrowseAlphabeticalWordsInput,
  LookupWordInput,
  MyWordsProvider,
  MyWordsLanguage,
  MyWordsPronunciation,
  MyWordsForm,
  MyWordsQuote,
  MyWordsSense,
  MyWordsEntry,
  MyWordsAttribution,
  MyWordsAlphabeticalBrowseResult,
  MyWordsLookupResult,
} from './types';
