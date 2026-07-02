---
layout: post
title: "Parallel Cucumber BDD in Java: Clone It, Docker It, Ship It"
date: 2026-07-02
categories: [frameworks, automation]
tags: [cucumber, bdd, selenium, testng, parallel, java, maven, docker, webdriver, beginner]
excerpt: "A beginner-friendly, slightly unhinged tour of cucumberBDDParallel — run it locally or in Docker, understand parallel BDD without crying, and steal the framework for your own app."
reading_time: 14
---

Your Cucumber suite is running scenarios one at a time. Chrome opens. Chrome closes. Chrome opens again. Somewhere, a CI meter spins like a slot machine nobody asked for.

BDD was supposed to keep tests readable. Parallel runs were supposed to keep feedback fast. In Java, those two goals often stare at each other across a conference table until someone says "we'll revisit in Q4" and Q4 never comes.

I built [cucumberBDDParallel](https://github.com/veeresh-bikkaneti/cucumberBDDParallel) because I got tired of that meeting. It's a small reusable core, a real working example (Google, not `example.com`), and enough structure that you can clone it, run it, and actually understand what's happening before lunch.

Pop quiz, hotshot ([*Speed*](https://en.wikipedia.org/wiki/Speed_(1994_film))): can you run parallel browser BDD without writing your own thread pool? If you nodded, keep reading anyway — the `-DskipTests` flag has fooled smarter people.

## What you're actually getting

Two Maven modules. That's the whole magic trick.

| Module | What it does |
|--------|--------------|
| `framework/` | Reusable JAR: browser hooks, waits, `BasePage`, optional AI locator healing |
| `example-tests/` | Working Cucumber + Selenium demo you can copy like a shameless chef |

![Two-module split: reusable framework core and working example tests]({{ site.baseurl }}/assets/get-started-cucumber-bdd-parallel-java-illustrations/01-two-module-split.svg)
*Hand-drawn style illustration — steal the recipe, not the restaurant.*

Under the hood: [Cucumber 7.34.4](https://github.com/veeresh-bikkaneti/cucumberBDDParallel/blob/main/pom.xml), [Selenium 4.45.0](https://www.selenium.dev/documentation/webdriver/), [TestNG 7.12.0](https://testng.org/#_parallelism_and_time_outs), and the [Cucable plugin](https://github.com/trivago/cucable-plugin) to split scenarios so they can run side by side instead of forming a polite queue.

Optional AI healing calls the [Anthropic Messages API](https://platform.claude.com/docs/en/api/messages) when a `@FindBy` locator dies after a markup change. It's off by default. You don't need an API key to learn the framework — save that plot twist for later.

```mermaid
flowchart LR
    subgraph framework["framework/ (reusable JAR)"]
        DM[DriverManager ThreadLocal]
        SU[Setup / TearDown hooks]
        BP[BasePage + Wait]
        AI[AI locator healing optional]
    end
    subgraph example["example-tests/ (your cookbook)"]
        FE[.feature files]
        ST[Step definitions]
        PO[Page objects]
        CU[Cucable + Failsafe runners]
    end
    example -->|Maven dependency| framework
    FE --> ST --> PO --> DM
    CU --> FE
```

## Prerequisites (the short list)

- **JDK 21**
- **Maven 3.9+** — or just use the bundled `mvnw` / `mvnw.cmd` and pretend Maven isn't installed
- **Chrome or Firefox** — [WebDriverManager](https://bonigarcia.dev/webdrivermanager/) fetches the driver. Life finds a way ([*Jurassic Park*](https://www.uphe.com/movies/jurassic-park)).

**Or skip local installs for now** and read through the rest of this post first. You can always come back and run the Maven commands once JDK and a browser are in place.

## Step 1: Clone and run (local)

```bash
git clone https://github.com/veeresh-bikkaneti/cucumberBDDParallel.git
cd cucumberBDDParallel
```

**Linux/macOS:**

```bash
./mvnw clean verify -Pintegration-test -DskipTests -pl example-tests -am
```

**Windows:**

```powershell
.\mvnw.cmd clean verify -Pintegration-test -DskipTests -pl example-tests -am
```

Firefox enjoyers:

```bash
./mvnw clean verify -Pintegration-test -DskipTests -pl example-tests -am -Dbrowser=firefox
```

### The `-DskipTests` mind-bender

This flag does **not** mean "skip all testing." I know. The name is doing crimes.

It tells Maven Surefire to leave alone the hand-written `HomePageTest` and `SearchTest` runners during the `test` phase. Those are great for debugging one feature in your IDE. They're not how the parallel pipeline runs in CI.

The real show is Cucable-generated runners executed by the [Maven Failsafe Plugin](https://maven.apache.org/surefire/maven-failsafe-plugin/) during `integration-test`. There is no spoon — only phases ([*The Matrix*](https://www.warnerbros.com/movies/matrix)).

![The -DskipTests flag routes you away from Surefire double-runs, not away from testing]({{ site.baseurl }}/assets/get-started-cucumber-bdd-parallel-java-illustrations/06-skiptests-fork.svg)

```mermaid
flowchart TD
    CMD["mvnw verify -Pintegration-test -DskipTests"]
    CMD --> SKIP["Surefire: skip HomePageTest / SearchTest"]
    CMD --> GEN["Cucable splits features"]
    GEN --> RUN["Failsafe: parallel *IT runners"]
    SKIP -.->|without flag| BAD["Surefire double-runs *Test classes"]
    RUN --> GREEN["Browsers do the Gherkin thing"]
```

Green Cucumber output means you won. The demo hits live google.com, so you need network access and a browser that isn't decorative.

## Step 2: Folder layout (don't panic)

```
cucumberBDDParallel/
├── framework/          # Library you depend on
│   └── .../driver/     # Setup, TearDown, ThreadLocal DriverManager
│   └── .../page/       # BasePage
│   └── .../ai/         # Optional healing
└── example-tests/      # Copy this structure
    ├── features/
    ├── homepage/       # Page + steps
    └── runner/         # IDE-friendly single-feature runners
```

Three layers. Memorize these and you'll survive most BDD conversations:

1. **Gherkin** — what humans argue about in refinement
2. **Step definitions** — thin glue
3. **Page objects** — where Selenium actually touches the DOM

![BDD three layers: Gherkin, step glue, and page objects]({{ site.baseurl }}/assets/get-started-cucumber-bdd-parallel-java-illustrations/02-bdd-three-layers.svg)

[Cucumber's step definition model](https://cucumber.io/docs/cucumber/step-definitions/) exists for exactly this split. Readable scenarios. Maintainable automation. Revolutionary concept, somehow.

```mermaid
flowchart LR
    G["Gherkin .feature"] --> S["Step definitions"]
    S --> P["Page objects"]
    P --> B["Browser"]
```

## Step 3: Read a feature file

`example-tests/src/test/resources/features/Home_page.feature`:

```gherkin
Feature: Home page

  Scenario Outline: Check page display
    Given A user navigates to HomePage "<countryCode>"
    Then Google logo is displayed
    And search bar is displayed

    Examples:
      | countryCode |
      | fr          |
      | com         |

  Scenario: Check title
    Given A user navigates to HomePage "fr"
    Then page title is "Google"
```

Scenario Outline = same flow, different data. [Gherkin](https://cucumber.io/docs/gherkin/) reads like English on purpose.

You don't put Selenium in the feature file. If you do, a senior engineer will appear behind you like a horror-movie extra. No jump scare required; the disappointment is enough.

## Step 4: Follow a step into code

`HomePageSteps` stays thin:

```java
@Given("^A user navigates to HomePage \"([^\"]*)\"$")
public void aUserNavigatesToHomePage(String country) {
    this.homePage.goToHomePage(country);
}
```

`HomePage` extends `BasePage`:

```java
@FindBy(css = "#hplogo")
private WebElement logo;

@FindBy(css = "input[name=q]")
private WebElement searchInput;
```

`BasePage` pulls the driver from `DriverManager.get()`. You don't pass `WebDriver` through seventeen constructors like it's a family heirloom.

Drop `Setup` and `TearDown` into your runner's `glue` array and every scenario gets a fresh browser. `TearDown` quits the session and grabs a screenshot on failure — your mission, should you choose to accept it, leaves evidence behind ([*Mission: Impossible*](https://www.paramount.com/movies/mission-impossible)).

## Step 5: How parallel actually works

"Cucumber parallel" sounds like one checkbox. It isn't. Three mechanisms hold hands:

![Serial vs parallel — one browser at a time is a tragedy in three acts]({{ site.baseurl }}/assets/get-started-cucumber-bdd-parallel-java-illustrations/04-serial-vs-parallel.svg)

### 1. Cucable splits your features

At `generate-test-resources`, [Cucable](https://github.com/trivago/cucable-plugin) chops scenarios (and Scenario Outline rows) into individual feature files plus generated TestNG runners from `cucable.template`. `parallelizationMode=features` means each piece can run on its own.

One browser to rule them all? Not anymore ([*The Lord of the Rings*](https://www.warnerbros.com/movies/lord-rings-fellowship-ring)).

### 2. Failsafe forks JVMs

`example-tests/pom.xml` sets Failsafe `forkCount` to 2. Two JVM processes can chew through generated `*IT` runners simultaneously. More forks, more speed, more RAM sacrificed to the performance gods.

### 3. ThreadLocal keeps browsers from cross-contaminating

`DriverManager` stores each thread's `WebDriver` in a `ThreadLocal`. Without that, parallel runs produce the classic "why did my test click the wrong tab?" bug. Don't cross the streams ([*Ghostbusters*](https://www.sonypictures.com/movies/ghostbusters)).

```java
private static final ThreadLocal<WebDriver> DRIVER = new ThreadLocal<>();
```

`DriverManagerTest` proves two threads get two drivers. That's the safety net you want before trusting parallel BDD in CI. I can do this all day — but I'd rather the tests do it for me ([*Captain America: Civil War*](https://www.marvel.com/movies/captain-america-civil-war)).

![Cucable splits scenarios, Failsafe forks JVMs, ThreadLocal isolates browsers]({{ site.baseurl }}/assets/get-started-cucumber-bdd-parallel-java-illustrations/03-parallel-split-flow.svg)

```mermaid
flowchart TD
    SRC["Source .feature files"] --> CUC["Cucable parallel goal"]
    CUC --> GF["Single-scenario features"]
    CUC --> GR["Generated *IT runners"]
    GR --> FS["Failsafe forkCount=2"]
    FS --> JVM1["JVM fork 1"]
    FS --> JVM2["JVM fork 2"]
    JVM1 --> TL1["ThreadLocal drivers"]
    JVM2 --> TL2["ThreadLocal drivers"]
```

```mermaid
sequenceDiagram
    participant M as Maven verify
    participant C as Cucable
    participant F as Failsafe
    participant S as Setup hook
    participant D as DriverManager

    M->>C: split features
    C-->>M: *IT runners
    M->>F: integration-test
    F->>S: @Before each scenario
    S->>D: set WebDriver on thread
```

## Step 6: Debug one feature in your IDE

Don't want the full parallel circus? Use the plain runners:

- `HomePageTest` → `Home_page.feature`
- `SearchTest` → `Search.feature`

Right-click, run, breathe. Single-threaded. No Cucable. Perfect for learning. CI uses the generated runners, not these — same way movie trailers show the good scenes and skip the credits.

## Step 7: Steal the framework for your app

When you're ready to aim at your own AUT instead of Google:

```bash
./mvnw -pl framework -am install
```

```xml
<dependency>
    <groupId>com.cucumberbddparallel</groupId>
    <artifactId>framework</artifactId>
    <version>1.0-SNAPSHOT</version>
</dependency>
```

Then: extend `BasePage`, add `Setup`/`TearDown` to `glue`, copy the Cucable + Failsafe bits from `example-tests/pom.xml`. `example-tests` is a cookbook, not a dependency you'll drag into production like an overstuffed suitcase.

```mermaid
flowchart LR
    CLONE[Clone repo] --> RUN[Run locally with mvnw]
    RUN --> SWAP[Point at your app]
    SWAP --> INSTALL[Install framework JAR]
    INSTALL --> OWN[Your features + pages]
```

## Optional: AI self-healing locators

Locator breaks after a CSS rename? The framework can send page HTML to Claude, get a new selector, retry once. These aren't the droids you're looking for — until the second try ([*Star Wars*](https://www.starwars.com/films/star-wars-episode-iv-a-new-hope)).

![Optional AI healing: broken locator, one retry, then move on or fail loud]({{ site.baseurl }}/assets/get-started-cucumber-bdd-parallel-java-illustrations/05-ai-healing-optional.svg)

Off unless `ANTHROPIC_API_KEY` is set:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
./mvnw clean verify -Pintegration-test -DskipTests -pl example-tests -am
```

Force off:

```bash
-Dai.healing.enabled=false
```

My advice: learn parallel BDD and page objects first. Add healing when broken locators — not broken tests — are your bottleneck. Healing a bad assertion is like putting sunglasses on a broken leg. Stylish. Ineffective.

```mermaid
flowchart TD
    A["@FindBy lookup"] --> B{Found?}
    B -->|Yes| C[Continue]
    B -->|No, healing off| D[Fail]
    B -->|No, healing on| E[Claude suggests selector]
    E --> F{Retry works?}
    F -->|Yes| C
    F -->|No| D
```

## What to expect

**Good fit:**

- Clone-and-run Java BDD with real structure
- Parallel scenarios without hand-rolling threads
- A `mvnw` wrapper so you don't need a global Maven install
- A path from Google demo → your application

**Not a fit:**

- A permanent correctness gate on google.com (Google changes markup; your framework can be fine while the demo wheezes)
- Guaranteed reproducible browser versions without pinning (WebDriverManager resolves at runtime)

For production, point tests at your AUT and pin browser versions in `Setup` if your pipeline demands it. `PLAYBOOK.md` in the repo says the quiet part out loud.

## Troubleshooting (quick hits)

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `No WebDriver set up for this thread` | `@Before` didn't run | Add `framework.driver` to runner `glue` |
| Tests run twice | Surefire picked up `*Test` | Keep `-DskipTests` on the Maven command |
| Chromedriver version mismatch | Browser updated itself again | Re-run; pin versions if CI demands it |
| Logo locator fails | Live Google demo drift | Expected. Use your own AUT. |
| Chrome crash in CI container | Low `/dev/shm` | Bump `shm_size` in your pipeline compose file |

## Where to go next

- [cucumberBDDParallel on GitHub](https://github.com/veeresh-bikkaneti/cucumberBDDParallel) — README, CI, AI healing diagram
- `PLAYBOOK.md` — SOLID notes, cost model, extension points
- [Building BDD Frameworks That Actually Work]({% link _posts/2026-06-20-building-bdd-frameworks-that-work.md %}) — Gherkin habits that won't embarrass you in refinement

Parallel BDD doesn't have to be a senior-engineer-only club. Clone it. Run one feature file end to end. Swap Google for your app.

And if something confuses you, open an issue on the repo. Good frameworks get better when beginners tell you exactly where they tripped — preferably with logs, not just vibes.