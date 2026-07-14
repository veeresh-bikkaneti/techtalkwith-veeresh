# Blog post verification evidence

Runnable checks and reports that verify technical claims in published posts against live source code and official documentation.

| Post | Report | Runnable evidence |
|------|--------|-------------------|
| [Parallel Cucumber BDD in Java (2026-07-02)](../../_posts/2026-07-02-get-started-cucumber-bdd-parallel-java.md) | [VERIFICATION_REPORT.md](2026-07-02-cucumber-bdd-parallel-java/VERIFICATION_REPORT.md) | [threadlocal-driver-demo](2026-07-02-cucumber-bdd-parallel-java/threadlocal-driver-demo/) |
| [XPath Cheatsheet for Test Automation (2026-09-22)](../../_posts/2026-09-22-xpath-cheatsheet-for-test-automation.md) | [VERIFICATION_REPORT.md](2026-09-22-xpath-cheatsheet/VERIFICATION_REPORT.md) | [2026-09-22-xpath-cheatsheet (Playwright TS)](2026-09-22-xpath-cheatsheet/) |

## Quick run

### Cucumber BDD parallel Java (2026-07-02)

```powershell
cd evidence/blog-verification/2026-07-02-cucumber-bdd-parallel-java
.\run-verification.ps1
```

Requires JDK 21 and network access (script fetches upstream `pom.xml` from GitHub).

### XPath/CSS cheatsheet §11 — Playwright TS (2026-09-22)

```powershell
cd evidence/blog-verification/2026-09-22-xpath-cheatsheet
.\run-verification.ps1
```

Requires Node.js 22+, npm 10+, and network access for the the-internet.herokuapp.com subset. Local HTML fixtures (SVG / shadow-DOM / ARIA) run fully offline.