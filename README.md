# Tech Talk with Veeresh

A personal tech blog and portfolio site for **Veeresh Bikkaneti** — Principal QA Architect | AI Test Architect | Product Owner | Scrum Master with 20+ years in enterprise quality engineering.

🌐 **Live Site:** [veeresh-bikkaneti.github.io/techtalkwith-veeresh](https://veeresh-bikkaneti.github.io/techtalkwith-veeresh/)

---

## About

This site is built with [Jekyll](https://jekyllrb.com/) and deployed via [GitHub Pages](https://pages.github.com/). It features:

- **Dark-mode first** design optimized for developer/technical content
- **Code syntax highlighting** with Rouge (Monokai theme)
- **Responsive layout** — works on mobile, tablet, and desktop
- **Professional portfolio** showcasing 20+ years of QA engineering experience
- **Blog** covering AI-driven testing, automation frameworks, and software quality
- **Agent Orchestrator** — structured workflow management for content and site operations

## Contact

| Platform | Link |
|----------|------|
| Email | [resume.qasdet@gmail.com](mailto:resume.qasdet@gmail.com) |
| LinkedIn | [sdetbaveer](https://www.linkedin.com/in/sdetbaveer/) |
| GitHub | [veeresh-bikkaneti](https://github.com/veeresh-bikkaneti) |
| Medium | [@veeresh.esh](https://medium.com/@veeresh.esh) |

---

## Blog Topics

- **AI & Automation** — AI-driven test strategy, Copilot integration, LLM tooling
- **Test Frameworks** — Playwright, Cypress, Selenium, SpecFlow, Cucumber
- **CI/CD Pipelines** — Azure DevOps, GitHub Actions, Jenkins, Docker
- **Leadership** — SAFe PI Planning, Scrum Master, Product Ownership, CoE
- **Domain QA** — Healthcare (FERPA), Insurance (SOX), Education compliance
- **Career Growth** — From manual tester to Principal QA Architect

---

## Agent Orchestrator

This repo uses an **agent orchestrator pattern** for managing workflows. See local `AGENTS.md` (gitignored, not published) for full details.

### Quick Overview

| Agent | Purpose |
|-------|---------|
| `content-writer` | Blog post authoring |
| `portfolio-manager` | Portfolio/about updates |
| `site-builder` | Jekyll config & layouts |
| `seo-optimizer` | Metadata & tag management |
| `deploy-agent` | GitHub Pages deployment |
| `review-agent` | Quality checks |
| `link-checker` | Link validation |
| `image-manager` | Image optimization |

### Workflow: New Blog Post

```
content-writer → seo-optimizer → review-agent → deploy-agent
```

### Workflow: Portfolio Update

```
portfolio-manager → review-agent → seo-optimizer
```

---

## Local Development

### Prerequisites

- Ruby 3.0+
- Bundler

### Setup

```bash
# Clone the repository
git clone https://github.com/veeresh-bikkaneti/techtalkwith-veeresh.git
cd techtalkwith-veeresh

# Install dependencies
bundle install

# Start local server with live reload
bundle exec jekyll serve --livereload
```

Visit [http://localhost:4000](http://localhost:4000) to preview the site.

### Build for Production

```bash
JEKYLL_ENV=production bundle exec jekyll build
```

### Link Check (CI runs this automatically)

```bash
bundle exec jekyll build
bundle exec htmlproofer ./_site --checks Links,Images --disable-external --allow-hash-href --ignore-empty-alt --swap-urls '^/techtalkwith-veeresh:'
ruby scripts/check_citations.rb
```

Internal links are checked with html-proofer; citation URLs in `## Sources & Further Reading` are verified separately.

---

## Project Structure

```
techtalkwith-veeresh/
├── _config.yml              # Jekyll configuration
├── _layouts/
│   ├── default.html         # Base layout (dark tech theme)
│   └── post.html            # Blog post layout
├── _posts/                  # 33 blog posts (Markdown + front matter)
├── assets/css/main.css      # Custom dark theme styles
├── index.md                 # Home page
├── about.md                 # Portfolio / About page
├── blog/index.html          # Blog listing page
└── .github/workflows/
    └── jekyll-gh-pages.yml  # Build, link-check, deploy
```

## Blog Posts (33)

All posts include human-voice excerpts, `## Sources & Further Reading` (4 verified URLs each), and internal cross-links.

### 2026 — Flagship automation series
| Date | Post |
|------|------|
| 2026-07-01 | Selenium 2026 Beginner's Guide (WebDriver BiDi, MCP, AI-assisted automation) |
| 2026-08-01 | Playwright MCP + Multi-Agent Testing |
| 2026-08-15 | Selenium BiDi vs Playwright CDP |
| 2026-09-01 | Playwright AI Codegen Deep Dive |
| 2026-09-15 | Self-Healing Test Suites |
| 2026-06-10 | The Browser Automation Trap (long-form anchor) |

### 2026 — Strategy, leadership & domain QA
| Date | Post |
|------|------|
| 2026-06-10 | QA Engineer's Roadmap: Manual Tester → Automation Lead |
| 2026-06-15 | Playwright vs Selenium in 2026 |
| 2026-06-20 | Building BDD Frameworks That Actually Work |
| 2026-06-25 | CI/CD Pipelines for Test Automation |
| 2026-06-28 | Lessons from Automating Healthcare QA at Scale |
| 2026-06-29 | AI-Driven Test Strategy: Copilot to Multi-Agent |

### 2024–2025 — Migrated guides (Playwright, Selenium, GraphQL, security)
21 posts from Medium and GitHub Wiki — Playwright .NET tutorials, Selenium C# patterns, GraphQL/Hasura deep dives, BDD/TDD comparisons, security testing, Azure Cosmos DB, and SDLC testing guides. See `_posts/` for the full dated archive (2020–2025).

---

## Writing a New Post

Create a new file in `_posts/` following the naming convention:

```
YYYY-MM-DD-your-post-title.md
```

Add front matter:

```yaml
---
layout: post
title: "Your Post Title"
date: 2026-07-01
categories: [automation, ai]
tags: [playwright, copilot, testing]
excerpt: "A brief description of your post (120-160 chars)."
reading_time: 7
---

Your content here...

## Section Heading

More content with code examples:

```csharp
// Code block with syntax highlighting
var page = await browser.NewPageAsync();
await page.GotoAsync("https://example.com");
```
```

### Post Guidelines

1. **Target 5-10 minute reading time** (~1000-2000 words)
2. **Include code examples** — practical, runnable snippets
3. **Use proper tags** — see taxonomy in local `AGENTS.md`
4. **Write descriptive excerpts** — 120-160 characters
5. **Add alt text** to any images

---

## Deployment

The site auto-deploys when changes are **merged to `main`** via GitHub Actions.
Contributors do not push directly to `main`; all changes go through a pull
request. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow.

**One-time setup.** Enable GitHub Pages in repository Settings → Pages → Source: **GitHub Actions**.

**Typical release flow:**

1. Create a branch from `main`, commit changes, and push the branch
2. Open a pull request targeting `main` and wait for CI (Jekyll build, html-proofer, bundler-audit, citation checks)
3. After human review and merge to `main`, GitHub Actions deploys to GitHub Pages at `https://veeresh-bikkaneti.github.io/techtalkwith-veeresh/` — canonical production URL (project path; no custom domain)

---
## Content Categories

| Category | Description | Example Tags |
|----------|-------------|--------------|
| `automation` | Test automation frameworks | playwright, selenium, cypress |
| `ai` | AI-driven testing | copilot, llm, agent-orchestration |
| `devops` | CI/CD & infrastructure | azure-devops, github-actions, docker |
| `best-practices` | QA processes | bdd, tdd, shift-left, risk-based |
| `career` | Career growth | learning-path, certifications |
| `healthcare` | Healthcare QA | ferpa, compliance, audit |
| `case-studies` | Real projects | gmr, usbе, werner, fm-global |
| `tools` | Tool reviews | postman, wiremock, rest-assured |

---

## License

MIT

---

*Built with Jekyll · Deployed on GitHub Pages · Managed with Agent Orchestrator Pattern*
