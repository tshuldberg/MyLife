# MyMarket - Feature Gap Design Doc
**Source:** Module Spec Design (2026-03-10)
**Status:** Spec Complete, Implementation Not Started

## Current State

MyMarket is a new module being designed for the MyLife hub. It does not yet exist as a standalone app or hub module. This document analyzes the competitive landscape and identifies feature gaps relative to leading marketplace platforms.

## Competitors Analyzed

| Competitor | Price | Category | Key Strength |
|-----------|-------|----------|-------------|
| Facebook Marketplace | Free (ad-supported) | General marketplace | Massive audience, social trust, Messenger integration |
| OfferUp | Free (fee on shipped) | General marketplace | TruYou verification, dedicated marketplace UX |
| Craigslist | Free | Classifieds | Simple, free, massive traffic |
| Mercari | Free (10% seller fee) | Shipping marketplace | Buyer protection, shipping labels, instant pay |
| Poshmark | Free (20% seller fee) | Fashion marketplace | Social selling, authentication service |
| NextDoor | Free (ad-supported) | Local community | Neighborhood trust, verified addresses |
| Depop | Free (10% seller fee) | Fashion/vintage | Gen Z audience, social shopping |
| Letgo (merged with OfferUp) | Free | General marketplace | AI photo recognition, simple listing flow |

## Feature Comparison Matrix

| Feature | FB Marketplace | OfferUp | Craigslist | Mercari | MyMarket (Planned) |
|---------|---------------|---------|------------|---------|-------------------|
| Free listings | Yes | Yes | Yes | Yes | Yes |
| Seller fees | No | 12.9% shipped | No | 10% | None |
| User profiles | Yes (Facebook) | Yes | No | Yes | Yes (social profiles) |
| Seller ratings | Yes | Yes | No | Yes | Yes |
| In-app messaging | Yes (Messenger) | Yes | Email relay | Yes | Yes (Supabase Realtime) |
| Shipping labels | Yes | Yes | No | Yes | No (MVP) |
| Location filtering | Yes | Yes | Yes | No | Yes (PostGIS) |
| Full-text search | Yes | Yes | Basic | Yes | Yes (tsvector) |
| Photo upload | Yes (multiple) | Yes (multiple) | Yes (limited) | Yes (multiple) | Yes (1-10, EXIF stripped) |
| Offer system | Yes | Yes | No | Yes | Yes |
| Categories | Yes | Yes | Yes | Yes | Yes (hierarchical) |
| Saved searches | Yes | Yes | No | Yes | Yes |
| Price alerts | Limited | Yes | No | Yes | Yes |
| Content moderation | Yes (AI + manual) | Yes | Flagging only | Yes | Yes (keyword + community) |
| Payment processing | Yes (Meta Pay) | Yes (built-in) | No | Yes (built-in) | No (MVP) |
| Buyer protection | Yes | Yes (shipped) | No | Yes | No (MVP) |
| Ad targeting | Heavy | Yes | Minimal | Yes | None |
| Data tracking | Heavy | Yes | Minimal | Yes | None |
| Privacy | Poor | Moderate | Good | Moderate | Excellent |

## Feature Gaps vs. Competitors

