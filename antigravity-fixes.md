# Comprehensive Project Audit, Issues & Modernization Roadmap
**Project:** `react-semantic-cvss`  
**Author:** Rid Rupasinghe  
**Audited File:** Entire Repository (`package.json`, `src/`, `example/`, build configs, CI/CD)  
**Date:** September 2026  

---

## Executive Summary

`react-semantic-cvss` was originally created and published approximately 6 years ago (~2020) using tools standard at the time: `create-react-library` (`microbundle-crl`), React 16, `styled-components` v5, `semantic-ui-react` 0.88, Create React App (`react-scripts` 3), and Travis CI.

While the core domain logic (calculating CVSS 3.1 Base Scores) is valuable, the repository has fallen significantly behind modern JavaScript/TypeScript and React packaging standards. In its current state:
1. **It will fail to install or run** in modern React 18 and React 19 environments due to broken peer dependencies, React being bundled as a runtime dependency, and `react-scripts` being listed in production `dependencies`.
2. **Several fatal runtime bugs** exist in the component code (including calling `onChange` without checking if it exists, precedence bugs in string interpolation, and assigning prop types to `.prototype` instead of `.propTypes`).
3. **The build system and CI are obsolete** (`microbundle-crl` is dead, Travis CI is defunct, ESLint config uses deprecated plugins).
4. **Modern packaging standards are missing** (no `exports` map, no TypeScript declaration files `.d.ts`, no ESM/CJS dual-build compliant with Node/bundlers).
5. **FIRST has released CVSS v4.0** (late 2023), meaning the package is limited strictly to CVSS 3.1 Base metrics.

This document details **every issue identified across 7 categories**, explains why it causes problems today, and provides the **exact, production-ready modern fixes**.

---

