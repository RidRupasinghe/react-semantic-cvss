# claud-fixes — audit of `react-semantic-cvss` (v1.0.12)

Audit date: 2026-09-18. Scope: the whole repo (`src/`, `package.json`, tooling, `example/`, README).
Each issue has a severity, evidence (file/line), and the recommended fix. Issues are ordered by priority.

Severity: **P0** = broken or blocking for users, **P1** = should fix in the modernisation release, **P2** = quality / nice to have.

---

## 1. Correctness bugs (in the component itself)

### 1.1 [P0] Wrong prop-types declaration: `CVSSCalc.prototype` instead of `propTypes`
`src/index.js:~805`
```js
CVSSCalc.prototype = { title: ..., vector: ..., ... }
```
`prototype` is not `propTypes`, so **no prop validation has ever run**. It also overwrites the function's prototype. In addition, every prop is marked `isRequired`, although the README and code treat `vector`, `readOnly` and `isShowPopups` as optional.
**Fix:** use `CVSSCalc.propTypes = {...}` (or TypeScript types, see §3.1). Make `vector`, `readOnly`, `isShowPopups` optional and give them defaults (`vector: ''`, `readOnly: false`, `isShowPopups: false`, `title` optional). `onChange` optional with a no-op default.

### 1.2 [P0] Header shows `"false"`-style text: operator-precedence bug
`src/index.js:~186`
```js
header={'CVSS String : ' + cvssString ? cvssString : "-"}
```
`+` binds tighter than `?:`, so this evaluates `('CVSS String : ' + cvssString) ? cvssString : "-"`. The label "CVSS String :" is never shown on desktop and only the raw string is displayed.
**Fix:** `header={`CVSS String : ${cvssString ?? '-'}`}`.

### 1.3 [P0] Vector parsing is incomplete and inconsistent
`initData` (`src/index.js:~62-146`)
- Only accepts version `3.1`; the header text in the README/description says CVSS generally. CVSS `3.0` vectors (same metrics, slightly different round-up) are rejected. Decide: support 3.0 + 3.1 (recommended; only `roundUp` differs) or state 3.1-only in the README.
- Metric values are **not validated** against allowed options. `AV:Z` is accepted, stored, and `calculate` then reads `weight.AV.Z` → `undefined` → `NaN` score. `calculate` swallows the error via `try/catch` and **returns the Error object as the score** (`return err`).
- Duplicate or missing keys pass the "length === 8" check (e.g. `AV:N/AV:N/...`).
- `invalidStringError()` is called once per bad element and, when the vector is bad, the previous good selections stay on screen.
- `isErrorOccured` / `errorMsg` are never reset when a valid vector is later passed, so the error message sticks. Also `errorMsg` is initialised as `""` but later set to an object.
- Uses `await` on `forEach` / setState (no effect; setState is synchronous and returns `undefined`).
**Fix:** move parsing into a pure function `parseVector(str) → { ok, selections } | { ok:false, error }` in `functions.js` that validates version, key set (exactly the 8 base metrics, no duplicates) and each value against `baseMatrices`. Use it for both validation and state init; clear the error state on every new `vector`. Unit-test it.

### 1.4 [P0] `calculate()` returns an `Error` on failure, and `score` is a *string*
`src/functions.js` — `return baseScore.toFixed(1)` and `catch (err) { return err }`.
- Consumers get a string `"7.5"` in `onChange({score})` (undocumented), or an `Error` object.
- `severityRating(score)` compares a string with numbers (`"7.5" >= 7`) and only works through implicit coercion.
- A `NaN` score gives the "?" rating with `bottom: 'Not'`, `top: 'defined'` (strings placed in numeric fields).
**Fix:** return a `number` (rounded to 1 dp), throw / return `null` on invalid input, and let callers format with `toFixed(1)`. Fix the fallback rating object (`{ name: 'Unknown', bottom: null, top: null }`). This is a **breaking change** → major version bump (see §5).

### 1.5 [P1] `onChange` fires on every mount and re-render path
`prepareCalculation` runs in a `useEffect` on the 8 selection states *and* is also called directly from `initData`, so it runs twice for the same vector; `onChange` is invoked as a side effect of the *prop* `vector` changing (not only on user input). With a controlled parent that stores the output and feeds it back as `vector`, this can loop.
**Fix:** derive score/rating/string with `useMemo` from the selections (no state for them), and call `onChange` only from the user-click handler (or only when the computed string actually differs from the incoming `vector`).