| Feature | Priority | Competitors That Have It | Implementation Difficulty | Notes |
|---------|----------|--------------------------|--------------------------|-------|
| In-app payment processing | P2 | FB Marketplace, OfferUp, Mercari, Poshmark | High | Stripe Connect integration. Adds buyer protection, escrow, and payment tracking. Significant compliance overhead. Recommend Phase 3+ |
| Shipping label generation | P2 | FB Marketplace, OfferUp, Mercari, Poshmark | High | Requires carrier API integration (USPS, UPS, FedEx). Enables non-local sales. Recommend Phase 3+ |
| Buyer protection program | P2 | FB Marketplace, OfferUp, Mercari | High | Requires payment integration + dispute resolution process. Recommend after payment is added |
| AI photo recognition | P3 | FB Marketplace, OfferUp (Letgo) | Medium | Auto-suggest category, title, and price from listing photos. On-device ML or Claude API |
| Promoted/boosted listings | N/A | FB Marketplace, OfferUp | Low | Contradicts privacy-first philosophy. Deliberately excluded |
| Vehicle-specific fields | P2 | FB Marketplace, Craigslist, OfferUp | Low | Make, model, year, mileage, VIN lookup for vehicle listings. Add as category-specific fields |
| Real estate listings | P3 | FB Marketplace, Craigslist | Medium | Rental/sale listings with property-specific fields. Complex compliance landscape |
| Job postings | P3 | Craigslist, Facebook | Medium | Job listings with application flow. Out of scope for initial marketplace |
| Social shopping feed | P2 | Poshmark, Depop | Medium | Browse listings from followed sellers. Integrates with existing social follow system |
| Authentication service | P3 | Poshmark (luxury items) | High | Verify authenticity of luxury/collectible items. Requires expert network or AI verification |
| QR code meetup | P1 | None (novel) | Low | Generate QR code for safe meetup confirmation. Both parties scan to confirm exchange. Novel safety feature |
| Listing templates | P1 | None widely | Low | Save listing templates for recurring categories (e.g., "I frequently sell books"). Quick-fill from template |
| Cross-module listing | P2 | None (unique to MyLife) | Medium | "Sell this item" button in MyBooks, MyCloset, etc. Auto-populate listing from module data |
| Group marketplaces | P2 | Facebook (Buy Nothing groups), NextDoor | Medium | Post listings visible only within a social group. Leverages existing groups system |
| Barcode/ISBN lookup | P1 | Mercari, OfferUp | Low | Scan barcode to auto-fill product details. Use Open Library (books) or UPC databases |

## Recommended Features to Build (Beyond MVP)

### Phase 2 Additions

1. **QR code meetup confirmation** - Generate unique QR codes for buyer-seller meetups. Both parties scan to confirm the exchange happened. Builds trust and creates a transaction record. Novel feature no competitor offers.

2. **Listing templates** - Save reusable listing templates for common categories. A book seller can save a "Used Book" template with pre-filled condition, description boilerplate, and category. Reduces listing friction for power sellers.

3. **Barcode/ISBN lookup** - Scan a barcode to auto-fill product title, description, and suggested price. Use Open Library API for books (ISBN), generic UPC databases for other products. Reduces listing creation time from minutes to seconds.

4. **Social shopping feed** - A "Following" tab that shows recent listings from sellers the user follows. Integrates with the existing social follow system. Good for collectors who follow specific sellers.

### Phase 3 Additions

5. **Cross-module listing** - A "Sell this" button in MyBooks, MyCloset, MyGarden (plants), and other relevant modules. Auto-populates a marketplace listing with data from the source module (book title, clothing size, plant type). Unique to the MyLife ecosystem.

6. **Vehicle-specific fields** - Extended listing fields for the Vehicles category: make, model, year, mileage, transmission, fuel type. Optional VIN lookup for vehicle history. Important for a competitive general marketplace.

7. **In-app payment processing** - Stripe Connect integration for optional in-app payments. Enables buyer protection (escrow until delivery confirmed). Seller payouts via Stripe. Only activate if there's user demand.

8. **Shipping support** - Generate shipping labels via carrier APIs. Calculate shipping costs. Track delivery. Enables non-local sales. Only pursue if payment processing is in place.

9. **Group marketplaces** - Scoped marketplaces within social groups. A "SF Buy Nothing" group can have its own marketplace visible only to members. Leverages existing `social_groups` and `social_group_members` tables.

10. **AI-powered listing assistance** - Claude API integration for: auto-suggest title from photos, generate compelling descriptions, suggest fair pricing based on condition and category averages, detect prohibited items in photos.

## MyMarket Differentiators (vs. All Competitors)

1. **Zero fees** - No listing fees, no seller fees, no transaction fees, no subscription beyond MyLife Pro
2. **Zero tracking** - No ad targeting, no behavioral tracking, no data selling
3. **EXIF stripping** - All photo metadata removed on upload (no competitor does this)
4. **Approximate location only** - Neighborhood-level, never exact address
5. **Integrated reputation** - Seller profiles backed by cross-module social profiles (a seller with 100 workout sessions and 50 books read is a real person)
6. **Cross-module listing** - Sell items directly from other MyLife modules (unique to ecosystem)
7. **No algorithmic manipulation** - Chronological + relevance sorting only, no "pay to play"
8. **Community moderation** - Report threshold auto-flagging, no centralized content police
