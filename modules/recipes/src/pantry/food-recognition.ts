import type { GrocerySection } from '../types';

export interface FoodRecognitionResult {
  suggestedName: string | null;
  suggestedCategory: GrocerySection | null;
  confidence: number;
  labels: string[];
}

/**
 * Identify food items in a photo using Claude Vision API.
 * Only called when user explicitly taps "Identify Food" (opt-in feature).
 *
 * @param imageBase64 - Base64-encoded image data
 * @param apiKey - User's Claude API key (stored in preferences)
 * @returns Structured food recognition result
 */
export async function identifyFood(
  imageBase64: string,
  apiKey: string,
): Promise<FoodRecognitionResult> {
  const emptyResult: FoodRecognitionResult = {
    suggestedName: null,
    suggestedCategory: null,
    confidence: 0,
    labels: [],
  };

  if (!apiKey || !imageBase64) return emptyResult;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: 'Identify the food items in this image. Respond with ONLY a JSON object (no markdown): {"name": "primary food item name", "category": "one of: produce, dairy, meat, pantry, frozen, bakery, beverages, snacks, condiments, other", "confidence": 0.0-1.0, "labels": ["list", "of", "all", "food", "items", "visible"]}',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) return emptyResult;

    const data = (await response.json()) as { content?: Array<{ text?: string }> };
    const text = data?.content?.[0]?.text ?? '';

    // Parse the JSON response
    const parsed = JSON.parse(text);

    return {
      suggestedName: parsed.name ?? null,
      suggestedCategory: parsed.category ?? null,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      labels: Array.isArray(parsed.labels) ? parsed.labels : [],
    };
  } catch {
    return emptyResult;
  }
}