### 1.6 [P1] Too much redundant state
14 `useState` calls, several derived (`cvssString`, `cvssScore`, `cvssRating`, `noNull`, `width`). The derived values go stale and cause the double-calls above.
**Fix:** one `selections` object (`{AV, AC, PR, UI, S, C, I, A}`) in a single `useState`/`useReducer`; everything else computed with `useMemo`. Removes `noNull`, the 8 setters, and the big `clearSelection`.

### 1.7 [P1] `vector` prop change with same string is ignored / reset logic is fragile
`if (vector && vector !== "" && vector !== cvssString) initData(); else clearSelection();`
If a parent passes the same vector the user just produced, the `else` branch runs `clearSelection()` and **wipes the user's selections**. (Realistic: parent stores `onChange` string and passes it back.)
**Fix:** with a derived-state design (§1.6), sync from `vector` only when it differs from the current computed string; never clear on equality.

### 1.8 [P2] Scoring maths: verify against the spec and add tests
The formulas in `functions.js` match the CVSS 3.1 spec (roundUp, ISS, 7.52/6.42, 3.25×(ISS−0.02)^15, 1.08 scope factor, 8.22 exploitability) — good. But there are **zero tests** for them, and `PR` weights live under keys `U`/`C` with misleading comments (`data.js:~258-263` — the "used if Scope is Unchanged" comment sits above the `C` block).
**Fix:** add unit tests using the official FIRST examples (e.g. `AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H` = 9.8; `…/S:C/C:H/I:H/A:H` = 10.0; `AV:L/AC:L/PR:H/UI:N/S:U/C:N/I:N/A:N` = 0.0) and boundary rating tests (0.0 / 0.1 / 3.9 / 4.0 / 6.9 / 7.0 / 8.9 / 9.0). Fix the comments.

