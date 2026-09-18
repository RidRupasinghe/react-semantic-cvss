import { CVSSCalc } from "./CVSSCalc";

// Main component export (named and default)
export { CVSSCalc };
export default CVSSCalc;

// Calculation and parsing utilities
export {
  calculateCVSS31,
  calculateCVSS31 as calculate,
  parseCVSS31Vector,
  parseCVSS31Vector as parseVector,
  getSeverityRating,
  getSeverityRating as severityRating,
  roundup,
  giveFulldata
} from "./utils/cvss31";

// Type definitions
export * from "./types";

// Domain data & constants
export { baseMatrices, severityRatings, popupData, weight } from "./data";
export { Colors } from "./colors";
