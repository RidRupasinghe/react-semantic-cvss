# react-semantic-cvss

> Interactive CVSS v3.1 base score calculator, vector parser, and rating visualizer for React applications.

[![NPM Version](https://img.shields.io/npm/v/react-semantic-cvss.svg)](https://www.npmjs.com/package/react-semantic-cvss)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/RidRupasinghe/react-semantic-cvss/actions/workflows/ci.yml/badge.svg)](https://github.com/RidRupasinghe/react-semantic-cvss/actions)

---

## Features

- 🛡️ **FIRST CVSS v3.1 Spec-Compliant**: Exact implementation of the official CVSS v3.1 specification, scoring equations, and `Roundup` algorithm.
- ⚛️ **Modern React Support**: Fully compatible with React 16.8+, React 17, React 18, and React 19 (including Next.js App Router `"use client"`).
- 📦 **Dual ESM & CommonJS**: Ships with zero-overhead modern ES modules (`.mjs`) and CommonJS (`.cjs`) with rigorous export maps.
- 📘 **TypeScript-First**: Complete type declarations (`.d.ts` and `.d.mts`) with 100% type coverage and strict types.
- 🧩 **Headless Utilities**: Export pure calculation, vector parsing, and rating functions without needing to mount the React UI.
- ♿ **Accessible**: ARIA radio group semantics (`role="radiogroup"`, `role="radio"`), keyboard navigation, and live screen reader regions.

---

## Installation

```bash
npm install react-semantic-cvss semantic-ui-react styled-components
# or
yarn add react-semantic-cvss semantic-ui-react styled-components
# or
pnpm add react-semantic-cvss semantic-ui-react styled-components
```

### Styling Setup
To apply the Semantic UI styling, import the stylesheet into your application's entrypoint (e.g., `index.js`, `App.tsx`, or `main.jsx`):

```javascript
import 'semantic-ui-css/semantic.min.css';
```

---

## Usage

### 1. Interactive UI Component

```tsx
import React, { useState } from 'react';
import CVSSCalc, { CVSSCalculationResult } from 'react-semantic-cvss';
import 'semantic-ui-css/semantic.min.css';

const App = () => {
  const [vector, setVector] = useState("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H");

  const handleChange = (result: CVSSCalculationResult) => {
    console.log("Vector:", result.string);
    console.log("Numeric Score:", result.score);         // e.g. 10.0
    console.log("Score String:", result.scoreString);   // e.g. "10.0"
    console.log("Severity:", result.ratingDetails.name); // "Critical"
    setVector(result.string);
  };

  return (
    <CVSSCalc
      title="Common Vulnerability Scoring System (v3.1)"
      vector={vector}
      readOnly={false}
      isShowPopups={true}
      onChange={handleChange}
    />
  );
};

export default App;
```

---

### 2. Headless Domain Functions (No React UI required)

You can use the scoring and parsing engine in backend services, CLI tools, or custom UIs:

```typescript
import {
  calculateCVSS31,
  parseCVSS31Vector,
  getSeverityRating,
  roundup
} from 'react-semantic-cvss';

// 1. Calculate score from selections
const result = calculateCVSS31({
  AV: 'N', AC: 'L', PR: 'N', UI: 'N',
  S: 'C', C: 'H', I: 'H', A: 'H'
});

console.log(result.score);       // 10.0
console.log(result.ratingDetails.name); // "Critical"
console.log(result.string);      // "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H"

// 2. Parse & validate a vector string
const parsed = parseCVSS31Vector("CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:N/A:L");
if (parsed.ok) {
  console.log(parsed.selections); // { AV: "N", AC: "H", ... }
} else {
  console.error(parsed.error?.title, parsed.error?.message);
}

// 3. Get severity rating for a numeric score
const rating = getSeverityRating(7.5);
console.log(rating.name);  // "High"
console.log(rating.color); // "#f2711c"
```

---

## Component Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `title` | `string` | `"Common Vulnerability Scoring System"` | Title displayed above the score badge. Pass `""` to hide. |
| `vector` | `string` | `""` | Initial or controlled CVSS v3.1 vector string. |
| `readOnly` | `boolean` | `false` | When true, renders buttons as non-interactive display only. |
| `isShowPopups` | `boolean` | `true` | Enables/disables helpful explanation popups on hover & focus. |
| `onChange` | `(output: CVSSCalculationResult) => void` | `undefined` | Callback fired whenever metric selections change. |
| `className` | `string` | `undefined` | Optional CSS class name for the wrapper form. |

### `CVSSCalculationResult` Output Shape

```typescript
interface CVSSCalculationResult {
  score: number | null;                // Numeric float (e.g. 8.1) or null if incomplete
  scoreString: string;                 // Formatted string (e.g. "8.1" or "-")
  string: string;                      // Full CVSS:3.1/... vector string
  selections: Record<string, string>;  // Selected metrics key-value map
  ratingDetails: {
    name: 'None' | 'Low' | 'Medium' | 'High' | 'Critical' | '?';
    bottom: number | string;
    top: number | string;
    color: string;
  };
  isComplete: boolean;                 // true if all 8 base metrics are selected
}
```

---

## Migrating from v1.x to v2.x

1. **Peer Dependencies**: `react` and `react-dom` are now peer dependencies. Ensure they are installed in your host app (`>=16.8.0`).
2. **CSS Import**: `react-semantic-cvss` no longer pollutes your global application CSS automatically. Add `import 'semantic-ui-css/semantic.min.css';` to your app entrypoint if you haven't already.
3. **Controlled Component Stability**: If you pass `vector={output.string}` in a controlled loop, v2.0 safely ignores equality updates instead of clearing your state.
4. **Numeric Score**: `result.score` now returns a real `number` float (e.g. `7.5`), while `result.scoreString` provides the formatted string `"7.5"`.
5. **Named Imports**: Both `import CVSSCalc from 'react-semantic-cvss'` and `import { CVSSCalc, calculateCVSS31 } from 'react-semantic-cvss'` are supported.

---

## Development & Testing

```bash
# Install dependencies
npm install

# Run automated tests (Vitest)
npm test

# Run TypeScript typecheck
npm run typecheck

# Build bundle (tsup)
npm run build

# Start demo app (Vite)
cd example && npm install && npm run dev
```

---

## License

[MIT](LICENSE) © [Rid Rupasinghe](https://github.com/RidRupasinghe)
