# MyCar - Feature Gap Design Doc
**Source:** Competitive Feature Analysis (2026-03-05)
**Status:** Implemented (4 tables)

## Current State

MyCar tracks multiple vehicles with service history logging, fuel economy calculations, and maintenance cost analysis. The module uses local SQLite storage with the `cr_` table prefix. It covers the basics well but lacks the scheduling, document management, and trip tracking features that would make it a complete vehicle ownership companion.

## Competitors Analyzed

| Competitor | Pricing | Platform | Cloud Required |
|-----------|---------|----------|---------------|
| Drivvo | Free with ads, Pro removes ads | iOS, Android | Optional sync |
| Fuelio | ~$5 one-time (Android), Free with ads (iOS) | iOS, Android | Optional sync |
| Expensify | Free tier / $5-18/mo business | iOS, Android, Web | Yes |

## Feature Gaps

| Feature | Priority | Competitors That Have It | Implementation Difficulty | Notes |
|---------|----------|--------------------------|--------------------------|-------|
| Maintenance schedule reminders | P0 | Drivvo, Fuelio | Low | Remind for oil change, tire rotation, inspection based on mileage intervals or date intervals |
| Cost per mile/km analysis | P1 | Drivvo, Fuelio | Low | Total cost of ownership broken down per distance unit, including fuel, maintenance, insurance |
| Trip log with purpose | P1 | Expensify | Low | Categorize trips as personal, business, or commute for tax deduction and reimbursement tracking |
| Mileage tracking (GPS) | P1 | Expensify | Medium | Auto-record trip distance with GPS. Optional manual entry as fallback. |
| Insurance document storage | P1 | None | Low | Store insurance cards, policy details, renewal dates, and claim history |
| Registration/inspection tracker | P1 | None | Low | Track registration expiry and inspection due dates with push notification reminders |
| Tire tracking (tread depth, rotation) | P2 | None | Low | Track tire brand, purchase date, mileage since install, and rotation schedule |
| Parking location saver | P2 | None | Low | Save where you parked with optional photo and expiration timer |
| Fuel price comparison | P2 | Fuelio | Medium | Show nearby gas prices. Requires a location-aware API or manual community data. |
| VIN decoder | P2 | None | Low | Look up vehicle specs, recall notices, and manufacturing details from VIN |
| OBD-II diagnostic reader | P3 | None | High | Read engine diagnostic codes via Bluetooth OBD-II adapter. Significant hardware integration effort. |

## Recommended Features to Build

1. **Maintenance schedule reminders** - The single most requested feature in car tracking apps. Define intervals by mileage or time (e.g., oil change every 5,000 miles or 6 months). Push notifications when due. Low implementation difficulty with high daily utility.

2. **Cost per mile/km analysis** - Aggregate all recorded expenses (fuel, maintenance, insurance, registration) and divide by total mileage to show true cost of ownership. Straightforward calculation over existing data.

3. **Trip log with purpose** - Add a trip entry with distance, purpose category (personal/business/commute), and optional notes. Essential for users who deduct mileage on taxes. Can work with manual odometer readings initially.

4. **Registration/inspection tracker** - Store registration and inspection dates per vehicle. Send reminders before expiry. Simple date tracking with notification scheduling.

5. **Insurance document storage** - Store policy number, provider, coverage details, renewal date, and photos of insurance cards. Useful as a quick reference during traffic stops or accidents.

6. **Mileage tracking (GPS)** - Auto-record trips with start/stop GPS tracking. Requires background location permissions. Offer manual entry as an alternative for privacy-conscious users.

7. **Tire tracking** - Log tire purchases, track mileage per set, schedule rotations. Pairs well with maintenance reminders.

8. **Parking location saver** - Drop a pin when you park, optionally attach a photo and set a meter timer. Lightweight feature with immediate utility.

9. **VIN decoder** - Use the free NHTSA VIN decoder API to auto-populate vehicle specs. One API call per vehicle, results cached locally.

10. **Fuel price comparison** - Display nearby fuel prices. Consider privacy trade-offs of location sharing. Could use anonymized queries or manual zip code entry.

11. **OBD-II diagnostic reader** - Aspirational feature. Requires Bluetooth integration with OBD-II adapters. Defer to Phase 5+ unless user demand is high.

## Privacy Competitive Advantage

Most car tracking apps are ad-supported (Drivvo free tier) or require cloud accounts for core functionality (Expensify). Fuelio is the closest privacy-respectable competitor as a one-time purchase, but it still uses optional cloud sync that many users enable by default. MyCar keeps all vehicle data, trip logs, documents, and location history strictly on-device. This is especially important for mileage/GPS tracking, where location data is highly sensitive. Users get Expensify-level trip tracking without sharing their movement patterns with any server.

## Cross-Module Integration

| Module | Integration |
|--------|------------|
| **MyBudget** | Auto-categorize fuel fill-ups and maintenance expenses. Show vehicle costs as a budget category with trends. |
| **MyHabits** | Car maintenance tasks (check tire pressure, wash car) as recurring habits with streak tracking. |
| **MyHealth** | Track commute duration and its impact on daily activity time and stress levels. |
| **MyRecipes** | Grocery trip mileage tracking for cost-per-trip analysis. |
| **MyFast** | No direct integration. |
