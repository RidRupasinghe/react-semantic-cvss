import { baseMatrices, severityRatings, weight, exploitabilityCoefficient, scopeCoefficient } from "../data";
import {
  CVSSMetricKey,
  CVSSSelections,
  CVSSSeverityRating,
  CVSSCalculationResult,
  CVSSParseResult
} from "../types";

export const REQUIRED_BASE_METRIC_KEYS: CVSSMetricKey[] = [
  'AV', 'AC', 'PR', 'UI', 'S', 'C', 'I', 'A'
];

/**
 * FIRST CVSS v3.1 specification round up function.
 * Returns the smallest number with 1 decimal place that is greater than or equal to input.
 */
export function roundup(input: number): number {
  const intInput = Math.round(input * 100000);
  if (intInput % 10000 === 0) {
    return intInput / 100000;
  }
  return (Math.floor(intInput / 10000) + 1) / 10;
}

/**
 * Returns severity rating object for a given numeric score.
 * Handles boundary conditions without floating point comparison gaps.
 */
export function getSeverityRating(score: number | null | undefined): CVSSSeverityRating {
  if (score === null || score === undefined || isNaN(score)) {
    return {
      name: "?",
      bottom: 'Not',
      top: 'defined',
      color: "#767676"
    };
  }

  if (score === 0.0) {
    return severityRatings[0]; // None
  }
  if (score > 0.0 && score < 4.0) {
    return severityRatings[1]; // Low
  }
  if (score >= 4.0 && score < 7.0) {
    return severityRatings[2]; // Medium
  }
  if (score >= 7.0 && score < 9.0) {
    return severityRatings[3]; // High
  }
  if (score >= 9.0 && score <= 10.0) {
    return severityRatings[4]; // Critical
  }

  return {
    name: "?",
    bottom: 'Not',
    top: 'defined',
    color: "#767676"
  };
}

/**
 * Calculate CVSS v3.1 Base Score and severity rating.
 */
export function calculateCVSS31(selections: CVSSSelections): CVSSCalculationResult {
  const isComplete = REQUIRED_BASE_METRIC_KEYS.every(
    key => typeof selections[key] === 'string' && selections[key].trim() !== ''
  );

  if (!isComplete) {
    return {
      score: null,
      scoreString: "-",
      string: "",
      selections,
      ratingDetails: getSeverityRating(null),
      isComplete: false
    };
  }

  const s = selections.S as 'U' | 'C';
  const pr = selections.PR as 'N' | 'L' | 'H';

  const prWeight = weight.PR[s]?.[pr] ?? 0;
  const avWeight = weight.AV[selections.AV as keyof typeof weight.AV] ?? 0;
  const acWeight = weight.AC[selections.AC as keyof typeof weight.AC] ?? 0;
  const uiWeight = weight.UI[selections.UI as keyof typeof weight.UI] ?? 0;
  const sWeight = weight.S[s] ?? 0;
  const cWeight = weight.C[selections.C as keyof typeof weight.C] ?? 0;
  const iWeight = weight.I[selections.I as keyof typeof weight.I] ?? 0;
  const aWeight = weight.A[selections.A as keyof typeof weight.A] ?? 0;

  // Impact sub score multiplier
  const iss = 1 - ((1 - cWeight) * (1 - iWeight) * (1 - aWeight));

  let impactSubScore: number;
  if (s === 'U') {
    impactSubScore = sWeight * iss;
  } else {
    // Scope Changed
    const adjustedMultiplier = Math.max(0, iss - 0.02);
    impactSubScore = sWeight * (iss - 0.029) - 3.25 * Math.pow(adjustedMultiplier, 15);
  }

  const exploitabilitySubScore = exploitabilityCoefficient * avWeight * acWeight * prWeight * uiWeight;

  let baseScore: number;
  if (impactSubScore <= 0) {
    baseScore = 0.0;
  } else if (s === 'U') {
    baseScore = roundup(Math.min(exploitabilitySubScore + impactSubScore, 10));
  } else {
    baseScore = roundup(Math.min((exploitabilitySubScore + impactSubScore) * scopeCoefficient, 10));
  }

  const vectorString = `CVSS:3.1/AV:${selections.AV}/AC:${selections.AC}/PR:${selections.PR}/UI:${selections.UI}/S:${selections.S}/C:${selections.C}/I:${selections.I}/A:${selections.A}`;

  return {
    score: baseScore,
    scoreString: baseScore.toFixed(1),
    string: vectorString,
    selections,
    ratingDetails: getSeverityRating(baseScore),
    isComplete: true
  };
}

