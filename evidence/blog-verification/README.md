# Blog post verification evidence

Runnable checks and reports that verify technical claims in published posts against live source code and official documentation.

| Post | Report | Runnable evidence |
|------|--------|-------------------|
| [Parallel Cucumber BDD in Java (2026-07-02)](../../_posts/2026-07-02-get-started-cucumber-bdd-parallel-java.md) | [VERIFICATION_REPORT.md](2026-07-02-cucumber-bdd-parallel-java/VERIFICATION_REPORT.md) | [threadlocal-driver-demo](2026-07-02-cucumber-bdd-parallel-java/threadlocal-driver-demo/) |

## Quick run

```powershell
cd evidence/blog-verification/2026-07-02-cucumber-bdd-parallel-java
.\run-verification.ps1
```

Requires JDK 21 and network access (script fetches upstream `pom.xml` from GitHub).