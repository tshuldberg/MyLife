# MyCloset - Feature Gap Design Doc
**Source:** Competitive Feature Analysis (2026-03-05)
**Status:** Stub (navigation only)

## Current State
Stub module with navigation scaffolding only. No business logic, no database tables, no screens implemented.

## Competitors Analyzed

| Competitor | Pricing | Focus |
|-----------|---------|-------|
| Cladwell | $96/yr | AI-powered wardrobe management, outfit suggestions, capsule wardrobe building |

## Feature Gaps (Full Build Required)

| Feature | Priority | Competitors That Have It | Implementation Difficulty | Notes |
|---------|----------|--------------------------|--------------------------|-------|
| Wardrobe catalog | P0 | Cladwell | Medium | Photograph and categorize all clothing items (tops, bottoms, shoes, accessories). Camera + gallery import |
| Category/tag organization | P0 | Cladwell | Low | Sort by type, color, season, occasion. Multi-tag filtering |
| Outfit builder | P0 | Cladwell | Medium | Combine items into outfits with visual preview. Drag-and-drop or tap-to-add |
| Outfit calendar/log | P0 | Cladwell | Low | Track what you wore each day. Calendar view with outfit thumbnails |
| Wear count tracking | P0 | None | Low | Increment wear count per item. See which items you actually use vs neglect |
| AI outfit suggestions | P1 | Cladwell | High | Daily outfit based on weather, calendar events, and what you haven't worn recently. On-device if possible |
| Weather-aware recommendations | P1 | Cladwell | Medium | Suggest layers and warmth level based on daily forecast |
| Laundry tracking | P1 | None | Low | Mark items as dirty/clean. Laundry day reminders and batch tracking |
| Packing list generator | P1 | PackPoint-like | Medium | Build packing lists from wardrobe for trips. Weather and activity aware |
| Cost-per-wear analysis | P1 | None | Low | Track item purchase price, divide by times worn. Surface best and worst value items |
| Donation suggestions | P1 | None | Low | Flag items not worn in 6+ months. Prompt to donate or sell |
| Style board/mood board | P2 | None | Medium | Save inspiration images from camera roll. Create themed collections |
| Shopping wishlist | P2 | None | Low | Track items you want to buy with notes and price tracking |
| Capsule wardrobe builder | P2 | Cladwell | Medium | Build minimalist seasonal capsule wardrobe from existing items |
| Seasonal rotation reminders | P2 | None | Low | Prompt to swap winter/summer clothes based on calendar and weather trends |
| Color palette analysis | P2 | None | Medium | Show your wardrobe's color distribution. Identify gaps and dominant palettes |

## Recommended MVP Features

Minimal feature set to ship v1 of MyCloset:

1. **Wardrobe catalog** - Photo-based item entry with automatic background removal
2. **Category/tag system** - Organize by type, color, season, occasion, brand
3. **Outfit builder** - Combine items into outfits with layered visual preview
4. **Outfit calendar** - Log daily outfits with calendar view
5. **Wear count tracking** - See which items get used and which collect dust
6. **Cost-per-wear** - Track purchase price and calculate value over time
7. **Donation suggestions** - Surface neglected items (6+ months unworn)

This MVP is a complete wardrobe management tool that provides insights no competitor offers (cost-per-wear, donation suggestions) while costing nothing compared to Cladwell's $96/yr.

## Full Feature Roadmap

1. **v1.0 (MVP)** - Wardrobe catalog, categories/tags, outfit builder, outfit calendar, wear tracking, cost-per-wear, donation suggestions
2. **v1.1** - Laundry tracking, seasonal rotation reminders
3. **v1.2** - Weather-aware outfit recommendations, packing list generator
4. **v1.3** - AI outfit suggestions (on-device), shopping wishlist
5. **v2.0** - Capsule wardrobe builder, color palette analysis
6. **v2.1** - Style board/mood board, seasonal capsule planning

## Privacy Competitive Advantage

Wardrobe apps collect deeply personal data: photos of everything you own, body measurements, style preferences, purchase history, and daily outfit choices. This data profile is valuable for fashion retailers and advertisers:

- **Cladwell** charges $96/yr and requires a cloud account. All wardrobe photos and outfit data are stored on their servers. They partner with fashion brands for recommendations (potential data sharing incentive).
- **Generic fashion apps** often monetize through affiliate links and targeted ads based on wardrobe data.

MyCloset's positioning: **Your wardrobe stays on your device.** No cloud upload of clothing photos, no body measurement data leaving the device, no purchase history shared with fashion brands. Photos and outfit data stored locally in SQLite. The combination of $0 cost and complete privacy makes Cladwell's $96/yr cloud-dependent model hard to justify.

## Cross-Module Integration

| Module | Integration Point |
|--------|------------------|
| MyBudget | Clothing purchase spending tracked and categorized. Cost-per-wear data enriches budget insights |
| MyHabits | Daily outfit planning as a morning habit. Outfit logging tracked as consistent routine |
| MyTrails | Activity-appropriate clothing suggestions for planned trips and outdoor activities |
| MyRecipes | No direct integration |
| MyJournal | Outfit photos can be journal entry attachments for daily life documentation |