/**
 * Validates and parses a CVSS v3.1 (or v3.0) vector string.
 */
export function parseCVSS31Vector(vector: string | null | undefined): CVSSParseResult {
  if (!vector || typeof vector !== 'string') {
    return {
      ok: false,
      error: {
        title: "Empty Vector",
        message: "No CVSS vector string was provided."
      }
    };
  }

  const trimmed = vector.trim();
  const parts = trimmed.split('/');
  const prefix = parts[0];

  if (!prefix || !prefix.startsWith("CVSS:")) {
    return {
      ok: false,
      error: {
        title: "Invalid Format",
        message: "CVSS string must begin with 'CVSS:3.1/' (or 'CVSS:3.0/')."
      }
    };
  }

  const version = prefix.split(':')[1];
  if (version !== "3.1" && version !== "3.0") {
    return {
      ok: false,
      error: {
        title: "Unsupported Version",
        message: `Version '${version}' is not supported. Please provide a valid CVSS 3.1 vector string.`
      }
    };
  }

  const metricParts = parts.slice(1);
  const selections: Record<string, string> = {};
  const seenKeys = new Set<string>();

  for (const part of metricParts) {
    if (!part) continue;
    const [key, value] = part.split(':');
    if (!key || !value) {
      return {
        ok: false,
        error: {
          title: "Malformed Metric",
          message: `Malformed metric element '${part}'. Expected format 'KEY:VALUE'.`
        }
      };
    }

    if (seenKeys.has(key)) {
      return {
        ok: false,
        error: {
          title: "Duplicate Metric",
          message: `Duplicate metric key '${key}' encountered in vector string.`
        }
      };
    }
    seenKeys.add(key);

    const metricDef = baseMatrices.find(m => m.key === key);
    if (!metricDef) {
      // Metric not in base metrics (e.g. temporal or environmental)
      continue;
    }

    const validOption = metricDef.options.some(opt => opt.name === value);
    if (!validOption) {
      return {
        ok: false,
        error: {
          title: "Invalid Option Value",
          message: `Invalid value '${value}' for metric '${key}'.`
        }
      };
    }

    selections[key] = value;
  }

  const hasAllRequired = REQUIRED_BASE_METRIC_KEYS.every(k => Boolean(selections[k]));
  if (!hasAllRequired) {
    const missing = REQUIRED_BASE_METRIC_KEYS.filter(k => !selections[k]);
    return {
      ok: false,
      error: {
        title: "Incomplete Vector",
        message: `Missing required base metric(s): ${missing.join(', ')}.`
      }
    };
  }

  return {
    ok: true,
    version,
    selections
  };
}

/**
 * Backward-compatible helper that expands metric selections into human-readable data.
 */
export function giveFulldata(cvssObject: Record<string, string> | null | undefined) {
  if (!cvssObject) return null;

  const fullDataObject: Record<string, unknown> = {};
  Object.keys(cvssObject).forEach(element => {
    const metric = baseMatrices.find(m => m.key === element);
    if (metric) {
      const value = metric.options.find(opt => opt.name === cvssObject[element]);
      fullDataObject[element] = {
        name: metric,
        value: value ?? null
      };
    }
  });

  return fullDataObject;
}
