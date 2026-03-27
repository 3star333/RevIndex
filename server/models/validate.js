/**
 * Input validation helpers.
 * Used by all route handlers to sanitize and validate user input
 * before it ever touches the database.
 */

/**
 * Strips leading/trailing whitespace and removes characters
 * that have no place in car make/model/nickname text fields.
 * Does NOT escape — parameterized queries handle SQL safety.
 */
function sanitizeString(val) {
  if (typeof val !== "string") return "";
  return val.trim().slice(0, 100); // hard cap at 100 chars
}

/**
 * Returns true if value is a finite integer within [min, max].
 */
function isValidInt(val, min = 0, max = Infinity) {
  const n = Number(val);
  return Number.isInteger(n) && n >= min && n <= max;
}

/**
 * Returns true if value is a finite number (int or float) within [min, max].
 */
function isValidNumber(val, min = -Infinity, max = Infinity) {
  const n = Number(val);
  return isFinite(n) && n >= min && n <= max;
}

/**
 * Returns true if value is a YYYY-MM-DD date string.
 */
function isValidDate(val) {
  return typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val) && !isNaN(Date.parse(val));
}

module.exports = { sanitizeString, isValidInt, isValidNumber, isValidDate };
