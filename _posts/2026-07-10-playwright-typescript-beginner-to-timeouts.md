---
layout: post
title: "Playwright and TypeScript: async/await, fixtures, and timeouts"
date: 2026-07-10
last_modified_at: 2026-07-10
categories: [automation, tools]
tags: [playwright, typescript, async, await, fixtures, timeouts, locators, beginner, intermediate, suite]
excerpt: "A practical guide to Playwright Test in TypeScript: async/await, condition-based waits versus fixed sleeps, suite structure with test/describe and fixtures, timeout configuration, plus a cheatsheet and best practices."
reading_time: 28
---

Opening a page, clicking a control, and asserting the result sounds simple until the first suite hits CI. Then you are juggling `async`/`await`, several different clocks, two styles of `expect`, and a stack of `*.spec.ts` files. The hard part is rarely TypeScript syntax. It is knowing **which wait**, **which structure**, and **which timeout** actually apply.

This guide walks those pieces in order: **async/await**, **sleep versus real waits**, **how to grow a suite** (Playwright’s `test` / `test.describe` API—not Jest’s free-standing `describe`/`it`), **hooks**, **fixtures**, and **timeout configuration**—with a cheatsheet and best practices at the end.

Examples use [playwright.dev](https://playwright.dev). Relative URLs assume `use.baseURL` where noted.

Related reading: [Playwright vs Selenium in 2026]({{ site.baseurl }}{% link _posts/2026-06-15-playwright-vs-selenium-2026.md %})

## Table of contents {#toc}

1. [Reading paths](#reading-paths)
2. [Prerequisites](#prerequisites)
3. [Part I — Async and waiting](#part-i-async)
   - [Your first real test](#your-first-real-test)
   - [async and await](#async-and-await)
   - [Promise.all vs sequential await](#promiseall-vs-sequential-await)
   - [Sleep vs real waits](#sleep-vs-real-waits)
4. [Part II — Building a test suite](#part-ii-suite)
   - [Project layout](#project-layout)
   - [Playwright `test` (default) vs Jest/Jasmine `describe`/`it`](#playwright-test-vs-jest-jasmine)
   - [How a suite grows](#how-a-suite-grows)
   - [Hooks](#hooks)
   - [Fixtures](#fixtures)
5. [Part III — Timeouts](#part-iii-timeouts)
6. [Locators and assertions](#locators-and-assertions)
7. [Config, debugging, API tests, page objects](#config-debug-api-pos)
8. [Cheatsheet](#cheatsheet)
9. [Best practices](#best-practices)
10. [Sources](#sources)

### Reading paths {#reading-paths}

| Audience | Start here | Goal |
|----------|------------|------|
| **New to Playwright** | [First test](#your-first-real-test) → [async](#async-and-await) → [Sleep vs real waits](#sleep-vs-real-waits) | Explain `await` and why fixed sleeps are unreliable |
| **Organizing a suite** | [Project layout](#project-layout) → [How a suite grows](#how-a-suite-grows) → [Fixtures](#fixtures) | Know when to use describe, hooks, and fixtures |
| **Debugging timeouts** | [Sleep vs real waits](#sleep-vs-real-waits) → [Part III](#part-iii-timeouts) → [Cheatsheet](#cheatsheet) | Identify which timeout failed from the error text |

```mermaid
flowchart LR
  B[Basics] --> W[Waits]
  W --> S[Suite and fixtures]
  S --> T[Timeouts]
  B -.->|short path| C[Cheatsheet]
  T --> C
```

---

## Prerequisites {#prerequisites}

- **Node.js 18+**
- `@playwright/test` installed
- Browsers via Playwright

```bash
npm init playwright@latest
# or
npm i -D @playwright/test
npx playwright install
```

```bash
npx playwright test
npx playwright test --ui
```

---

# Part I — Async and waiting {#part-i-async}

## Your first real test {#your-first-real-test}

A test without an assertion is only a script. Start with something that can fail for a clear reason.

```typescript
import { test, expect } from '@playwright/test';

// Think of it like: "Hey Playwright, when this test runs, give me a browser page
// and let me use await inside this function."
//
// ANALOGY: the shape of a Playwright test
// ┌──────────────────────────┬────────────────────────────────────────────────┐
// │ Piece                    │ Plain English                                  │
// ├──────────────────────────┼────────────────────────────────────────────────┤
// │ test('name', ...)        │ Register one case in the suite                 │
// │ async (...) => { }       │ This recipe may pause mid-step                 │
// │ { page }                 │ Built-in fixture: a fresh browser tab          │
// │ await ...                │ Pause THIS line until that step finishes       │
// │ expect(...)              │ Prove something — don't only log it            │
// └──────────────────────────┴────────────────────────────────────────────────┘

test('playwright.dev shows the get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
  await expect(page.getByRole('link', { name: 'Get started' })).toBeVisible();
});
```

| Line | Plain English |
|------|----------------|
| `import { test, expect }` | Pull in the runner and assertions |
| `async ({ page }) =>` | Allow pauses; inject a fresh `page` tab |
| `await page.goto(...)` | Navigate and wait for the load state |
| `await expect(...).toBeVisible()` | Poll until true or the **expect** timeout fires |

![async/await sequential flow versus unfinished Promises]({{ site.baseurl }}/assets/playwright-typescript-guide-illustrations/01-async-await-flow.svg){:.post-illustration}
*With `await`, each step finishes before the next.*

## async and await {#async-and-await}

Browser automation is asynchronous: navigation, clicks, and network work finish later. `async`/`await` is how TypeScript expresses that without nested callbacks.

### Analogy: what each keyword does

| Keyword | Job |
|---------|-----|
| `async` on a function | “Allow `await` inside this function” (and return a `Promise`) |
| `await` on a line | “Pause **this line** until the Promise resolves, then continue” |

```typescript
// Think of it like: "Hey Playwright, when this test runs, give me a browser page
// and let me use await inside this function."
//
// ANALOGY: async vs await
// ┌─────────────────────┬────────────────────────────────────────────────┐
// │ Keyword             │ Job                                            │
// ├─────────────────────┼────────────────────────────────────────────────┤
// │ async on function   │ "Hey JS, allow await inside this function"     │
// │ await on line       │ "Pause THIS LINE until the Promise resolves"   │
// └─────────────────────┴────────────────────────────────────────────────┘
// You need BOTH.
//   async = "I'm allowing pauses in this recipe."
//   await = "Pause here until this step finishes."

import type { Page } from '@playwright/test';

async function preparePage(page: Page) {
  await page.goto('https://playwright.dev/');                    // pause until navigation finishes
  await page.getByRole('link', { name: 'Docs' }).click();       // pause until click + actionability done
  return page;
}
```

**Rule:** if a function body uses `await`, that function must be marked `async`. JavaScript enforces it. You need **both**: `async` opens the door; `await` actually pauses.

**Common mistake:** omitting `await` does not give you the finished value. You get a `Promise`. Playwright tests almost always use sequential `await` so each browser action completes before the next.

### Prefer `await` over `.then()` chains

```typescript
// ANALOGY: .then vs await
// ┌──────────────────┬──────────────────────────────────────────────────┐
// │ Style            │ Feels like                                       │
// ├──────────────────┼──────────────────────────────────────────────────┤
// │ .then(callback)  │ "When it finishes, run this nested note"         │
// │ await value      │ "Stay on this line until done, then keep going"  │
// └──────────────────┴──────────────────────────────────────────────────┘

// Works, harder to debug
await page.title().then((title) => console.log(title));

// Standard Playwright style
const title = await page.title();
await expect(page).toHaveTitle(/Playwright/);
```

```mermaid
flowchart LR
  subgraph thenStyle [then style]
    A1[page.title] --> B1[".then(...)"]
  end
  subgraph awaitStyle [await style]
    A2["const t = await page.title()"] --> B2[use t]
  end
```

### `const` vs `let`

Default to `const`. Use `let` only when you will reassign.

```typescript
// ANALOGY: const vs let
// ┌────────┬────────────────────────────────────────────┐
// │ Keyword│ Job                                        │
// ├────────┼────────────────────────────────────────────┤
// │ const  │ "This name stays put" (no reassignment)    │
// │ let    │ "I may reassign this later"                │
// └────────┴────────────────────────────────────────────┘

const title = await page.title();
let attempts = 0;
attempts += 1;
```

## Promise.all vs sequential await {#promiseall-vs-sequential-await}

Sequential `await` is the default for most steps:

```typescript
// ANALOGY: sequential vs Promise.all
// ┌─────────────────────┬──────────────────────────────────────────────────┐
// │ Pattern             │ Kitchen analogy                                  │
// ├─────────────────────┼──────────────────────────────────────────────────┤
// │ await a; await b;   │ Boil water, THEN cook pasta (one after another)  │
// │ Promise.all([a,b])  │ Start oven AND timer together; wait for both     │
// └─────────────────────┴──────────────────────────────────────────────────┘
// Promise.all is NOT a sleep. It is "start these jobs together."

await page.getByRole('button', { name: 'Save' }).click();
await expect(page.getByText('Saved')).toBeVisible();
```

Use `Promise.all` when you must **register a waiter before** (or at the same time as) the action that triggers it, so a fast response is not missed:

```typescript
const [response] = await Promise.all([
  page.waitForResponse((r) => r.url().includes('/api/save') && r.ok()),
  page.getByRole('button', { name: 'Save' }).click(),
]);
```

| Pattern | Meaning | Typical use |
|---------|---------|-------------|
| `await a; await b;` | Run a, then b | Most Playwright steps |
| `Promise.all([a, b])` | Start a and b, wait for both | Click + `waitForResponse` |
| `Promise.all` without `await` | Work started but not joined | Almost always a test bug |

`Promise.all` is not a sleep and not a timeout setting. It is concurrent promise coordination in JavaScript.

## Sleep vs real waits {#sleep-vs-real-waits}

Flaky suites often treat **fixed sleeps**, **condition-based waits**, **concurrent promises**, and **config timeouts** as if they were the same tool. They are not.

```text
// ANALOGY: families of "waiting"
// ┌────────────────────────────┬──────────────────────────────────────────────┐
// │ Family                     │ Plain English                                │
// ├────────────────────────────┼──────────────────────────────────────────────┤
// │ Fixed sleep                │ "Wait N ms no matter what" (guessing)        │
// │ Condition wait             │ "Wait until the page is actually ready"      │
// │ Promise.all                │ "Start two jobs together" (not a delay)      │
// │ Config timeout             │ "How long am I allowed to wait before fail?" │
// └────────────────────────────┴──────────────────────────────────────────────┘
// Sleep = close your eyes and hope. Condition wait = watch the door until it opens.
```

![Sleep versus condition waits, concurrency, and config timeouts]({{ site.baseurl }}/assets/playwright-typescript-guide-illustrations/07-wait-zoo.svg){:.post-illustration}
*Comparison of fixed sleeps, condition-based waits, concurrency, and config clocks.*

### Comparison

| Mechanism | Ecosystem | Behavior (simple English) | Simple analogy | Recommended process |
|-----------|-----------|---------------------------|----------------|---------------------|
| `browser.sleep(ms)` / `Thread.sleep` | Selenium / WebDriver (**not** Playwright) | Stop everything for a fixed number of ms | Close your eyes and count to three | **Do not use in Playwright.** Map old Selenium sleeps to `await expect(...)` or a real wait. |
| `page.waitForTimeout(ms)` | Playwright | Same idea: fixed sleep | Close your eyes and count | **Almost never.** Name what “ready” means, then wait for that condition. |
| `await expect(locator).toBeVisible()` | Playwright Test | Keep checking until true, or fail after the expect time (default 5s) | Watch the door until it opens (or give up) | **Default for UI truth.** Prefer this over sleeps. |
| `locator.waitFor({ state })` | Playwright | Wait until attached / visible / hidden / gone | Wait for a light to turn green before you move | Use when you need to wait **before** a step that is not an assert (e.g. screenshot). |
| `page.waitForResponse(...)` | Playwright | Wait for a network call **you** caused | Wait for the receipt after you pay | Register the waiter with the click via `Promise.all` so you don’t miss a fast response. |
| `Promise.all([...])` | JavaScript | Start two jobs together; wait until both finish | Start oven and timer at the same time | **Not a sleep.** Use for click + waitForResponse pairs. |
| `timeout` in config | Playwright Test | Max time for the **whole test** (default 30s) | End time for one full recipe | Keep default; for one long test use `test.setTimeout` / `test.slow()`, not a huge global. |
| `expect.timeout` | Playwright Test | Max time **one check** keeps re-looking (default 5s) | How long you re-check the oven light | Fix selector/condition first; raise only if the UI is truly slow. |
| `actionTimeout` / `navigationTimeout` | Playwright `use` | Max wait for clicks/fills or page loads (default: no separate limit) | How long you wait for the kettle / delivery | Set suite policy if hangs last forever; or `{ timeout }` on one call. |

**How to choose (short process):**

1. Need the **page** to show something? → `await expect(locator)…`  
2. Need a **network** result you triggered? → `waitForResponse` (+ often `Promise.all`)  
3. Need a wait that is **not** an assert? → `locator.waitFor`  
4. One step slow? → `{ timeout }` on that step  
5. Whole test long? → `test.setTimeout` / `test.slow()`  
6. Never “fix” flaky CI with sleep  

### Role-plays (one per family)

**Fixed sleep (`waitForTimeout` / Selenium `sleep`)**

- **Junior:** “CI is slow. I added `await page.waitForTimeout(3000)`.”  
- **Lead:** “You’re guessing. What means success—the Saved toast?”  
- **Junior:** “Yes.”  
- **Lead:** “Then `await expect(page.getByText('Saved')).toBeVisible()`. It finishes early when ready and fails with a clear message when not.”

**Condition wait (`expect` / `waitFor`)**

- **Junior:** “I’ll check `isVisible()` once right after click.”  
- **Lead:** “One check can race the UI. Use `await expect(...).toBeVisible()` so Playwright **keeps looking** until the expect time runs out.”

**Network wait (`waitForResponse` + `Promise.all`)**

- **Junior:** “I click Save, then wait for the response. Sometimes it already finished.”  
- **Lead:** “You started listening too late. Start the waiter and the click **together** with `Promise.all`.”

**Config timers (`timeout` / `expect.timeout` / action / navigation)**

- **Junior:** “One click is slow. I’ll set whole-suite `timeout: 120_000`.”  
- **Lead:** “That’s every test paying two minutes. Give **that click** more time, or fix why the button isn’t ready. Raise the whole-test time only for one long flow.”

### Event flow: sleep vs expect

```mermaid
sequenceDiagram
  participant T as Test
  participant C as Clock
  participant D as DOM
  Note over T,C: waitForTimeout(2000)
  T->>C: sleep 2s
  C-->>T: done (DOM may still be wrong)
  Note over T,D: await expect(loc).toBeVisible()
  T->>D: check
  D-->>T: not yet
  T->>D: check again
  D-->>T: visible — pass early
```

---

# Part II — Building a test suite {#part-ii-suite}

## Project layout {#project-layout}

```text
// ANALOGY: rooms in a house
// ┌────────────────────┬────────────────────────────────────────────┐
// │ Path               │ Job                                        │
// ├────────────────────┼────────────────────────────────────────────┤
// │ playwright.config  │ House rules (timeouts, browsers, baseURL)  │
// │ tests/             │ The actual missions (spec files)           │
// │ fixtures/          │ Shared kit you hand into each test         │
// │ pages/             │ Optional maps of UI (page objects)         │
// └────────────────────┴────────────────────────────────────────────┘
```

![Playwright project folder layout]({{ site.baseurl }}/assets/playwright-typescript-guide-illustrations/08-suite-structure.svg){:.post-illustration}
*Typical layout: config, tests, fixtures, optional page objects.*

```text
my-app/
  playwright.config.ts
  tests/
    auth/login.spec.ts
    shop/cart.spec.ts
  fixtures/
    auth.ts
  pages/                 # optional page objects
  package.json
```

You do not need every folder on day one. Start with `tests/example.spec.ts`. Grow when pain appears.

## Playwright `test` (default) vs Jest/Jasmine `describe` / `it` {#playwright-test-vs-jest-jasmine}

**Wrong way to document this:** “`test` vs `describe` vs `it` as three equal Playwright keywords.”

**Right way:** they come from **different runners**.

| | Playwright Test (out of the box) | Jest / Jasmine (unit-test runners) |
|--|----------------------------------|-------------------------------------|
| **Primary import** | `import { test, expect } from '@playwright/test'` | `describe` / `it` / `test` as free-standing APIs (globals or `@jest/globals`) |
| **One case** | `test('…', async ({ page }) => { … })` | `it('…', …)` or `test('…', …)` |
| **Group cases** | **`test.describe(...)`** — a **method on `test`** | **`describe(...)`** — top-level suite function |
| **Hooks** | **`test.beforeEach` / `test.afterEach` / …** | **`beforeEach` / `afterEach` / …** (free-standing) |
| **Browser** | Built-in fixtures (`page`, `context`, …) | None unless you bolt on a driver |

Playwright’s default public surface is the **`test` object**. Grouping and hooks are not separate first-class imports next to `test`; they hang off it: `test.describe`, `test.beforeEach`, `test.afterAll`, `test.describe.configure`. Official docs teach that shape ([Writing tests](https://playwright.dev/docs/writing-tests), [Test API](https://playwright.dev/docs/api/class-test)).

Jest/Jasmine popularized free-standing **`describe` / `it`**. If you learned unit tests first, your fingers still type those names. That is fine—as long as you **translate** them into Playwright’s API (`test` / `test.describe`), not invent:

```ts
// Wrong for Playwright — these are not the default @playwright/test exports
import { test, describe, it, beforeEach } from '@playwright/test';
```

```text
// ANALOGY: same words, different toolboxes
// ┌────────────────────────────┬──────────────────────────────────────────────────┐
// │ What you type              │ Correct mental model                             │
// ├────────────────────────────┼──────────────────────────────────────────────────┤
// │ test('...', async () =>{}) │ Playwright default: one test case                │
// │ test.describe('...', ()=>) │ Playwright: group on the test object             │
// │ test.beforeEach(...)       │ Playwright: hook on the test object              │
// │ describe(...) / it(...)    │ Jest/Jasmine vocabulary (unit tests)             │
// └────────────────────────────┴──────────────────────────────────────────────────┘
// Do NOT teach: import { test, describe, it, beforeEach } from '@playwright/test'
// Do teach:     import { test, expect } from '@playwright/test'
//               then test.describe / test.beforeEach
```

### Playwright default (what you should write)

```typescript
import { test, expect } from '@playwright/test';

// Flat: one case — no grouping required
test('user can open docs', async ({ page }) => {
  await page.goto('https://playwright.dev/docs/intro');
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});

// Grouped: describe is a METHOD of test (Playwright), not a free Jasmine global
test.describe('Documentation', () => {
  test('installation heading is visible', async ({ page }) => {
    await page.goto('https://playwright.dev/docs/intro');
    await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
  });

  test('writing tests page loads', async ({ page }) => {
    await page.goto('https://playwright.dev/docs/writing-tests');
    await expect(page.getByRole('heading', { name: 'Writing tests' })).toBeVisible();
  });
});
```

### If you are migrating from Jest/Jasmine

| Jest / Jasmine | Playwright Test (prefer) | Notes |
|----------------|--------------------------|--------|
| `describe('…', fn)` | `test.describe('…', fn)` | Grouping only; not a parallel switch by itself |
| `it('…', fn)` or `test('…', fn)` | `test('…', fn)` | Playwright’s primary case API is `test` |
| `beforeEach(fn)` | `test.beforeEach(fn)` | Same idea, different attachment point |
| `afterEach` / `beforeAll` / `afterAll` | `test.afterEach` / `test.beforeAll` / `test.afterAll` | Always via `test.*` |

Some teams keep the name `it` by aliasing (`const it = test`) for familiarity. That is a **local alias**, not “Playwright ships free-standing `it` as the default import.” Prefer what the docs show: **`test`**.

### Hooks and shared setup: the key difference

Your intuition is mostly right for **day-to-day suite code**: in Jest/Jasmine, setup is usually **declared again in each spec file** (or each `describe`). There is no built-in equivalent of Playwright’s typed **fixtures** that inject a prepared `page` / `loggedInPage` into every test across files.

Nuance (so we stay accurate):

| Concern | Jest / Jasmine | Playwright Test |
|---------|----------------|-----------------|
| Hooks in a **file** | `beforeEach` at top of file applies to tests in that file ([Jest setup/teardown](https://jestjs.io/docs/setup-teardown)) | `test.beforeEach` same idea, via `test.*` |
| Hooks in a **describe** | Scoped to that block only | `test.describe` + hooks inside it |
| Same login in **10 files** | You typically **copy** hooks/helpers into each file, or invent your own shared module | Prefer **`base.extend` fixtures** — import once, type-safe, setup/teardown around `use()` |
| “Global” setup for whole run | Config-level: `setupFiles` / `setupFilesAfterEnv` (and sometimes `globalSetup`) — **not** a browser-aware fixture system | Config `globalSetup` / project dependencies **plus** first-class fixtures for browser state |
| Fresh browser tab per test | You wire that yourself (if at all) | Built-in `page` (and `context`) fixtures |

So: Jest is not “zero global setup forever”—it has config hooks. What it lacks for E2E is Playwright’s **default harness**: browser lifecycle + per-test isolation + reusable fixtures without re-pasting hooks in every spec.

#### Example: Jest/Jasmine-style — hooks repeated per file

```typescript
// login.spec.ts  (Jest + something that drives a browser, illustrative)
import { describe, it, beforeEach, afterEach, expect } from '@jest/globals';

describe('login', () => {
  beforeEach(async () => {
    // paste or call helper — every file that needs a browser repeats this pattern
    await openBrowser();
    await gotoLogin();
  });

  afterEach(async () => {
    await closeBrowser();
  });

  it('shows error on bad password', async () => {
    // ...
    expect(true).toBe(true);
  });
});
```

```typescript
// cart.spec.ts  — same setup story, written again
import { describe, it, beforeEach, afterEach, expect } from '@jest/globals';

describe('cart', () => {
  beforeEach(async () => {
    await openBrowser();
    await loginAs('user@example.com'); // repeated in many files
  });

  afterEach(async () => {
    await closeBrowser();
  });

  it('adds an item', async () => {
    // ...
  });
});
```

#### Example: Playwright default — hooks when file-local is enough

```typescript
// tests/docs.spec.ts
import { test, expect } from '@playwright/test';

// Applies to every test in THIS file only
test.beforeEach(async ({ page }) => {
  await page.goto('https://playwright.dev/');
});

test('has Docs link', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Docs' })).toBeVisible();
});
```

#### Example: Playwright — shared setup across files without re-pasting hooks

```typescript
// fixtures/auth.ts
import { test as base, expect, type Page } from '@playwright/test';

export const test = base.extend<{ docsPage: Page }>({
  docsPage: async ({ page }, use) => {
    await page.goto('https://playwright.dev/docs/intro');
    await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
    await use(page);
  },
});
export { expect };

// tests/a.spec.ts  and  tests/b.spec.ts
import { test, expect } from '../fixtures/auth';

test('uses prepared docs page', async ({ docsPage }) => {
  await expect(docsPage.getByRole('link', { name: 'Writing tests' })).toBeVisible();
});
```

```text
// ANALOGY: repeating hooks vs fixtures
// ┌────────────────────────────┬────────────────────────────────────────────────┐
// │ Pattern                    │ Feels like                                     │
// ├────────────────────────────┼────────────────────────────────────────────────┤
// │ beforeEach in every file   │ Rewriting the same stage-setup script N times  │
// │ setupFilesAfterEnv (Jest)  │ One house rule file — still not "give me page" │
// │ Playwright fixture         │ Shared kit: prep → hand over → clean up        │
// └────────────────────────────┴────────────────────────────────────────────────┘
```

### When Jest/Jasmine is the better harness (advantages over Playwright Test)

Playwright Test is the right default **out of the box for browser E2E**. Jest/Jasmine still win for other jobs:

| Advantage of Jest/Jasmine | Why it matters |
|---------------------------|----------------|
| **Unit-test speed** | No browser launch; milliseconds for pure functions and modules |
| **Mocking ecosystem** | `jest.mock`, spies, module isolation are first-class |
| **Node / API unit tests** | Natural fit for services, reducers, validators without UI |
| **Frontend component unit tests** | Often paired with Testing Library + jsdom (not a real browser) |
| **Familiarity** | Huge community, snippets, and hiring muscle memory for unit layers |
| **Coverage tooling habits** | Mature unit-coverage workflows many teams already run in CI |

**Rule of thumb:** use **Jest (or similar) for the unit/integration layer**; use **Playwright Test for real-browser E2E**. Running full UI flows under Jest + a bolted-on browser driver is usually worse DX than `@playwright/test` defaults (fixtures, traces, multi-browser projects, UI Mode).

| Situation | Prefer |
|-----------|--------|
| Starting browser E2E on Playwright | Flat `test(...)` |
| Grouped reports or file-local hooks | `test.describe` + `test.beforeEach` |
| Same browser setup in many E2E files | **Fixtures** (`base.extend`) |
| Pure function / module unit tests | **Jest/Jasmine** (or Vitest), not Playwright |
| Parallel tests inside one Playwright file | `fullyParallel: true` or `test.describe.configure({ mode: 'parallel' })` |

### Parallelism (correct model)

```text
// ANALOGY: workers and files
// ┌────────────────────────────┬────────────────────────────────────────────┐
// │ Reality                    │ Analogy                                    │
// ├────────────────────────────┼────────────────────────────────────────────┤
// │ Separate .spec.ts files    │ Different rooms — can work at once         │
// │ Tests inside one file      │ Queue in one room (by default)             │
// │ fullyParallel / configure  │ Explicitly allow parallel in that room     │
// │ Fixtures                   │ Fresh tools per person — not more rooms    │
// └────────────────────────────┴────────────────────────────────────────────┘
```

![Playwright parallelism model]({{ site.baseurl }}/assets/playwright-typescript-guide-illustrations/02-parallelism-model.svg){:.post-illustration}

1. **Files** can run on different workers at the same time.
2. **Tests in one file** run **sequentially** by default.
3. `test.describe` groups reporting; it is not itself a parallel switch.
4. Fixtures **isolate state**. They do not create workers.

## How a suite grows {#how-a-suite-grows}

A common failure mode: one good test becomes dozens of copy-pasted logins, then a shared `beforeAll` that mutates global state, then unexplained CI failures.

**A more stable growth path:**

1. One focused test with real assertions  
2. Split files by feature (`auth/`, `shop/`)  
3. Use `test.describe` when you need report structure or file-local hooks  
4. Move repeated setup into **fixtures**  
5. Configure **projects** for browsers and CI  
6. Introduce page objects when selectors and flows repeat (optional)  

![Suite event flow: worker, fixture, test, teardown]({{ site.baseurl }}/assets/playwright-typescript-guide-illustrations/09-suite-event-flow.svg){:.post-illustration}
*What runs when you execute `npx playwright test`.*

## Hooks {#hooks}

Hooks are methods on **`test`**. They work at **file scope** or inside `test.describe`.

```typescript
// ANALOGY: hooks as stage crew
// ┌──────────────────┬────────────────────────────────────────────────┐
// │ Hook             │ Job                                            │
// ├──────────────────┼────────────────────────────────────────────────┤
// │ beforeAll        │ Set the stage once (shared props — careful)    │
// │ beforeEach       │ Reset props before every scene                 │
// │ afterEach        │ Clean the stage after every scene              │
// │ afterAll         │ Strike the set once at the end                 │
// └──────────────────┴────────────────────────────────────────────────┘

import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('https://playwright.dev/');
});

test('has docs link', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Docs' })).toBeVisible();
});

test.describe('API docs', () => {
  test.beforeAll(async () => {
    // once per worker for this group
  });

  test('Page class docs load', async ({ page }) => {
    await page.goto('https://playwright.dev/docs/api/class-page');
    await expect(page.getByRole('heading', { name: 'Page', exact: true })).toBeVisible();
  });
});
```

| Hook | Runs | Use for |
|------|------|---------|
| `test.beforeAll` | Once per worker/group | Expensive shared setup (careful: shared state) |
| `test.beforeEach` | Before each test | Fresh navigation |
| `test.afterEach` | After each test | Attachments, cleanup |
| `test.afterAll` | Once after group | Shared teardown |

**Caution:** `beforeAll` shares state within a worker. If one test mutates data another test depends on, failures become order-dependent. Prefer fixtures when each test needs isolated setup.

## Fixtures {#fixtures}

Fixtures are Playwright’s mechanism for reusable setup and teardown. You declare dependencies once, TypeScript types them on the test signature, and each test receives a clean instance by default—unlike a shared `beforeAll` bag of state.

### Custom fixture

```typescript
// fixtures/auth.ts
//
// Think of it like: "Build a prepared page, hand it to the test, clean up after."
//
// ANALOGY: fixture lifecycle
// ┌──────────────┬──────────────────────────────────────────────────────┐
// │ Phase        │ Plain English                                        │
// ├──────────────┼──────────────────────────────────────────────────────┤
// │ setup        │ Prep the kit (login, seed data, open a page)         │
// │ await use(x) │ Hand kit to the test body — test runs here           │
// │ after use()  │ Teardown / cleanup                                   │
// └──────────────┴──────────────────────────────────────────────────────┘
// Hooks = stage directions in one file.
// Fixtures = reusable kit you can import across many files.

import { test as base, expect, type Page } from '@playwright/test';

type MyFixtures = {
  docsPage: Page;
};

export const test = base.extend<MyFixtures>({
  docsPage: async ({ page }, use) => {
    // setup
    await page.goto('https://playwright.dev/docs/intro');
    await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
    await use(page); // test body runs with docsPage
    // teardown after use() returns
  },
});

export { expect };
```

```typescript
// tests/docs.spec.ts
import { test, expect } from '../fixtures/auth';

test('writing tests nav exists', async ({ docsPage }) => {
  await docsPage.getByRole('link', { name: 'Writing tests' }).click();
  await expect(docsPage.getByRole('heading', { name: 'Writing tests' })).toBeVisible();
});
```

![Fixture lifecycle]({{ site.baseurl }}/assets/playwright-typescript-guide-illustrations/03-fixture-lifecycle.svg){:.post-illustration}

| Concern | Hooks in a file | Fixtures |
|---------|-----------------|----------|
| Reuse across files | Copy-paste or helpers | Import an extended `test` |
| Per-test isolation | Easy to leak via `beforeAll` | Fresh setup per test by default |
| TypeScript autocomplete | Manual | Fixture names are typed |
| Parallel safety | Shared state is risky | Designed for isolation |

When the same login (or role) is needed in many files, extend `test` with a fixture such as `loggedInPage` instead of pasting the login steps. Teardown runs after `use()` returns.

### Filtering runs

```bash
npx playwright test -g "installation"
npx playwright test tests/docs.spec.ts
npx playwright test --project=chromium
npx playwright test --headed
npx playwright test --debug
npx playwright test --ui
```

---

# Part III — Timeouts {#part-iii-timeouts}

A **timeout** is simply: “How long will Playwright wait before it gives up?”

- Too short → tests fail on slow CI even when the app is fine.
- Too long → real bugs hide while the suite crawls.

Sleep says “wait N ms no matter what.”  
A timeout says “if it is not ready by then, **fail**.”

### Timeout comparison (plain English)

| Setting | Simple meaning | Everyday analogy | What to do (recommended) |
|---------|----------------|------------------|---------------------------|
| `timeout` (config) | Max time for the **whole test** (default **30s**). Includes setup + the test body. Cleanup after the test gets its **own** similar budget. | A **meeting end time** for one scenario | Keep default for most tests. For one slow flow: `test.setTimeout(...)` or `test.slow()`, not a huge global default. |
| `expect.timeout` | How long one **check** keeps looking (default **5s**). Example: “is the button visible yet?” | How long you keep **re-checking a status board** | Prefer fixing the selector or wait condition. Raise only for known-slow UI. |
| `actionTimeout` | Max wait for **clicks, fills, presses** to become ready (default: **no separate limit** — still limited by the whole-test time) | How long you wait for a **button to become clickable** | Set a suite policy if actions hang forever. Or pass `{ timeout }` on one call. |
| `navigationTimeout` | Max wait for **goto / reload / waitForURL** (default: **no separate limit**) | How long you wait for a **page to load** | Prefer a sensible `waitUntil` + locator assert. Raise only for known-slow apps. |
| Inline `{ timeout: N }` on one call | “Only this line waits up to N ms” | A **sticky note on one step** | Best first fix when **one** action is slow. More specific beats a global change. |
| Fixture `{ timeout: N }` | Extra time for slow **setup** (login, seed data) | Extra time to **prep the tools** before the real work | Use when login is slow; don’t force every test’s body to share that cost blindly. |
| `page.waitForTimeout(ms)` | Fixed sleep — **not** a smart timeout | Closing your eyes and counting | Almost never. Wait for a real condition instead. |

```text
// ANALOGY: kitchen timers (not fancy "ceilings")
// ┌────────────────────┬──────────────────────────────────────────────────┐
// │ Setting            │ Think of it as                                   │
// ├────────────────────┼──────────────────────────────────────────────────┤
// │ timeout            │ Timer for the whole recipe                       │
// │ expect.timeout     │ How long you stare at the oven light per check   │
// │ actionTimeout      │ How long you wait for the kettle to be ready     │
// │ navigationTimeout  │ How long you wait for the delivery driver        │
// │ { timeout } inline │ A sticky note: "only this step, max N seconds"   │
// └────────────────────┴──────────────────────────────────────────────────┘
// Narrowest rule wins: sticky note on one step beats house rules.
```

![Timeout layers]({{ site.baseurl }}/assets/playwright-typescript-guide-illustrations/05-timeout-layers.svg){:.post-illustration}
*Different timeout settings control different waits — start with the smallest fix.*

### Recommended process (when something times out)

1. **Read the full error** — it usually names which wait failed.  
2. **Fix the condition first** — wrong selector? missing assert? use `await expect(locator)…` instead of sleep.  
3. **If only one step is slow** — add `{ timeout: … }` on that call.  
4. **If one whole test is long** — `test.setTimeout` / `test.slow()` for that test only.  
5. **If many tests need the same policy** — then change config (`timeout`, `expect.timeout`, `actionTimeout`, …).  
6. **Last resort** — raise numbers globally; never “fix” flakes with `waitForTimeout`.

**Role-play — picking the right timer**

- **Junior:** “Everything times out. I’ll set `timeout: 120_000` for the whole suite.”  
- **Lead:** “What does the error say? One slow click, or the whole test?”  
- **Junior:** “Only `click` on Checkout.”  
- **Lead:** “Then give **that click** more time, or fix why the button isn’t ready. Don’t make every test wait two minutes.”

---

## The two big numbers (config)

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 30 * 1000,              // whole test: give up after 30s
  expect: { timeout: 5_000 },      // each auto-retry check: re-look up to 5s
});
```

1. **`timeout`** — time budget for **one full test** (setup + body). After the body finishes, cleanup hooks get a **separate** similar budget ([docs](https://playwright.dev/docs/test-timeouts)).  
2. **`expect.timeout`** — how long **one** `await expect(...)` keeps re-checking.

```typescript
test('slow checkout', async ({ page }) => {
  test.setTimeout(120_000); // this test only: allow 2 minutes
  // or: test.slow(); // allow about 3× the default for this test
});
```

**Role-play — whole test vs one check**

- **Junior:** “`toBeVisible` fails. I’ll raise the whole-test `timeout`.”  
- **Lead:** “That error is the **expect** timer (keeps re-looking), not the whole-test timer. Fix the locator, or raise `expect.timeout` / pass `{ timeout }` on that expect.”

---

## Action and navigation timeouts

By default there is **no separate** limit just for clicks or navigations (they still stop when the **whole test** time runs out).

```typescript
// Sticky note on ONE step: wait up to 10s for this click to be ready, then fail.
await page.getByRole('link', { name: 'Get started' }).click({ timeout: 10_000 });

// House rule for all actions / navigations (optional):
// use: { actionTimeout: 10_000, navigationTimeout: 30_000 }
```

There is **no** `use.clickTimeout` or `use.fillTimeout` — use `actionTimeout` or per-call `{ timeout }`.

**Role-play — one slow click**

- **Junior:** “Checkout click dies on CI. I added `waitForTimeout(5000)` before it.”  
- **Lead:** “That’s a blind wait. Prefer `click({ timeout: 10_000 })` or assert the button is visible first. Don’t pay five seconds on every run forever.”

### What “ready to click” means (actionability)

Before `click()`, Playwright waits until the target is, among other checks ([actionability](https://playwright.dev/docs/actionability)):

1. **Visible** on the page  
2. **Stable** — not mid-animation (two frames in a row, not a fixed sleep)  
3. **Enabled** — not disabled  
4. **Can receive the click** — not covered by a modal or banner  
5. Often **exactly one** match  

**Role-play — “it works on my machine”**

- **Junior:** “Button is there. Why timeout?”  
- **Lead:** “Cookie banner covers it, or two buttons match. Read the error: ‘intercepts pointer’ or strict mode. Fix the page state or the locator — more sleep won’t help.”

---

## Navigation load states

When you `goto`, you can choose **how finished** the page must be:

| `waitUntil` | Simple meaning |
|-------------|----------------|
| `commit` | Server answered; page started |
| `domcontentloaded` | HTML structure ready |
| `load` | Default — main load finished |
| `networkidle` | No network for 500 ms — **often never settles** on modern apps |

**Recommended process:** navigate with a sensible `waitUntil`, then assert what you care about with a **locator** (`await expect(...).toBeVisible()`).

**Role-play — networkidle**

- **Junior:** “I’ll wait for `networkidle` so the SPA is ‘fully loaded’.”  
- **Lead:** “Analytics never stop. Prefer `domcontentloaded` + expect the heading you need.”

---

## Retries

```typescript
// ANALOGY: retries
// "If the first take fails, try the whole test again N more times."
// retries is a NUMBER — not an object with fancy modes.
// "Flaky" (official) = failed first, then passed on a later try.

export default defineConfig({
  retries: process.env.CI ? 2 : 0, // number only
});
```

**Flaky (official):** failed first run, passed on a retry.  
There is **no** `retries: { mode: 'rewriteEach' }` API.

**Role-play — retries as a band-aid**

- **Junior:** “It’s flaky. `retries: 5`.”  
- **Lead:** “Retries hide the bug. Find the real wait or shared state. Keep retries low on CI (0–2).”

---

## Fixture timeouts

If login setup is slow, give **that setup** more time — not every assertion:

```typescript
heavy: [
  async ({}, use) => {
    await use('ready');
  },
  { timeout: 60_000 }, // up to 60s for this fixture’s setup/teardown budget
],
```

**Role-play — slow login fixture**

- **Junior:** “Login fixture is slow, so I raised every test’s expect timeout.”  
- **Lead:** “Give the **fixture** more time. Keep assertion checks tight so real UI bugs still fail fast.”

---

## Triage flowchart

```mermaid
flowchart TD
  Q([Something timed out]) --> A{One specific call?}
  A -->|yes| B["Add timeout only on that call"]
  A -->|no| C{One whole test is slow?}
  C -->|yes| D["test.setTimeout or test.slow for that test"]
  C -->|no| E{All clicks or all page loads?}
  E -->|yes| F["actionTimeout or navigationTimeout in config"]
  E -->|no| G{Many tests need more time?}
  G -->|yes| H["timeout or expect.timeout in config"]
  G -->|no| I["Not a timer problem: fix locator, race, or shared state"]
```

| Error text looks like… | What it usually means | First move |
|------------------------|----------------------|------------|
| `Test timeout of 30000ms exceeded` | Whole test ran out of time | Speed up steps, or raise time for **that** test |
| `expect… timeout 5000ms` | One check never became true | Fix selector/condition; then maybe more expect time |
| `locator.click: Timeout` | Click never became ready | Fix overlay/locator; optional click `{ timeout }` |
| `page.goto: Timeout` | Navigation never finished | Check URL/network; avoid `networkidle` on chatty apps |
| Passed only on retry | **Flaky** | Fix root cause; don’t only raise retries |

---

# Locators and assertions {#locators-and-assertions}

A **locator** re-resolves when you act. That is different from grabbing a DOM node once.

```text
// ANALOGY: locator vs element handle
// ┌────────────────────┬────────────────────────────────────────────────┐
// │ Idea               │ Plain English                                  │
// ├────────────────────┼────────────────────────────────────────────────┤
// │ Locator            │ Address / recipe — find it again each time     │
// │ Old element handle │ Photo of a seat — may be stale after the train │
// │ getByRole          │ "The Sign in button a user would hear/see"     │
// │ await expect(loc)  │ Keep checking until true (or expect timeout)   │
// │ expect(value)      │ Check a plain JS value once (no auto-retry)    │
// └────────────────────┴────────────────────────────────────────────────┘
```

![Locator preference ladder]({{ site.baseurl }}/assets/playwright-typescript-guide-illustrations/04-locator-ladder.svg){:.post-illustration}

| Rank | API |
|------|-----|
| 1 | `getByRole` |
| 2 | `getByLabel` |
| 3 | `getByText` / placeholder / alt / title |
| 4 | `getByTestId` |
| 5 | CSS locator |
| 6 | XPath last |

Locator `expect` **polls**. Plain value `expect` does not.

```typescript
// Think of it like: "Keep checking this address until the sign is visible."
await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
await expect(page.getByText('Slow')).toBeVisible({ timeout: 10_000 });
```

---

# Config, debugging, API tests, page objects {#config-debug-api-pos}

## Config sketch

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'https://playwright.dev',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

## Debugging triad

```text
// ANALOGY: three tools, three moments
// ┌────────────┬────────────────────────────────────────────────────────┐
// │ Tool       │ When                                                   │
// ├────────────┼────────────────────────────────────────────────────────┤
// │ UI Mode    │ Daily development — watch, filter, re-run              │
// │ Inspector  │ Step live — see the click about to happen              │
// │ Trace      │ After CI failure — flight recorder of the run          │
// └────────────┴────────────────────────────────────────────────────────┘
```

![Debugging triad]({{ site.baseurl }}/assets/playwright-typescript-guide-illustrations/06-debug-triad.svg){:.post-illustration}

| Tool | Command |
|------|---------|
| UI Mode | `npx playwright test --ui` |
| Inspector | `npx playwright test --debug` |
| Trace | `npx playwright show-trace trace.zip` |

## API fixture

```typescript
// ANALOGY: request fixture
// "Skip the UI stage crew — call the API directly."

test('docs site responds', async ({ request }) => {
  const response = await request.get('https://playwright.dev/');
  expect(response.ok()).toBeTruthy();
});
```

Strong pattern: seed via API, assert via UI.

## Page objects (opinion)

```text
// ANALOGY: page object vs fixture
// ┌──────────────┬──────────────────────────────────────────────────────┐
// │ Tool         │ Job                                                  │
// ├──────────────┼──────────────────────────────────────────────────────┤
// │ Page object  │ Map of one page's controls and flows                 │
// │ Fixture      │ Prep state (logged in, seeded data) for the test     │
// │ Combo        │ Fixture hands you a ready page object                │
// └──────────────┴──────────────────────────────────────────────────────┘
```

Encapsulate selectors and flows. Prefer fixtures for auth. Combine: fixture yields a page object.

---

# Cheatsheet {#cheatsheet}

```text
// One-line reminders (same analogies as the sections above)

ASYNC
  async fn  → "allow pauses in this recipe"
  await x   → "pause THIS line until x finishes"
  Promise.all([a,b]) → start both, wait both (not a sleep)

WAITS
  ❌ browser.sleep          → Selenium cousin, not Playwright
  ❌ waitForTimeout(ms)     → fixed sleep, last resort
  ✅ await expect(loc)...   → auto-retry UI truth
  ✅ waitForResponse        → network you caused
  ✅ Promise.all(click+wait)→ avoid missing fast events

SUITE (Playwright API — not free-standing Jest describe/it)
  import { test, expect } from '@playwright/test'
  test('name', async ({ page }) => {})
  test.describe('group', () => { ... })   // method on test
  test.beforeEach / afterEach / beforeAll / afterAll
  fixtures: base.extend + await use(value)
  // Jest/Jasmine: describe(...) + it(...) are a different runner's style

TIMEOUTS (simple English)
  (1) whole test time     timeout: 30_000
  (2) one check re-look   expect: { timeout: 5_000 }
  (3) all clicks/fills    use.actionTimeout (default: no separate limit)
  (4) all page loads      use.navigationTimeout (default: no separate limit)
  (5) one slow test       test.setTimeout / test.slow()
  (6) one call            click({ timeout })
  (7) one expect          expect(loc).toBeVisible({ timeout })
  (8) slow setup only     [fn, { timeout: 60_000 }]
  Process: read error → fix condition → sticky note on one step → one test → config last

PARALLEL
  files parallel by default
  tests in a file serial unless fullyParallel / describe.configure
  fixtures isolate; they do not create workers
```

---

# Best practices {#best-practices}

**Do**

1. Prefer `await expect(locator)…` as the default wait for UI state.
2. Prefer `getByRole` / `getByLabel` / `getByTestId` over brittle CSS.
3. Organize tests by feature, not a single growing “misc” file.
4. Use fixtures for shared setup that must stay isolated per test.
5. Read the full timeout error before increasing limits.
6. Pair `waitForResponse` with the triggering action via `Promise.all` when needed.
7. Keep `retries` modest; treat “flaky” as a defect signal, not a feature.
8. Use UI Mode and traces before introducing sleeps.

**Don’t**

1. Do not assume `browser.sleep` exists in Playwright (Selenium/WebDriver API).
2. Do not rely on `waitForTimeout` for stability.
3. Do not import free-standing Jest/Jasmine-style `describe` / `it` / `beforeEach` from `@playwright/test`; use `test.describe` / `test` / `test.beforeEach`.
4. Do not equate flat vs nested style with parallel vs serial execution.
5. Do not invent config keys such as `clickTimeout` or object-shaped `retries` modes.
6. Do not share mutable `beforeAll` state across independent tests.
7. Do not raise `expect.timeout` to hide a bad selector.
8. Do not treat `console.log` alone as a completed test.

Prefer condition-based waits over wall-clock sleeps: the DOM (or the network response you caused) is the reliable signal, not an arbitrary delay.

---

## Sources & Further Reading {#sources}

1. [Playwright Test — Timeouts](https://playwright.dev/docs/test-timeouts)
2. [Playwright Test — Parallelism](https://playwright.dev/docs/test-parallel)
3. [Playwright Test — Fixtures](https://playwright.dev/docs/test-fixtures)
4. [Playwright — Locators](https://playwright.dev/docs/locators)
5. [Playwright — Actionability](https://playwright.dev/docs/actionability)
6. [Playwright Test — Retries](https://playwright.dev/docs/test-retries)
7. [Playwright Test — Configuration](https://playwright.dev/docs/test-configuration)
8. [Playwright — Writing tests](https://playwright.dev/docs/writing-tests)
