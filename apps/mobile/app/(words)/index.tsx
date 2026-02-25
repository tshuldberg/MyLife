import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import {
  getMyWordsLanguages,
  lookupWord,
  type MyWordsLanguage,
  type MyWordsLookupResult,
  type MyWordsSense,
} from '@mylife/words';
import { Card, Text, colors, spacing } from '@mylife/ui';

function dedupeLabels(labels: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const label of labels) {
    const normalized = label.trim();
    if (!normalized) continue;
    const key = normalized.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
  }
  return out;
}

function getPronunciationLabels(result: MyWordsLookupResult | null): string[] {
  if (!result) return [];
  return dedupeLabels(
    result.entries.flatMap((entry) =>
      (entry.pronunciations ?? []).map((pronunciation) => {
        const details = [pronunciation.type, ...(pronunciation.tags ?? [])].filter(Boolean).join(', ');
        return details ? `${pronunciation.text} (${details})` : pronunciation.text;
      }),
    ),
  );
}

function getFormLabels(result: MyWordsLookupResult | null): string[] {
  if (!result) return [];
  return dedupeLabels(
    result.entries.flatMap((entry) =>
      (entry.forms ?? []).map((form) => {
        const details = (form.tags ?? []).join(', ');
        return details ? `${form.word} (${details})` : form.word;
      }),
    ),
  );
}

function renderSense(sense: MyWordsSense, key: string, depth = 0): React.ReactNode {
  const tags = sense.tags ?? [];
  const synonyms = sense.synonyms ?? [];
  const antonyms = sense.antonyms ?? [];
  const examples = sense.examples ?? [];
  const quotes = sense.quotes ?? [];
  const subsenses = sense.subsenses ?? [];

  return (
    <View key={key} style={[styles.senseWrap, depth > 0 ? { marginLeft: depth * spacing.sm } : null]}>
      <Text variant="body">{`${depth > 0 ? '◦' : '•'} ${sense.definition}`}</Text>
      {tags.length > 0 && (
        <Text variant="caption" color={colors.textSecondary}>
          Usage: {tags.join(', ')}
        </Text>
      )}
      {synonyms.length > 0 && (
        <Text variant="caption" color={colors.textSecondary}>
          Sense synonyms: {synonyms.join(', ')}
        </Text>
      )}
      {antonyms.length > 0 && (
        <Text variant="caption" color={colors.textSecondary}>
          Sense antonyms: {antonyms.join(', ')}
        </Text>
      )}
      {examples.map((example, index) => (
        <Text key={`${key}-example-${index}`} variant="caption" color={colors.textSecondary}>
          Example: {example}
        </Text>
      ))}
      {quotes.map((quote, index) => (
        <View key={`${key}-quote-${index}`} style={styles.quoteWrap}>
          <Text variant="caption" color={colors.textSecondary}>
            “{quote.text}”
          </Text>
          {quote.reference ? (
            <Text variant="caption" color={colors.textTertiary}>
              {quote.reference}
            </Text>
          ) : null}
        </View>
      ))}
      {subsenses.map((subsense, index) => renderSense(subsense, `${key}-subsense-${index}`, depth + 1))}
    </View>
  );
}

