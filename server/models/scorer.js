/**
 * RevIndex Scoring Engine
 *
 * Formula (mirrors your spec):
 *
 *   base_value         = price
 *   age_depreciation   = AGE_RATE * age          (e.g. 8% per year, capped at 80%)
 *   mileage_penalty    = MILEAGE_RATE * mileage  (e.g. $0.06 per mile)
 *
 *   value = base_value * (1 - age_depreciation) - mileage_penalty
 *   value = value * condition_multiplier + mod_adjustment
 *
 * condition_multiplier:
 *   "excellent" → 1.10   (boosts value 10%)
 *   "good"      → 1.00   (no change, baseline)
 *   "fair"      → 0.85   (reduces value 15%)
 *   "poor"      → 0.65   (reduces value 35%)
 *
 * mod_adjustment:
 *   Positive → aftermarket upgrades add value  (e.g. +500)
 *   Negative → known issues subtract value     (e.g. -1000)
 *
 * score:
 *   Higher estimated_value = better deal relative to asking price.
 *   deal_score = estimated_value - price
 *   Positive → underpriced (good deal)
 *   Negative → overpriced  (bad deal)
 */

const CURRENT_YEAR  = new Date().getFullYear();
const AGE_RATE      = 0.08;   // 8% depreciation per year
const MAX_AGE_DEPR  = 0.80;   // cap depreciation at 80%
const MILEAGE_RATE  = 0.06;   // $0.06 penalty per mile

const CONDITION_MULTIPLIERS = {
  excellent: 1.10,
  good:      1.00,
  fair:      0.85,
  poor:      0.65,
};

const VALID_CONDITIONS = Object.keys(CONDITION_MULTIPLIERS);

/**
 * Score a single listing.
 * @param {object} listing - { price, mileage, year, condition, mod_adjustment }
 * @returns {object} scoring breakdown + deal_score
 */
function scoreListing(listing) {
  const { price, mileage, year, condition = "good", mod_adjustment = 0 } = listing;

  const age             = Math.max(0, CURRENT_YEAR - year);
  const age_depreciation = Math.min(AGE_RATE * age, MAX_AGE_DEPR);
  const mileage_penalty  = MILEAGE_RATE * mileage;

  const condition_multiplier =
    CONDITION_MULTIPLIERS[condition.toLowerCase()] ?? CONDITION_MULTIPLIERS.good;

  // Step 1: depreciate by age, subtract mileage penalty
  let estimated_value = price * (1 - age_depreciation) - mileage_penalty;

  // Step 2: apply condition multiplier and mod adjustment
  estimated_value = estimated_value * condition_multiplier + Number(mod_adjustment);

  // Clamp to 0 — a car can't have negative value
  estimated_value = Math.max(0, estimated_value);

  // deal_score: positive = underpriced (good deal), negative = overpriced
  const deal_score = Math.round(estimated_value - price);

  return {
    estimated_value: Math.round(estimated_value),
    deal_score,
    scoring_breakdown: {
      age,
      age_depreciation_pct: Math.round(age_depreciation * 100),
      mileage_penalty:      Math.round(mileage_penalty),
      condition_multiplier,
      mod_adjustment:       Number(mod_adjustment),
    },
  };
}

/**
 * Score and rank an array of listings.
 * Sorted by deal_score descending (best deal first).
 * @param {object[]} listings
 * @returns {object[]} listings with score fields added, sorted best→worst
 */
function rankListings(listings) {
  const scored = listings.map((listing) => ({
    ...listing,
    ...scoreListing(listing),
  }));

  // Best deal (highest deal_score) first
  scored.sort((a, b) => b.deal_score - a.deal_score);

  // Add rank position (1-based)
  return scored.map((item, idx) => ({ rank: idx + 1, ...item }));
}

module.exports = { scoreListing, rankListings, VALID_CONDITIONS };
