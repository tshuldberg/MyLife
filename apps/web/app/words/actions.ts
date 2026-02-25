'use server';

import { browseWordsAlphabetically, getMyWordsLanguages, lookupWord } from '@mylife/words';
import type {
  BrowseAlphabeticalWordsInput,
  LookupWordInput,
  MyWordsAlphabeticalBrowseResult,
  MyWordsLanguage,
  MyWordsLookupResult,
} from '@mylife/words';

export async function fetchMyWordsLanguagesAction(): Promise<MyWordsLanguage[]> {
  return getMyWordsLanguages();
}

export async function lookupWordAction(input: LookupWordInput): Promise<MyWordsLookupResult | null> {
  return lookupWord(input);
}

export async function browseAlphabeticalWordsAction(
  input: BrowseAlphabeticalWordsInput,
): Promise<MyWordsAlphabeticalBrowseResult> {
  return browseWordsAlphabetically(input);
}
