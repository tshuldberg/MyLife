# MyRecipes - Feature Gap Design Doc
**Source:** Competitive Feature Analysis (2026-03-05)
**Status:** Implemented (17+ tables)

## Current State

MyRecipes is one of the most feature-complete modules in MyLife. It includes full recipe CRUD, an ingredient parser with unit conversion, recipe scaling, a step-by-step cooking mode with multiple timers, a weekly meal planner, shopping lists with aisle grouping, a pantry tracker, garden-to-recipe linking, event hosting with RSVP integration, and allergy/dietary detection. The module uses local SQLite storage with the `rc_` table prefix.

## Competitors Analyzed

| Competitor | Pricing | Platform | Cloud Required |
|-----------|---------|----------|---------------|
| Paprika | $4.99 (iOS), $29.99 (Windows/Mac) one-time | iOS, Android, Mac, Windows | Optional sync |
| Mela | $4.99 one-time | iOS, Mac | No |
| Plan to Eat | $49.97/yr | Web, iOS, Android | Yes |

## Feature Gaps

| Feature | Priority | Competitors That Have It | Implementation Difficulty | Notes |
|---------|----------|--------------------------|--------------------------|-------|
| Video recipe import (YouTube/Instagram/TikTok) | P1 | Mela | Medium | Import recipes from video URLs, extract steps and ingredients via metadata or transcript parsing |
| Paper recipe OCR scanning | P1 | Mela | Medium | Photograph a paper recipe or cookbook page and extract text via on-device OCR |
| Print recipes | P2 | Paprika | Low | Clean printable recipe layout optimized for standard paper sizes |
| Recipe sharing/export as link | P2 | Various | Low | Generate a shareable recipe card as an image or a standalone link |
| Nutritional info per recipe | P1 | Plan to Eat | Medium | Auto-calculate calories, macros, and micronutrients per serving from ingredient list |
| Voice control in cooking mode | P2 | None | Medium | Hands-free commands: "next step", "start timer", "read ingredients" |
| AI recipe suggestions | P2 | None | Medium | Suggest recipes based on pantry contents, dietary preferences, and expiring ingredients |
| Import from more sources | P1 | Paprika | Low | Support broader recipe website formats and URL scraping beyond current parsers |

## Recommended Features to Build

1. **Paper recipe OCR scanning** - High user value for digitizing handwritten and cookbook recipes. On-device OCR keeps data private and works offline. Leverage Apple Vision framework (iOS) and ML Kit (Android).

2. **Video recipe import** - YouTube and TikTok recipes are increasingly popular. Parse video metadata, descriptions, and (where available) transcripts to extract structured recipe data. No need to download the video itself.

3. **Nutritional info per recipe** - Auto-calculate from ingredient quantities using a local food composition database. If MyNutrition module is built, share the same food database. Display per-serving breakdown on the recipe detail screen.

4. **Import from more sources** - Expand the URL recipe scraper to handle more website formats. Support JSON-LD structured data (Schema.org Recipe), Microdata, and common blog layouts. Low effort with high user impact.

5. **Print recipes** - Generate a clean, ink-friendly layout with large text, clear ingredient lists, and step numbering. Straightforward to implement via a print stylesheet (web) or share sheet (mobile).

6. **Recipe sharing/export as link** - Generate a visually appealing recipe card image or a self-contained HTML file. No server required since the card is generated locally.

7. **AI recipe suggestions** - "What can I make tonight?" based on pantry contents and dietary preferences. Can run locally with a simple matching algorithm before considering any LLM integration.

8. **Voice control in cooking mode** - Hands-free navigation through recipe steps while cooking. Leverage platform speech recognition APIs. Useful but not a top priority since competitors also lack this.

## Privacy Competitive Advantage

MyRecipes is already the most feature-rich option in this category, and it stores everything locally at no recurring cost. Paprika and Mela are privacy-respectable one-time purchases, but they lack many of MyRecipes' features (meal planning, pantry tracking, garden integration, event hosting). Plan to Eat charges $49.97/yr and requires cloud storage for core functionality. By adding OCR, video import, and nutritional data while keeping everything on-device, MyRecipes becomes the clear best-in-class choice for users who value both features and privacy.

## Cross-Module Integration

| Module | Integration |
|--------|------------|
| **MyNutrition** | Share food composition database for calorie/macro calculations. Recipes auto-populate nutrition logs. |
| **MyFast** | Meal planning respects fasting windows. Suggest recipes that fit within eating periods. |
| **MyGarden** | Harvest-to-recipe linking already exists. Suggest recipes when garden produce is ready. |
| **MyBudget** | Track grocery spending from shopping lists. Estimate recipe costs from ingredient prices. |
| **MyHealth** | Surface dietary patterns and their health correlations over time. |
| **MyRSVP** | Event meal planning with dietary preference collection from guests. |