export default function WordsScreen() {
  const [languages, setLanguages] = useState<MyWordsLanguage[]>([]);
  const [languageCode, setLanguageCode] = useState('en');
  const [word, setWord] = useState('');
  const [result, setResult] = useState<MyWordsLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedLanguage = useMemo(
    () => languages.find((lang) => lang.code === languageCode),
    [languages, languageCode],
  );
  const pronunciationLabels = useMemo(() => getPronunciationLabels(result), [result]);
  const formLabels = useMemo(() => getFormLabels(result), [result]);
  const resultWordHistory = result?.wordHistory ?? [];
  const resultChronology = result?.chronology ?? [];
  const resultWordFamily = result?.wordFamily ?? [];
  const resultRhymes = result?.rhymes ?? [];
  const resultNearbyWords = result?.nearbyWords ?? [];

  useEffect(() => {
    let active = true;
    void getMyWordsLanguages()
      .then((langs) => {
        if (!active) return;
        setLanguages(langs);
        if (!langs.some((lang) => lang.code === 'en') && langs[0]) {
          setLanguageCode(langs[0].code);
        }
      })
      .catch(() => {
        if (active) {
          setError('Could not load languages.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const runLookupByWord = async (rawWord: string) => {
    const query = rawWord.trim();
    if (!query) {
      setError('Enter a word.');
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await lookupWord({ languageCode, word: query });
      if (!data) {
        setResult(null);
        setError(`No entry found for "${query}" in ${selectedLanguage?.name ?? languageCode}.`);
      } else {
        setWord(query);
        setResult(data);
      }
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Lookup failed.');
    } finally {
      setLoading(false);
    }
  };

  const runLookup = async () => {
    await runLookupByWord(word);
  };

  const onOpenRelatedWord = async (nextWord: string) => {
    await runLookupByWord(nextWord);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">Dictionary + Thesaurus</Text>
        <Text variant="caption" color={colors.textSecondary}>
          Lookup across hundreds of languages.
        </Text>

        <View style={styles.formGrid}>
          <TextInput
            style={styles.input}
            value={word}
            onChangeText={setWord}
            placeholder="Search word"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
          />

          <View style={styles.row}>
            {languages.slice(0, 8).map((lang) => {
              const selected = lang.code === languageCode;
              return (
                <Pressable
                  key={lang.code}
                  style={[styles.langChip, selected ? styles.langChipSelected : null]}
                  onPress={() => setLanguageCode(lang.code)}
                >
                  <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                    {lang.code}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.primaryButton} onPress={() => void runLookup()}>
            <Text variant="label" color={colors.background}>
              {loading ? 'Searching...' : 'Look Up'}
            </Text>
          </Pressable>
        </View>
      </Card>

      {error ? (
        <Card>
          <Text variant="caption" color={colors.danger}>{error}</Text>
        </Card>
      ) : null}

      {result ? (
        <Card>
          <Text variant="subheading">{result.word}</Text>
          <Text variant="caption" color={colors.textSecondary}>
            {result.language.name} ({result.language.code.toUpperCase()})
          </Text>

          {pronunciationLabels.length > 0 ? (
            <View style={styles.section}>
              <Text variant="label" color={colors.textSecondary}>Pronunciations</Text>
              <Text variant="body">{pronunciationLabels.join(' • ')}</Text>
            </View>
          ) : null}

          {formLabels.length > 0 ? (
            <View style={styles.section}>
              <Text variant="label" color={colors.textSecondary}>Word Forms</Text>
              <Text variant="body">{formLabels.join(' • ')}</Text>
            </View>
          ) : null}

          {resultWordHistory.length > 0 ? (
            <View style={styles.section}>
              <Text variant="label" color={colors.textSecondary}>Word History</Text>
              {resultWordHistory.map((line, index) => (
                <Text key={`history-${index}`} variant="caption" color={colors.textSecondary}>
                  • {line}
                </Text>
              ))}
            </View>
          ) : null}

          {resultChronology.length > 0 ? (
            <View style={styles.section}>
              <Text variant="label" color={colors.textSecondary}>Chronology</Text>
              <Text variant="caption" color={colors.textSecondary}>{resultChronology.join(' • ')}</Text>
            </View>
          ) : null}

          {result.firstKnownUse ? (
            <View style={styles.section}>
              <Text variant="label" color={colors.textSecondary}>First Known Use</Text>
              <Text variant="caption" color={colors.textSecondary}>{result.firstKnownUse}</Text>
            </View>
          ) : null}

          {result.didYouKnow ? (
            <View style={styles.section}>
              <Text variant="label" color={colors.textSecondary}>Did You Know?</Text>
              <Text variant="caption" color={colors.textSecondary}>{result.didYouKnow}</Text>
            </View>
          ) : null}

          {resultRhymes.length > 0 ? (
            <View style={styles.section}>
              <Text variant="label" color={colors.textSecondary}>Rhymes</Text>
              <Text variant="caption" color={colors.textSecondary}>{resultRhymes.join(', ')}</Text>
            </View>
          ) : null}

          {resultWordFamily.length > 0 ? (
            <View style={styles.section}>
              <Text variant="label" color={colors.textSecondary}>Word Family</Text>
              <Text variant="caption" color={colors.textSecondary}>{resultWordFamily.join(', ')}</Text>
            </View>
          ) : null}

          {resultNearbyWords.length > 0 ? (
            <View style={styles.section}>
              <Text variant="label" color={colors.textSecondary}>Nearby Words</Text>
              <View style={styles.relatedWordGrid}>
                {resultNearbyWords.map((item) => (
                  <Pressable
                    key={`nearby-${item}`}
                    style={styles.relatedWordButton}
                    onPress={() => void onOpenRelatedWord(item)}
                  >
                    <Text variant="caption" color={colors.textSecondary}>
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text variant="label" color={colors.textSecondary}>Synonyms</Text>
            <Text variant="body">{result.synonyms.join(', ') || 'None'}</Text>
          </View>

          <View style={styles.section}>
            <Text variant="label" color={colors.textSecondary}>Antonyms</Text>
            <Text variant="body">{result.antonyms.join(', ') || 'None'}</Text>
          </View>

          <View style={styles.section}>
            <Text variant="label" color={colors.textSecondary}>Definitions</Text>
            {result.entries.map((entry, i) => {
              const senses = entry.senses ?? [];
              const entrySynonyms = entry.synonyms ?? [];
              const entryAntonyms = entry.antonyms ?? [];
              return (
                <View key={`${entry.partOfSpeech}-${i}`} style={styles.entry}>
                  <Text variant="caption" color={colors.modules.words}>{entry.partOfSpeech}</Text>
                  <Text variant="caption" color={colors.textTertiary}>
                    {senses.length} sense{senses.length === 1 ? '' : 's'}
                  </Text>
                  {entrySynonyms.length > 0 ? (
                    <Text variant="caption" color={colors.textSecondary}>
                      Entry synonyms: {entrySynonyms.join(', ')}
                    </Text>
                  ) : null}
                  {entryAntonyms.length > 0 ? (
                    <Text variant="caption" color={colors.textSecondary}>
                      Entry antonyms: {entryAntonyms.join(', ')}
                    </Text>
                  ) : null}
                  {senses.map((sense, index) => renderSense(sense, `${i}-${index}`))}
                </View>
              );
            })}
          </View>

          {(result.attributions ?? []).length > 0 ? (
            <View style={styles.section}>
              <Text variant="label" color={colors.textSecondary}>Sources</Text>
              {(result.attributions ?? []).map((source, index) => (
                <Text key={`${source.name}-${index}`} variant="caption" color={colors.textTertiary}>
                  {source.name} ({source.license})
                </Text>
              ))}
            </View>
          ) : null}
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  formGrid: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  langChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  langChipSelected: {
    borderColor: colors.modules.words,
    backgroundColor: colors.modules.words,
  },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: colors.modules.words,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  section: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  entry: {
    marginTop: spacing.sm,
    gap: 4,
  },
  senseWrap: {
    marginTop: spacing.xs,
    gap: 3,
  },
  quoteWrap: {
    marginTop: 2,
    gap: 2,
  },
  relatedWordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  relatedWordButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
});
