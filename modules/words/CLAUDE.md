# @mylife/words

## Overview

Dictionary and thesaurus module supporting 270+ languages. Look up word definitions, pronunciations, etymology, forms, synonyms, antonyms, rhymes, and contextual meanings. Uses three API providers: Free Dictionary API (primary definitions in 270 languages), Datamuse (English thesaurus, rhymes, contextual meaning, prefix browse), and Wiktionary (English word history/etymology). Network-required module with intelligent caching.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `WORDS_MODULE` | ModuleDefinition | Module registration contract (id: `words`, prefix: `wd_`, tier: premium, requiresNetwork: true) |
| `lookupWord` | Function | Look up a word in any supported language (definition, pronunciation, etymology, forms) |
| `browseWordsAlphabetically` | Function | Browse words by prefix with pagination |
| `suggestWordReplacements` | Function | Word helper: synonyms, rhymes, contextual suggestions |
| `getMyWordsLanguages` | Function | Get list of supported languages with word counts |
| Types | TypeScript interfaces | `MyWordsLookupResult`, `MyWordsEntry`, `MyWordsSense`, `MyWordsPronunciation`, `MyWordsForm`, `MyWordsQuote`, `MyWordsLanguage`, `MyWordsAttribution`, `MyWordsAlphabeticalBrowseResult`, `MyWordsWordHelperResult`, `MyWordsWordHelperSuggestion`, `MyWordsProvider` |

## Storage

- **Type:** sqlite (table prefix reserved, no persistent storage currently)
- **Table prefix:** `wd_`
- **Key tables:** none (stateless API aggregation with in-memory caching)

## Engines

- **service.ts** -- Main service orchestrator: multi-provider lookup, alphabetical browse, word helper. In-memory LRU caching (languages: 24h, lookups: 5min, browse: 10min, helper: 5min)
- **api/free-dictionary.ts** -- Free Dictionary API client (definitions in 270 languages, supported language list)
- **api/datamuse.ts** -- Datamuse API client (English thesaurus, rhymes, contextual meaning, prefix browse)
- **api/wiktionary.ts** -- Wiktionary API client (English word history/etymology)

## Schemas

- `MyWordsProvider` (union type: `freeDictionaryApi` | `datamuse` | `wiktionaryApi`)
- `MyWordsLanguage`, `MyWordsSense`, `MyWordsPronunciation`, `MyWordsForm`, `MyWordsQuote`
- `MyWordsEntry`, `MyWordsAttribution`
- `MyWordsLookupResult`, `MyWordsAlphabeticalBrowseResult`
- `MyWordsWordHelperSuggestion`, `MyWordsWordHelperResult`
- `LookupWordInput`, `BrowseAlphabeticalWordsInput`, `WordHelperInput`

## Test Coverage

- **Test files:** 1
- **Covered:** Service layer lookup, browse, word helper, language list, caching (`__tests__/words.test.ts`)
- **Gaps:** Individual API client error handling, cache expiration behavior

## Parity Status

- **Standalone repo:** MyWords (exists in MyLife submodule directory)
- **Hub integration:** wired

## Key Files

- `src/definition.ts` -- Module definition (no migrations, network-required)
- `src/index.ts` -- Public API barrel export
- `src/types.ts` -- All TypeScript interfaces and input types
- `src/service.ts` -- Main service orchestrator with multi-provider aggregation and caching
- `src/api/free-dictionary.ts` -- Free Dictionary API client (270 languages)
- `src/api/datamuse.ts` -- Datamuse API client (English thesaurus/rhymes)
- `src/api/wiktionary.ts` -- Wiktionary API client (English etymology)