### 1.9 [P2] Severity lookup with floating-point boundaries
`score >= bottom && score <= top` with tops like `3.9` leaves gaps for values such as `3.95` (can't occur after 1-dp rounding, but can if callers pass raw numbers). **Fix:** use `score < 4.0` style thresholds.

### 1.10 [P2] `giveFulldata` is not exported from the package and can throw
`functions.js` — `giveFulldata` dereferences `matrics.options` without checking `find` results. It is exported from `functions.js` but not re-exported from `index.js`, so it is dead API. Decide: export it (with a null guard) or delete it.

---

## 2. Code quality / maintainability

### 2.1 [P1] `src/index.js` is 813 lines of copy-pasted JSX
Every metric button is a hand-written `<Popup><Button/></Popup>`, duplicated **twice** (vertical layout for mobile, horizontal for desktop) — 8 metrics × ~3 options × 2. Only the group's `vertical` prop differs; the rest is identical.
**Fix:** render from the existing `baseMatrices` config:
```jsx
{baseMatrices.map(m => <MetricRow key={m.key} metric={m} value={sel[m.key]} .../>)}
```
with one `<Button.Group vertical={isMobile}>`. Expected size: ~813 → ~150 lines and a single place to change behaviour. (Note `baseMatrices` already holds `key`, `name`, `options[]`.)

### 2.2 [P1] Popup text injected with `dangerouslySetInnerHTML`
`popupData` HTML strings (`<b>`, `<ul><li>`) are injected ~35 times. Content is static and library-owned so this is not currently exploitable, but it is a lint/security-scanner red flag and blocks strict CSP/Trusted-Types consumers.
**Fix:** store popup content as structured data (`{ label: 'Worst', text: '…', bullets: [...] }`) and render with JSX; drop `dangerouslySetInnerHTML`.

### 2.3 [P1] Component-library styling side effects
`import "semantic-ui-css/semantic.min.css"` inside `src/index.js` forces ~600 KB of global CSS onto every consumer, bundled/handled differently by each bundler, and breaks SSR/Jest setups without a CSS loader. Also, `semantic-ui-css` is in `dependencies`.
**Fix:** remove the import; document that consumers import `semantic-ui-css/semantic.min.css` (or their own theme) themselves; move it to `peerDependencies`/`devDependencies`.

### 2.4 [P2] Typos and naming
`versoinNumber`, `matrics`, `isErrorOccured`, `giveFulldata`, `Colors.securityCaseSeverity*` (app-specific naming leaked in from an internal project), `popupData` mixed-case wording ("Worse" vs "Worst" in `PR.L`/`AV.A` — verify against the spec's wording), and a stray `className\n="statColumn"` line break in JSX. Commented-out `useEffect` block in `index.js` should be deleted.

### 2.5 [P2] `var` inside function scope, `Math.pow`, `await` on non-promises
Replace `var score`/`var ratingObj` with `const`; `**` operator; remove pointless `async`/`await`.

### 2.6 [P2] Inline `window.innerWidth` resize handling via deprecated `Responsive`
See §3.2. Also `handleScreenResize` is invoked from `<Responsive onUpdate>` on each update — replace with CSS media queries or a small `useMediaQuery` hook, and guard `window` for SSR.

---

## 3. Dependencies and toolchain (the biggest modernisation area)

Everything is pinned to the early-2020 ecosystem. `npm audit` on this lockfile will report a large number of vulnerabilities, almost all from `react-scripts@3.4.1` (webpack 4, old `node-sass`/`postcss`, `serialize-javascript`, `minimist`, `loader-utils`, etc.).

### 3.1 [P0] Runtime dependencies are wrong for a library
`package.json` → `dependencies` contains **`react`, `react-dom`, `react-scripts`**, which are shipped to every consumer as required installs:
- `react` / `react-dom` in `dependencies` can cause **two copies of React → "Invalid hook call"** errors in consumer apps.
- `react-scripts` (an entire CRA build toolchain, hundreds of packages, all its CVEs) is installed for every user of the package.
**Fix:**
```jsonc
"peerDependencies": {
  "react": ">=17",            // decide on floor; see 3.2
  "react-dom": ">=17",
  "semantic-ui-react": "^2.1.5",
  "semantic-ui-css": "^2.5.0",
  "styled-components": "^6.0.0"
},
"dependencies": { },          // prop-types only if kept
"devDependencies": { /* react, react-dom, tooling */ }
```
`react-scripts` must be removed entirely.

### 3.2 [P0] React 16 peer range and deprecated Semantic-UI-React API
- `peerDependencies.react: "^16.0.0"` → modern apps on React 18/19 get peer-dependency errors (`ERESOLVE`) when installing.
- `semantic-ui-react@0.88` is 5 major-ish versions old. **`Responsive` was removed in v1.0 / v2** (replaced by `Media` from `@artsy/fresnel` or CSS). The library uses `Responsive` (`Responsive.onlyTablet.minWidth`, `fireOnMount`, `onUpdate`).
- `styled-components@5` → v6 has small breaking changes (transient `$props`, no automatic prop forwarding).
**Fix:** upgrade to `semantic-ui-react@^2.1.5`, replace `Responsive` with a `useMediaQuery`/`window.matchMedia` hook (or CSS), upgrade `styled-components` to v6, widen peer range to `^17 || ^18 || ^19` (test on 18 and 19). Consider whether Semantic UI is still the right foundation (see 5.3).

### 3.3 [P0] Build tool: `microbundle-crl` is unmaintained
The build (`microbundle-crl --no-compress --format modern,cjs`) is deprecated and won't run on current Node. The latest commit message says "build package with rollup", but **no rollup config exists in the repo** — the commit only re-generated files or changed nothing durable. (The `dist/` folder is gitignored and absent, so the published output can't be reproduced from source.)
**Fix:** pick one modern bundler and commit its config: **`tsup`** (simplest; ESM + CJS + `.d.ts` in one command) or Vite library mode / Rollup. Example `tsup.config.ts`:
```ts
export default defineConfig({
  entry: ['src/index.tsx'], format: ['esm','cjs'], dts: true, sourcemap: true,
  clean: true, external: ['react','react-dom','semantic-ui-react','styled-components']
})
```

### 3.4 [P0] `package.json` publishing metadata is outdated
- `"main": "dist/index.js"`, `"module": "dist/index.modern.js"` — no **`exports`** map, no `types`. Modern resolvers (Node ESM, Vite, Next.js) prefer `exports`.
- No `sideEffects` field (needed for tree-shaking; note CSS import above).
- `"prepublish"` is deprecated (also runs on plain `npm install`); use **`prepublishOnly`** (or `prepack`).
- `"engines": ">=10"` — Node 10 is long EOL; use `>=18` (or `>=20`).
- Missing: `keywords`, `bugs`, `homepage`, `funding`, `"type"`, and `"files"` should also include README/LICENSE (there is **no LICENSE file** although the package says MIT).
- `"source": "src/index.js"` is a microbundle-ism.
**Fix:**
```jsonc
"type": "module",
"exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js", "require": "./dist/index.cjs" } },
"main": "./dist/index.cjs", "module": "./dist/index.js", "types": "./dist/index.d.ts",
"sideEffects": false,
"scripts": { "prepublishOnly": "npm run test && npm run build" },
"engines": { "node": ">=18" }
```
Validate with `npx publint` and `npx @arethetypeswrong/cli --pack`.

### 3.5 [P0] No type definitions
The repo has `tsconfig.json` and `@types/react` but all source is `.js` and no `.d.ts` is emitted. TS consumers get implicit-any errors.
**Fix:** migrate `src/` to TypeScript (`.tsx`); it is small (5 files). Export `CVSSCalcProps`, `CVSSOutput`, `Severity` types. Replace the `PropTypes` with TS types. Fix `tsconfig` (`"strict": true`, `"jsx": "react-jsx"`, drop `suppressImplicitAnyIndexErrors` — removed in TS 5.5, `"moduleResolution": "bundler"`).

### 3.6 [P1] Linting / formatting stack is obsolete
ESLint 6, `@typescript-eslint` 2.x, `eslint-config-standard` 14, `eslint-config-prettier/standard` sub-configs (removed in eslint-config-prettier 8+), `babel-eslint` (deprecated). `.eslintrc` sets `"env": {"node": true}` for browser code and has `react-version 16`.
**Fix:** ESLint 9 flat config (`eslint.config.js`) with `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks` (**missing today** — would flag the stale `useEffect` dependency arrays, e.g. `useEffect(..., [vector])` uses `cvssString`/`initData`), and Prettier 3. Drop the `standard` presets. Also note `.eslintignore` is replaced by `ignores` in flat config.

### 3.7 [P1] Testing is not real
`npm test` runs `react-scripts test` but the library has **no tests**; the only test is the example app's "renders without crashing" (`example/src/App.test.js`), which uses removed `ReactDOM.render` semantics in React 18+.
**Fix:** **Vitest** + `@testing-library/react` + `@testing-library/user-event` + `jsdom`. Cover: scoring (§1.8), vector parsing (§1.3), component renders, clicking every metric fires `onChange` with the right vector, `readOnly` blocks clicks, invalid vector shows the error.

### 3.8 [P1] CI is dead
`.travis.yml` (Travis CI, Node 10/12). Travis's free tier for OSS is gone.
**Fix:** GitHub Actions workflow: matrix Node 18/20/22 → `npm ci`, lint, typecheck, test, build, `publint`. Add a separate release workflow using **npm provenance** (`npm publish --provenance`) with a trusted-publishing / granular token. Add Dependabot or Renovate.

### 3.9 [P1] Deprecated / stale `example/` app
- Uses CRA (`react-scripts` via `file:../node_modules/...` hack), which is deprecated and unsupported.
- Depends on the library via `file:..` (needs a prior root install + build).
- `example/debug.log` — a Chromium crash log — is **committed** (`git ls-files` lists it).
- `example/package-lock.json` is committed alongside a `file:` setup, and `README`s are CRA boilerplate.
- `homepage` / `gh-pages` deploy script depends on the same tooling.
**Fix:** replace with a Vite + React example (or Storybook / a `playground` workspace using npm workspaces), delete `debug.log` and add `*.log` to `.gitignore`, deploy the demo via GitHub Actions Pages instead of `gh-pages` package.

### 3.10 [P2] Lockfile / install hygiene
Root `package-lock.json` is from npm 6 era (lockfileVersion 1) — regenerate after the upgrades. `react`/`react-dom` are listed both in `dependencies` and `devDependencies` (duplicates), `react-scripts` too.

---

## 4. Accessibility and UX

### 4.1 [P1] Metrics are buttons with no group semantics
Options are `Button`s inside `Button.Group` with only `primary` styling for selection. Screen readers can't tell which option is selected or what group it belongs to.
**Fix:** use `role="radiogroup"` + `role="radio"` with `aria-checked` (or real `<input type="radio">` styled), `aria-labelledby` pointing at the metric label, and arrow-key navigation. Give `readOnly` buttons `aria-disabled` instead of relying on a CSS class (`unclickableButton`) + JS guard.

### 4.2 [P1] Help popups are hover-only and desktop-only
`Popup` is disabled below the computer breakpoint and default trigger is hover; keyboard/touch users can't reach the CVSS definitions. **Fix:** trigger on focus as well (`on={['hover','focus']}`) or use an explicit "?" info button per metric; don't hide help on mobile, use an expandable text.

### 4.3 [P2] Colour-only severity, no live region
The rating is colour + text (ok) but the score updates silently. Add `aria-live="polite"` on the score block. Verify colour contrast for `securityCaseSeverityLow` (`#b5cc18`) with white text (inverted Statistic) — likely fails WCAG AA.

### 4.4 [P2] Hard-coded English strings
Titles, error messages and metric names are literals. Accept an optional `labels` prop or `locale` object for i18n.

### 4.5 [P2] Only Base metrics
No Temporal / Environmental metrics, and no CVSS 4.0 (the current FIRST standard, published Nov 2023). Not a defect, but worth documenting in the README and considering a v2 roadmap: at minimum, state clearly "CVSS v3.1 Base only".

---

## 5. Repo, docs and release process

### 5.1 [P1] README is minimal and partly wrong
- Missing: import statement, peer-dependency/CSS-import instructions, props table (types/defaults), `onChange` payload shape (`{ string, selections, score, ratingDetails }`), readOnly behaviour, screenshot/GIF, supported CVSS versions, browser support, link to live demo.
- Badge for "JavaScript Style Guide: standard" is no longer accurate after the lint change.
- Usage example omits `import CVSSCalc from 'react-semantic-cvss'` and defines `cvssString` / `cvssOnChange` out of nowhere.
**Fix:** rewrite; add a "Migration from 1.x" section.

### 5.2 [P1] Add missing repo files
`LICENSE` (MIT text — currently absent), `CHANGELOG.md`, `.npmignore` not needed if `files` is used (fine), `.nvmrc`, `CONTRIBUTING.md` (optional), `.github/workflows/*`, `.gitignore` additions (`*.log`, `coverage`, `.vite`, `*.tsbuildinfo`). Remove `.rpt2_cache` reference (rollup-plugin-typescript2 leftover from an older template).

### 5.3 [P2] Strategic: is Semantic UI still the right base?
`semantic-ui-react` is community-maintained (Fomantic-UI fork is the active line) and has slow releases; `semantic-ui-css` global styles conflict with modern design systems, and the `Responsive` removal shows the breakage risk. Options:
1. **Keep it** (upgrade to `semantic-ui-react@2`) — least work, keeps the brand of the package name.
2. **Headless core + adapters**: export the pure scoring/parsing functions (`calculateBaseScore`, `parseVector`, `severityOf`) as a framework-free entry (`react-semantic-cvss/core`) and keep the Semantic UI component as one skin. This makes the calculator reusable and easily testable.
Recommendation: do (1) now, structure code so (2) is easy later.

### 5.4 [P1] Versioning
The fixes in §1.4 (number score), §3.1 (peer deps), §3.2 (React/SUIR versions) and §2.3 (no CSS import) are breaking. Release as **`2.0.0`**, with a migration guide and a deprecation notice on the last 1.x if desired. Publish a `2.0.0-beta.0` under the `next` tag first.

---

## Suggested execution order

1. **Foundation** (no behaviour change): add LICENSE, delete `example/debug.log`, `.gitignore` `*.log`, move `react`/`react-dom`/`react-scripts` out of `dependencies`, drop `react-scripts`, add tsup + Vitest + ESLint 9 + Prettier 3, GitHub Actions, `exports`/`types`/`prepublishOnly`, `engines >= 18`.
2. **Safety net**: write scoring + rating + vector-parsing tests against the official CVSS 3.1 examples *before* refactoring.
3. **Correctness fixes**: §1.1–1.7 (propTypes, header precedence, parse/validate, numeric score, derived state, no wipe on equal vector).
4. **Refactor**: config-driven rendering (§2.1), remove `dangerouslySetInnerHTML` (§2.2), TypeScript migration (§3.5), drop the CSS import (§2.3).
5. **Dependency upgrades**: React 18/19 peer range, `semantic-ui-react@2` (replace `Responsive`), `styled-components@6`.
6. **A11y + docs**: §4.1–4.3, README rewrite, Vite-based example/demo.
7. **Release**: `2.0.0-beta` on `next` tag → verify in a fresh React 18 and React 19 app (Vite + Next.js) → `npm publish --provenance` as `2.0.0`.

## Quick wins (< 1 hour, safe)
- Fix header precedence bug (§1.2).
- `CVSSCalc.propTypes` typo (§1.1).
- Remove `react`, `react-dom`, `react-scripts` from `dependencies` (§3.1).
- Add LICENSE; delete `example/debug.log`; `prepublish` → `prepublishOnly`.
- Reset `isErrorOccured` when `vector` changes.
