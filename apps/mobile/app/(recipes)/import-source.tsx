import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  fetchHtml,
  parseRecipeFromHtml,
  parseRecipeFromText,
  detectPlatform,
  fetchSocialMetadata,
  extractRecipeFromText,
  extractRecipeFromImage,
  getSetting,
  type ParsedRecipe,
} from '@mylife/recipes';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.recipes;

export default function ImportSourceScreen() {
  const router = useRouter();
  const db = useDatabase();

  const [url, setUrl] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [showPasteMode, setShowPasteMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const getApiKey = (): string | null => {
    try {
      return getSetting(db, 'claude_api_key');
    } catch {
      return null;
    }
  };

  const navigateToReview = (
    parsed: ParsedRecipe,
    source: string,
    sourceUrl?: string,
    metadata?: { author?: string; thumbnailUrl?: string },
  ) => {
    router.push({
      pathname: '/(recipes)/import-review',
      params: {
        parsed: JSON.stringify(parsed),
        source,
        sourceUrl: sourceUrl ?? '',
        metaAuthor: metadata?.author ?? '',
        metaThumb: metadata?.thumbnailUrl ?? '',
      },
    });
  };

  const handleUrlImport = async (targetUrl: string) => {
    const trimmed = targetUrl.trim();
    if (!trimmed) {
      Alert.alert('Enter a URL', 'Paste or type a recipe URL.');
      return;
    }

    setLoading(true);
    try {
      const platform = detectPlatform(trimmed);

      if (platform) {
        // Social media pipeline
        setStatus(`Fetching ${platform} metadata...`);
        const metadata = await fetchSocialMetadata(trimmed);

        const apiKey = getApiKey();
        if (apiKey && metadata.captionText) {
          setStatus('Extracting recipe with AI...');
          const parsed = await extractRecipeFromText(
            metadata.captionText,
            apiKey,
            { sourceUrl: trimmed, author: metadata.author ?? undefined },
          );
          if (parsed) {
            navigateToReview(parsed, platform, trimmed, {
              author: metadata.author ?? undefined,
              thumbnailUrl: metadata.thumbnailUrl ?? undefined,
            });
            return;
          }
        }

        // Fallback: show caption text for manual entry
        if (metadata.captionText) {
          navigateToReview(
            {
              title: metadata.title || '',
              description: metadata.captionText,
              ingredients: [],
              steps: [],
            },
            platform,
            trimmed,
            { author: metadata.author ?? undefined, thumbnailUrl: metadata.thumbnailUrl ?? undefined },
          );
        } else {
          Alert.alert(
            'Could Not Extract',
            `No recipe content found from this ${platform} link. Try pasting the recipe text instead.`,
          );
        }
      } else {
        // Regular URL pipeline
        setStatus('Fetching page...');
        const result = await fetchHtml(trimmed);

        setStatus('Parsing recipe...');
        const parsed = parseRecipeFromHtml(result.html);
        if (parsed) {
          navigateToReview(parsed, 'url', parsed.source_url ?? trimmed);
          return;
        }

        // Fallback: try AI extraction if available
        const apiKey = getApiKey();
        if (apiKey) {
          setStatus('Trying AI extraction...');
          const aiParsed = await extractRecipeFromText(
            result.html.slice(0, 8000),
            apiKey,
          );
          if (aiParsed) {
            navigateToReview(aiParsed, 'url', trimmed);
            return;
          }
        }

        Alert.alert(
          'No Recipe Found',
          'Could not find recipe data on this page. Try pasting the recipe text instead.',
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Import Failed', message);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const handlePasteText = () => {
    const trimmed = pasteText.trim();
    if (!trimmed) {
      Alert.alert('Empty Text', 'Paste or type the recipe text.');
      return;
    }

    const parsed = parseRecipeFromText(trimmed);
    if (parsed) {
      navigateToReview(parsed, 'text');
    } else {
      // Even if parser returns null, pass the text as description for manual editing
      navigateToReview(
        { title: '', description: trimmed, ingredients: [], steps: [] },
        'text',
      );
    }
  };

  const handlePhotoImport = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        base64: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]?.base64) return;

      const apiKey = getApiKey();
      if (!apiKey) {
        Alert.alert(
          'API Key Required',
          'Photo import requires a Claude API key. Add one in Settings.',
        );
        return;
      }

      setLoading(true);
      setStatus('Analyzing photo...');
      const parsed = await extractRecipeFromImage(result.assets[0].base64, apiKey);

      if (parsed) {
        navigateToReview(parsed, 'photo');
      } else {
        Alert.alert('Could Not Extract', 'No recipe found in this image. Try a clearer photo.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Photo Import Failed', message);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Card>
        <Text variant="subheading">Import from URL</Text>
        <Text variant="caption" color={colors.textSecondary} style={styles.hint}>
          Paste a recipe URL from any website, Instagram, TikTok, or YouTube
        </Text>

        <View style={styles.urlRow}>
          <TextInput
            style={[styles.input, styles.flex1]}
            value={url}
            onChangeText={setUrl}
            placeholder="https://..."
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            keyboardType="url"
            autoCorrect={false}
            editable={!loading}
          />
          <Pressable
            style={[styles.goButton, loading ? styles.goButtonDisabled : null]}
            onPress={() => handleUrlImport(url)}
            disabled={loading}
          >
            <Text variant="label" color={colors.background}>
              {loading ? '...' : 'Go'}
            </Text>
          </Pressable>
        </View>

        {loading && status ? (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={ACCENT} />
            <Text variant="caption" color={colors.textSecondary}>{status}</Text>
          </View>
        ) : null}
      </Card>

      <Card>
        <Text variant="subheading">Other Sources</Text>

        <Pressable
          style={styles.actionCard}
          onPress={handlePhotoImport}
          disabled={loading}
        >
          <Text style={styles.actionIcon}>{'📷'}</Text>
          <View style={styles.flex1}>
            <Text variant="body">Scan Recipe Photo</Text>
            <Text variant="caption" color={colors.textSecondary}>
              Take or choose a photo of a recipe
            </Text>
          </View>
        </Pressable>

        <View style={styles.separator} />

        <Pressable
          style={styles.actionCard}
          onPress={() => setShowPasteMode(!showPasteMode)}
          disabled={loading}
        >
          <Text style={styles.actionIcon}>{'📝'}</Text>
          <View style={styles.flex1}>
            <Text variant="body">Paste Recipe Text</Text>
            <Text variant="caption" color={colors.textSecondary}>
              Paste or type a recipe to import
            </Text>
          </View>
        </Pressable>

        {showPasteMode ? (
          <View style={styles.pasteSection}>
            <TextInput
              style={[styles.input, styles.pasteInput]}
              value={pasteText}
              onChangeText={setPasteText}
              placeholder="Paste recipe text here..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
            <Pressable
              style={styles.parseButton}
              onPress={handlePasteText}
            >
              <Text variant="label" color={colors.background}>Parse Recipe</Text>
            </Pressable>
          </View>
        ) : null}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  hint: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  urlRow: {
    flexDirection: 'row',
    gap: spacing.xs,
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
  flex1: {
    flex: 1,
  },
  goButton: {
    borderRadius: 8,
    backgroundColor: ACCENT,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  goButtonDisabled: {
    opacity: 0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionIcon: {
    fontSize: 28,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  pasteSection: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  pasteInput: {
    minHeight: 140,
  },
  parseButton: {
    borderRadius: 8,
    backgroundColor: ACCENT,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
});