## Table of Contents
1. [Critical Runtime Bugs & React Anti-Patterns](#1-critical-runtime-bugs--react-anti-patterns)
2. [Dependency & Peer Dependency Misconfigurations](#2-dependency--peer-dependency-misconfigurations)
3. [NPM Packaging, Module Standards & Export Maps](#3-npm-packaging-module-standards--export-maps)
4. [Build Tooling, Bundling & Dev Tooling Obsolescence](#4-build-tooling-bundling--dev-tooling-obsolescence)
5. [Component Architecture & Code Quality Issues](#5-component-architecture--code-quality-issues)
6. [Styling, CSS & UI Framework Dilemma](#6-styling-css--ui-framework-dilemma)
7. [CVSS Domain Standards & Calculation Flaws](#7-cvss-domain-standards--calculation-flaws)
8. [Testing, QA & CI/CD Gaps](#8-testing-qa--cicd-gaps)
9. [Example Project Architecture](#9-example-project-architecture)
10. [Production-Ready Implementation Blueprints (The Best Fixes)](#10-production-ready-implementation-blueprints-the-best-fixes)
11. [Step-by-Step Modernization Roadmap](#11-step-by-step-modernization-roadmap)

---

## 1. Critical Runtime Bugs & React Anti-Patterns

### Issue 1.1: `CVSSCalc.prototype` Typo Instead of `CVSSCalc.propTypes`
* **File:** `src/index.js` (Line 806)
* **Current Code:**
  ```javascript
  CVSSCalc.prototype = {
    title: PropTypes.string.isRequired,
    vector: PropTypes.string.isRequired,
    readOnly: PropTypes.bool.isRequired,
    isShowPopups: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired
  }
  ```
* **Impact:** 
  In JavaScript, assigning to `Component.prototype` does nothing for React prop validation; it mutates the function prototype. As a result, React's runtime prop-type verification has never executed.
  Furthermore, marking all props as `.isRequired` causes warnings if a user wants to render the calculator without a title, or with default state, or in read-only mode without an `onChange` handler.
* **Best Fix:**
  Migrate to TypeScript for compile-time safety and declare default props cleanly. If keeping PropTypes during transition:
  ```javascript
  CVSSCalc.propTypes = {
    title: PropTypes.string,
    vector: PropTypes.string,
    readOnly: PropTypes.bool,
    isShowPopups: PropTypes.bool,
    onChange: PropTypes.func
  };
  ```

---

### Issue 1.2: Unchecked `onChange` Call Crashes Component
* **File:** `src/index.js` (Line 177)
* **Current Code:**
  ```javascript
  await onChange({
    string: version + tmpCvssString,
    selections: cvssDataObject,
    score: score,
    ratingDetails: ratingObj
  });
  ```
* **Impact:**
  If a consumer renders `<CVSSCalc />` or `<CVSSCalc readOnly={true} />` without passing an `onChange` prop, any state calculation triggers an unhandled exception: `TypeError: onChange is not a function`, crashing the entire React render tree.
* **Best Fix:**
  Use optional chaining or provide a default noop function:
  ```javascript
  onChange?.({
    string: version + tmpCvssString,
    selections: cvssDataObject,
    score: Number(score),
    ratingDetails: ratingObj
  });
  ```

---

### Issue 1.3: Operator Precedence Bug in CVSS String Header
* **File:** `src/index.js` (Line 218)
* **Current Code:**
  ```javascript
  <Message
    compact
    header={'CVSS String : ' + cvssString ? cvssString : "-"}
  />
  ```
* **Impact:**
  Because the addition operator `+` has higher operator precedence than the ternary conditional `? :`, JavaScript evaluates this expression as:
  `(('CVSS String : ' + cvssString) ? cvssString : "-")`.
  Since `'CVSS String : ' + cvssString` is always a truthy non-empty string, the condition is always true, so the header only ever renders `cvssString`! The label `"CVSS String : "` is never displayed.
* **Best Fix:**
  ```javascript
  <Message
    compact
    header={cvssString ? `CVSS String: ${cvssString}` : "-"}
  />
  ```

---

### Issue 1.4: `await` with Synchronous React State Setters
* **File:** `src/index.js` (Lines 106-143, 172-176)
* **Current Code:**
  ```javascript
  await vectorStringArray.forEach(element => {
    switch (tmpElement[0]) {
      case 'AV': setAttackVector(tmpElement[1]); break;
      // ...
    }
  });
  await prepareCalculation();
  ```
  and:
  ```javascript
  await setCvssString(version + tmpCvssString);
  var score = calculate(cvssDataObject)
  await setCvssScore(score);
  var ratingObj = severityRating(score);
  await setCvssRating(ratingObj);
  ```
* **Impact:**
  `useState` dispatch functions (`setAttackVector`, `setCvssString`, etc.) return `void`, not Promises. Using `await` has no effect.
  Furthermore, calling 8 individual state setters inside `initData` and immediately calling `prepareCalculation()` reads **stale closure state** because React state updates are asynchronous (and batched in React 18+). The calculation runs with old or empty values.
* **Best Fix:**
  Manage metric selections as a single unified state object `metrics: Record<string, string>` or derive the score synchronously from the selections without storing redundant dependent state.

---

### Issue 1.5: Deprecated `Responsive` Component from `semantic-ui-react`
* **File:** `src/index.js` (Lines 4, 190, 194, 210, 237, etc.)
* **Current Code:**
  ```javascript
  import { Responsive } from "semantic-ui-react";
  // ...
  <Responsive fireOnMount onUpdate={() => handleScreenResize()} />
  // ...
  disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
  ```
* **Impact:**
  `Responsive` was deprecated in Semantic UI React v0.87.0 and completely removed in newer releases due to performance degradation, window resize listener memory leaks, and incompatibility with Server-Side Rendering (SSR) / Next.js. This component throws console deprecation warnings or fatal errors on modern Semantic UI React versions.
* **Best Fix:**
  Use pure CSS media queries in styled-components/CSS, or use standard React hooks (e.g. `window.matchMedia` via a clean `useMediaQuery` hook) with zero dependency on `Responsive`.

---

### Issue 1.6: Immediate Premature Error Display on Initial Mount
* **File:** `src/index.js` (Lines 792-794)
* **Current Code:**
  ```javascript
  {!readOnly && !noNull && <FormInlineHelp>
    <p className="error">{"*Every option must be selected to calculate \"CVSS Score\""}</p>
  </FormInlineHelp>}
  ```
* **Impact:**
  When a user opens the calculator from scratch (without a pre-filled vector), the component immediately displays a bright red error message before the user has touched a single control. This violates standard UX and accessibility best practices (validation errors should be shown on blur or submission, or displayed as helper text rather than an active error state).
* **Best Fix:**
  Change this from a red error state into neutral guidance helper text or only trigger the warning if the user attempts to export/submit an incomplete vector.

---

### Issue 1.7: Fragile Catch Block Returning Raw Error Objects
* **File:** `src/functions.js` (Lines 55-57)
* **Current Code:**
  ```javascript
  try {
    // ...
    return baseScore.toFixed(1);
  } catch (err) {
    return err;
  }
  ```
* **Impact:**
  Returning the raw `err` instance means `score` becomes an `Error` object. In `index.js`, `<Statistic.Value>{cvssScore}</Statistic.Value>` will try to render this object as a React child, which causes a fatal React runtime error: `Objects are not valid as a React child (found: Error: ...)`.
* **Best Fix:**
  Never return raw Error objects to UI renderers. Return `null` on failure, or throw an explicit descriptive error for programmatic consumers, with safe UI fallback handling.

---

## 2. Dependency & Peer Dependency Misconfigurations

### Issue 2.1: `react`, `react-dom`, and `react-scripts` in `dependencies`
* **File:** `package.json`
* **Current Code:**
  ```json
  "dependencies": {
    "prop-types": "^15.7.2",
    "react": "^16.13.1",
    "react-dom": "^16.13.1",
    "react-scripts": "3.4.1",
    "semantic-ui-css": "^2.4.1",
    "semantic-ui-react": "^0.88.2",
    "styled-components": "^5.1.0"
  }
  ```
* **Impact:**
  1. **Dual React Instance Crash:** Having `react` and `react-dom` in `dependencies` forces npm/yarn to install a separate copy of React in the consumer project. When hooks are called, React throws the infamous `"Invalid hook call: Hooks can only be called inside the body of a function component"`.
  2. **Massive Bloat from `react-scripts`:** `react-scripts` is Create React App's build harness (~200MB of webpack, babel, and jest dependencies). Putting it in production `dependencies` forces every user installing `react-semantic-cvss` to download hundreds of megabytes of dead build tools!
* **Best Fix:**
  Move `react` and `react-dom` to `peerDependencies` and `devDependencies`. Remove `react-scripts` completely from `dependencies`.

---

### Issue 2.2: Rigid Peer Dependency Bound to React 16 Only
* **File:** `package.json`
* **Current Code:**
  ```json
  "peerDependencies": {
    "react": "^16.0.0"
  }
  ```
* **Impact:**
  Modern npm (npm 7+) strictly checks peer dependencies by default. If a consumer installs this library in a React 18 or React 19 project, npm throws:
  `npm ERR! ERESOLVE unable to resolve dependency tree`
  `npm ERR! Found: react@18.3.1 / react@19.0.0`
  `npm ERR! Could not resolve dependency: peer react@"^16.0.0"`
  This completely blocks modern installations unless the user passes `--legacy-peer-deps`.
* **Best Fix:**
  ```json
  "peerDependencies": {
    "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0",
    "react-dom": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
  }
  ```

---

### Issue 2.3: `styled-components` in `dependencies`
* **File:** `package.json`
* **Impact:**
  When `styled-components` is listed as a regular dependency, multiple versions can be installed if the host app also uses styled-components. This breaks ThemeContext and causes stylesheet duplication or SSR hydration mismatches.
* **Best Fix:**
  Either move `styled-components` to `peerDependencies` (with `peerDependenciesMeta` marked optional) or compile styles to zero-runtime CSS (Vanilla CSS / CSS Modules).

---

## 3. NPM Packaging, Module Standards & Export Maps

### Issue 3.1: Missing Modern `exports` Map in `package.json`
* **File:** `package.json`
* **Current Code:**
  ```json
  "main": "dist/index.js",
  "module": "dist/index.modern.js",
  "source": "src/index.js"
  ```
* **Impact:**
  Modern Node.js (v16+) and bundlers (Vite, Next.js App Router, Webpack 5, esbuild) use the package `exports` field for conditional exports. The current structure has no `exports` map, uses a non-standard `index.modern.js` from CRL, and lacks ESM/CJS compatibility flags.
* **Best Fix:**
  ```json
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./package.json": "./package.json"
  }
  ```

---

### Issue 3.2: No TypeScript Type Definitions (`.d.ts`) Generated
* **File:** `package.json`, `tsconfig.json`
* **Impact:**
  TypeScript users who run `import CVSSCalc from 'react-semantic-cvss'` receive:
  `Could not find a declaration file for module 'react-semantic-cvss'. Implicitly has an 'any' type.`
  Even though `tsconfig.json` was in the root, the source code was plain JS and no declaration files were emitted to `dist/`.
* **Best Fix:**
  Migrate source files to TypeScript (`.ts` / `.tsx`) and configure `tsup` with `dts: true` to emit clean, fully-typed definitions.

---

### Issue 3.3: Missing `sideEffects` Field
* **File:** `package.json`
* **Impact:**
  Without `"sideEffects": false` (or explicitly flagging CSS files), modern bundlers cannot tree-shake unused exports when consumers import utility functions.
* **Best Fix:**
  Add `"sideEffects": ["*.css"]` (or `"sideEffects": false` if no global CSS is imported).

---

### Issue 3.4: Deprecated `prepublish` Script Behavior
* **File:** `package.json` (Line 17)
* **Current Code:**
  ```json
  "prepublish": "run-s build"
  ```
* **Impact:**
  In npm, `prepublish` runs before `npm publish`, but it **also runs on every local `npm install`** when cloning the repo. This slows down development and can fail before dependencies are ready.
* **Best Fix:**
  Use `"prepack": "npm run build"` or `"prepublishOnly": "npm run build"`.

---

### Issue 3.5: Obsolete Node Engine Requirement
* **File:** `package.json` (Line 11-13)
* **Current Code:**
  ```json
  "engines": {
    "node": ">=10"
  }
  ```
* **Impact:**
  Node 10 reached End of Life (EOL) in April 2021. Current Active LTS versions are Node 20 and Node 22 (with Node 18 still widely used).
* **Best Fix:**
  Update to `"node": ">=18.0.0"`.

---

## 4. Build Tooling, Bundling & Dev Tooling Obsolescence

### Issue 4.1: Abandoned `microbundle-crl` Bundler
* **File:** `package.json` (Lines 15, 16, 43)
* **Current Code:**
  `"build": "microbundle-crl --no-compress --format modern,cjs"`
* **Impact:**
  `microbundle-crl` was a temporary fork maintained for `create-react-library` (CRL). Both CRL and `microbundle-crl` have been abandoned since 2020. It depends on ancient Rollup and Babel plugins that fail with Node 18+ syntax and modern JSX transforms.
* **Best Fix:**
  Replace `microbundle-crl` with **`tsup`** (esbuild-based, blazing fast, outputs ESM + CJS + `.d.ts` in milliseconds).

---

### Issue 4.2: Broken ESLint 6 and Prettier 2 Setup
* **File:** `.eslintrc`, `package.json`
* **Current Code:**
  Extends `prettier/standard`, `prettier/react`, `babel-eslint`.
* **Impact:**
  `prettier/standard` and `prettier/react` were deleted from `eslint-config-prettier` in version 8.0.0 (2021). `babel-eslint` was deprecated in 2020 in favor of `@babel/eslint-parser`. Running `npm run test:lint` fails immediately on modern tooling.
* **Best Fix:**
  Adopt modern ESLint 9 flat configuration (`eslint.config.mjs`) with `@typescript-eslint` and `eslint-plugin-react-hooks`, or use **Biome** for lightning-fast unified linting and formatting.

---

### Issue 4.3: Defunct Travis CI Configuration
* **File:** `.travis.yml`
* **Impact:**
  Travis CI shut down its free open-source build service years ago. The configuration tests on Node 10 and 12, both long dead.
* **Best Fix:**
  Delete `.travis.yml` and add a modern GitHub Actions workflow (`.github/workflows/ci.yml`) testing on Node 18, 20, and 22.

---

## 5. Component Architecture & Code Quality Issues

### Issue 5.1: 550 Lines of Unnecessary JSX Duplication (DRY Violation)
* **File:** `src/index.js` (Lines 231–789)
* **Impact:**
  The component is 814 lines long because the exact same pattern:
  `<CVSSItem> -> <Popup> -> <ButtonGroupLabel> -> <Button.Group> -> <Popup> -> <Button>`
  is copy-pasted 8 times for every metric (Attack Vector, Attack Complexity, Privileges Required, User Interaction, Scope, Confidentiality, Integrity, Availability). Attack Vector is even copy-pasted twice (once for mobile, once for desktop).
* **Best Fix:**
  Drive the UI dynamically using `baseMatrices` array mapping:
  ```tsx
  {baseMatrices.map((metric) => (
    <CVSSMetricRow
      key={metric.key}
      metric={metric}
      selected={selectedMetrics[metric.key]}
      onSelect={(val) => handleSelect(metric.key, val)}
      readOnly={readOnly}
      showPopups={isShowPopups}
    />
  ))}
  ```
  This reduces the entire component from **814 lines down to ~120 lines**, eliminating duplicate bugs and making maintenance effortless.

---

### Issue 5.2: Missing Headless / Utility Exports
* **File:** `src/index.js`, `src/functions.js`
* **Impact:**
  The package currently only exports `CVSSCalc` as default. Consumers who want to:
  - Calculate a score programmatically (`calculate(metrics)`)
  - Parse a CVSS string (`CVSS:3.1/AV:N/...`)
  - Determine severity rating without rendering the UI
  cannot do so without mounting a React component!
* **Best Fix:**
  Export both the React component and pure utility functions:
  ```typescript
  export { CVSSCalc } from './components/CVSSCalc';
  export { calculateCVSS31, parseCVSS31Vector, getSeverityRating } from './utils/cvss';
  export type { CVSS31Metrics, CVSSResult, CVSSCalcProps } from './types';
  ```

---

### Issue 5.3: HTML Injected via `dangerouslySetInnerHTML`
* **File:** `src/index.js` (Lines 241, 258, 274, 290, 306, etc.)
* **Current Code:**
  `<div dangerouslySetInnerHTML={{ __html: popupData['AV']['N'] }} />`
* **Impact:**
  While the data is currently hardcoded in `data.js`, using `dangerouslySetInnerHTML` is unnecessary, poses security risks if descriptions ever become dynamic, and interferes with React's virtual DOM reconciliation.
* **Best Fix:**
  Store descriptions as plain text or structured elements (`{ title: "Worst:", description: "..." }`) and render standard React typography.

---

## 6. Styling, CSS & UI Framework Dilemma

### Issue 6.1: Global CSS Pollution via `semantic-ui-css`
* **File:** `src/index.js` (Line 11)
* **Current Code:**
  `import "semantic-ui-css/semantic.min.css";`
* **Impact:**
  When a consumer installs `react-semantic-cvss` and imports the component, it executes this import. `semantic.min.css` is a 1.5MB global CSS stylesheet that resets standard HTML elements (it changes `body`, sets global `font-family`, overrides `h1-h6`, alters button styling and table styles). This will destructively alter the design of the consumer's entire application!
* **Best Fix:**
  Do **not** import full global `semantic-ui-css` unconditionally in the JS entrypoint. Instead:
  1. Scope all component CSS under a dedicated class prefix (e.g. `.cvss-calc-root`), OR
  2. Provide a separate stylesheet export (`import 'react-semantic-cvss/dist/style.css'`) so consumers control style inclusion, OR
  3. Decouple into a standalone CSS Modules / modern Tailwind-compatible styling solution while preserving the Semantic UI visual look.

---

### Issue 6.2: Status of `semantic-ui-react` in Modern React (React 18 & 19)
* **Impact:**
  `semantic-ui-react` has had almost no updates for years. Many of its internal components rely on `findDOMNode` (which is deprecated in React 18 and **completely removed in React 19**). Using Semantic UI React directly will produce warnings in React 18 and crash in React 19.
* **Best Fix Options:**
  - **Option A (Recommended for 100% Backward Compatibility):** Retain Semantic UI visual aesthetic, but replace heavy internal Semantic UI dependencies with clean, modern, zero-dependency lightweight components (buttons, badges, popups) styled to look identical to Semantic UI.
  - **Option B:** If continuing to wrap `semantic-ui-react`, update to `semantic-ui-react@^2.1.5` and test thoroughly against React 18/19 strict mode.

---

### Issue 6.3: styled-components Hex Concatenation Hack
* **File:** `src/style.js` (Line 27)
* **Current Code:**
  `background: ${props => props.color + 25} !important;`
* **Impact:**
  Concatenating `"25"` to a color string relies on 8-character hex codes (`#RRGGBBAA`). If `props.color` is rgb, hsl, or a 3-digit hex (e.g. `#fff`), this produces invalid CSS like `#fff25` or `rgb(...)25`, resulting in a transparent or broken background.
* **Best Fix:**
  Use standard CSS `color-mix` or an explicit hex-to-rgba converter:
  ```typescript
  background: colorMixWithAlpha(color, 0.15);
  ```

---

## 7. CVSS Domain Standards & Calculation Flaws

### Issue 7.1: Strict Check Fails on Valid Vector Formats
* **File:** `src/index.js` (Lines 87-97)
* **Current Code:**
  ```javascript
  let vectorStringArray = vector.split("/");
  let version = vectorStringArray.shift();
  let versoinNumber = version.split(":");
  if (versoinNumber[1] !== "3.1") { ... }
  ```
* **Impact:**
  - If a vector has trailing slashes, leading whitespace, or metrics in a different order (e.g., `CVSS:3.1/S:U/AV:N/...`), the parser fails.
  - Typo in variable name `versoinNumber`.
  - Does not support CVSS 3.0 (which uses the exact same Base metrics formula as 3.1).
* **Best Fix:**
  Implement a robust regex parser that extracts metrics regardless of key ordering:
  ```typescript
  export function parseVector(vector: string) {
    const match = vector.match(/^CVSS:(3\.[01])\/(.+)$/);
    if (!match) throw new Error("Invalid CVSS vector prefix");
    // Parse key-value pairs cleanly
  }
  ```

---

### Issue 7.2: Industry Shift to CVSS v4.0 (November 2023)
* **Context:**
  The Forum of Incident Response and Security Teams (FIRST) officially released **CVSS v4.0** in late 2023. CVSS v4.0 introduces:
  - New nomenclature: CVSS-B (Base), CVSS-BT (Base + Threat), CVSS-BE (Base + Environmental), CVSS-BTE (Base + Threat + Environmental).
  - New Base metrics: Attack Requirements (AT), User Interaction (None, Passive, Active), Subsequent System impact metrics.
* **Best Fix:**
  While maintaining CVSS v3.1 support as default, architect the data models and calculation engine so CVSS v4.0 can be supported via a `version="4.0"` prop.

---

## 8. Testing, QA & CI/CD Gaps

### Issue 8.1: Complete Lack of Automated Test Suites
* **Current State:**
  - `package.json` had `"test:unit": "cross-env CI=1 react-scripts test --env=jsdom"`.
  - There are **zero test files** in `src/`.
  - The calculation algorithm, vector string parser, and component render cycles have no test coverage.
* **Best Fix:**
  Add **Vitest** (or Jest) with `@testing-library/react`. Write unit tests validating CVSS calculations against official FIRST CVSS 3.1 test examples.

---

## 9. Example Project Architecture

### Issue 9.1: Create React App with Broken Parent Symlinks
* **File:** `example/package.json`
* **Current Code:**
  ```json
  "dependencies": {
    "react": "file:../node_modules/react",
    "react-dom": "file:../node_modules/react-dom",
    "react-scripts": "file:../node_modules/react-scripts",
    "react-semantic-cvss": "file:.."
  }
  ```
* **Impact:**
  - Create React App is officially deprecated by React.
  - The `file:../node_modules/...` relative symlink hack breaks in npm 7+, pnpm, and modern yarn.
  - `debug.log` was committed into git.
* **Best Fix:**
  Convert `example/` into a fast, clean **Vite + React 18/19** app using standard workspace protocol (`workspace:*`) or standard file linking.

---

## 10. Production-Ready Implementation Blueprints (The Best Fixes)

### 10.1: Modern `package.json` (Target State)
```json
{
  "name": "react-semantic-cvss",
  "version": "2.0.0",
  "description": "Interactive CVSS calculator and parser for React apps",
  "author": "RidRupasinghe",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/RidRupasinghe/react-semantic-cvss.git"
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "dev": "tsup --watch",
    "build": "tsup",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src/ --ext .ts,.tsx",
    "prepublishOnly": "npm run typecheck && npm run test && npm run build"
  },
  "peerDependencies": {
    "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0",
    "react-dom": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
  },
  "peerDependenciesMeta": {
    "react-dom": {
      "optional": true
    }
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^9.0.0",
    "jsdom": "^24.0.0",
    "prettier": "^3.3.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tsup": "^8.0.0",
    "typescript": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
```

---

### 10.2: Modern `tsup.config.ts` (Zero-Config Fast Bundling)
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  external: ['react', 'react-dom'],
  banner: {
    js: '"use client";', // Next.js App Router compatibility
  },
});
```

---

### 10.3: TypeScript Definitions Blueprint (`src/types.ts`)
```typescript
export type CVSSMetricKey = 'AV' | 'AC' | 'PR' | 'UI' | 'S' | 'C' | 'I' | 'A';

export interface CVSSOption {
  value: string;
  label: string;
  description: string;
}

export interface CVSSMetricDefinition {
  key: CVSSMetricKey;
  name: string;
  help: string;
  options: CVSSOption[];
}

export type CVSSSelections = Partial<Record<CVSSMetricKey, string>>;

export interface CVSSSeverityRating {
  name: 'None' | 'Low' | 'Medium' | 'High' | 'Critical' | '?';
  color: string;
  bottom: number | string;
  top: number | string;
}

export interface CVSSCalculationResult {
  score: number | null;
  scoreString: string;
  vector: string;
  rating: CVSSSeverityRating;
  isComplete: boolean;
  selections: CVSSSelections;
}

export interface CVSSCalcProps {
  title?: string;
  vector?: string;
  readOnly?: boolean;
  isShowPopups?: boolean;
  onChange?: (result: CVSSCalculationResult) => void;
  className?: string;
}
```

---

### 10.4: Official CVSS 3.1 Calculation Utility (`src/utils/cvss31.ts`)
```typescript
import { CVSSSelections, CVSSCalculationResult, CVSSSeverityRating } from '../types';

const WEIGHTS = {
  AV: { N: 0.85, A: 0.62, L: 0.55, P: 0.2 },
  AC: { L: 0.77, H: 0.44 },
  PR: {
    U: { N: 0.85, L: 0.62, H: 0.27 },
    C: { N: 0.85, L: 0.68, H: 0.50 }
  },
  UI: { N: 0.85, R: 0.62 },
  S:  { U: 6.42, C: 7.52 },
  C:  { N: 0, L: 0.22, H: 0.56 },
  I:  { N: 0, L: 0.22, H: 0.56 },
  A:  { N: 0, L: 0.22, H: 0.56 }
};

const RATINGS: CVSSSeverityRating[] = [
  { name: 'None', bottom: 0.0, top: 0.0, color: '#21ba45' },
  { name: 'Low', bottom: 0.1, top: 3.9, color: '#b5cc18' },
  { name: 'Medium', bottom: 4.0, top: 6.9, color: '#fbbd08' },
  { name: 'High', bottom: 7.0, top: 8.9, color: '#f2711c' },
  { name: 'Critical', bottom: 9.0, top: 10.0, color: '#db2828' }
];

export function roundup(input: number): number {
  const intInput = Math.round(input * 100000);
  if (intInput % 10000 === 0) {
    return intInput / 100000;
  }
  return (Math.floor(intInput / 10000) + 1) / 10;
}

export function getSeverityRating(score: number | null): CVSSSeverityRating {
  if (score === null || isNaN(score)) {
    return { name: '?', bottom: 'Not', top: 'defined', color: '#767676' };
  }
  return RATINGS.find(r => score >= (r.bottom as number) && score <= (r.top as number)) 
    ?? { name: '?', bottom: 'Not', top: 'defined', color: '#767676' };
}

export function calculateCVSS31(selections: CVSSSelections): CVSSCalculationResult {
  const requiredKeys = ['AV', 'AC', 'PR', 'UI', 'S', 'C', 'I', 'A'] as const;
  const isComplete = requiredKeys.every(k => Boolean(selections[k]));

  const vector = isComplete
    ? `CVSS:3.1/AV:${selections.AV}/AC:${selections.AC}/PR:${selections.PR}/UI:${selections.UI}/S:${selections.S}/C:${selections.C}/I:${selections.I}/A:${selections.A}`
    : '';

  if (!isComplete) {
    return {
      score: null,
      scoreString: '-',
      vector,
      rating: getSeverityRating(null),
      isComplete: false,
      selections
    };
  }

  const s = selections.S as 'U' | 'C';
  const prWeight = WEIGHTS.PR[s][selections.PR as 'N' | 'L' | 'H'];
  const w = {
    AV: WEIGHTS.AV[selections.AV as keyof typeof WEIGHTS.AV],
    AC: WEIGHTS.AC[selections.AC as keyof typeof WEIGHTS.AC],
    PR: prWeight,
    UI: WEIGHTS.UI[selections.UI as keyof typeof WEIGHTS.UI],
    S:  WEIGHTS.S[s],
    C:  WEIGHTS.C[selections.C as keyof typeof WEIGHTS.C],
    I:  WEIGHTS.I[selections.I as keyof typeof WEIGHTS.I],
    A:  WEIGHTS.A[selections.A as keyof typeof WEIGHTS.A]
  };

  const iss = 1 - ((1 - w.C) * (1 - w.I) * (1 - w.A));
  let impact: number;
  if (s === 'U') {
    impact = w.S * iss;
  } else {
    impact = w.S * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);
  }

  const exploitability = 8.22 * w.AV * w.AC * w.PR * w.UI;

  let baseScore: number;
  if (impact <= 0) {
    baseScore = 0.0;
  } else if (s === 'U') {
    baseScore = roundup(Math.min(exploitability + impact, 10));
  } else {
    baseScore = roundup(Math.min((exploitability + impact) * 1.08, 10));
  }

  return {
    score: baseScore,
    scoreString: baseScore.toFixed(1),
    vector,
    rating: getSeverityRating(baseScore),
    isComplete: true,
    selections
  };
}
```

---

### 10.5: Automated Test Suite (`tests/cvss.test.ts`)
```typescript
import { describe, it, expect } from 'vitest';
import { calculateCVSS31 } from '../src/utils/cvss31';

describe('CVSS v3.1 Calculation Tests', () => {
  it('calculates Critical vulnerability correctly (CVE-2021-44228 Log4Shell)', () => {
    // CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H -> 10.0 Critical
    const result = calculateCVSS31({
      AV: 'N', AC: 'L', PR: 'N', UI: 'N', S: 'C', C: 'H', I: 'H', A: 'H'
    });
    expect(result.scoreString).toBe('10.0');
    expect(result.rating.name).toBe('Critical');
  });

  it('calculates Medium vulnerability correctly', () => {
    // CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:N/A:L -> 5.9 Medium
    const result = calculateCVSS31({
      AV: 'N', AC: 'H', PR: 'N', UI: 'R', S: 'U', C: 'H', I: 'N', A: 'L'
    });
    expect(result.scoreString).toBe('5.9');
    expect(result.rating.name).toBe('Medium');
  });

  it('returns incomplete status when not all metrics are selected', () => {
    const result = calculateCVSS31({ AV: 'N', AC: 'L' });
    expect(result.isComplete).toBe(false);
    expect(result.score).toBeNull();
    expect(result.scoreString).toBe('-');
  });
});
```

---

### 10.6: GitHub Actions Workflow (`.github/workflows/ci.yml`)
```yaml
name: CI & Quality Checks

on:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]

    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

---

## 11. Step-by-Step Modernization Roadmap

### Phase 1: Package & Dependency Cleanup (Day 1)
1. Remove `react-scripts`, `react`, and `react-dom` from `dependencies`.
2. Add `react` and `react-dom` to `peerDependencies` (`^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0`).
3. Delete `.travis.yml` and replace with `.github/workflows/ci.yml`.
4. Delete `example/debug.log` and add it to `.gitignore`.

### Phase 2: Modern Bundler & TypeScript Migration (Day 2)
1. Install `tsup`, `typescript`, `vitest`, and `@types/react`.
2. Configure `tsup.config.ts` for dual ESM/CJS and `.d.ts` declaration generation.
3. Update `package.json` with proper modern `"exports"` map, `"main"`, `"module"`, and `"types"`.
4. Migrate `src/` to TypeScript (`.ts` and `.tsx`).

### Phase 3: Core Logic & Component Refactoring (Day 3)
1. Extract pure CVSS calculation, parsing, and rating logic into `src/utils/cvss31.ts`.
2. Export standalone utility functions (`calculateCVSS31`, `parseVector`, `getSeverityRating`) alongside the React component.
3. Refactor `CVSSCalc` into a clean, DRY component mapping over `baseMatrices`.
4. Fix all runtime bugs:
   - Add optional chaining to `onChange?.()`.
   - Fix operator precedence in header string.
   - Remove deprecated `Responsive` component.
   - Fix `CVSSCalc.prototype` typo.

### Phase 4: Testing & Example App Upgrade (Day 4)
1. Set up Vitest and write unit tests covering FIRST CVSS test vectors.
2. Upgrade `example/` from deprecated Create React App to Vite + React 18/19.
3. Verify local linking and dev server functionality.

### Phase 5: Publishing & Release (Day 5)
1. Bump version to `2.0.0` (major version bump due to dependency restructuring and modern export standards).
2. Set up GitHub Actions for automated npm publishing with provenance:
   `npm publish --provenance --access public`.
3. Update `README.md` with new TypeScript usage examples, named exports, and badges.
