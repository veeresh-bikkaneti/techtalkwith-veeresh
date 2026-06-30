# Tech Talk with Veeresh

A personal tech blog and portfolio site for **Veeresh Bikkaneti** — Principal QA Architect | AI Test Architect | Product Owner | Scrum Master with 20+ years in enterprise quality engineering.

🌐 **Live Site:** [veeresh.is-a.dev](https://veeresh.is-a.dev)

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

This repo uses an **agent orchestrator pattern** for managing workflows. See [AGENTS.md](AGENTS.md) for full details.

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
git clone https://github.com/veeresh-bikkaneti/knowledgeshare.git
cd knowledgeshare

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

---

## Project Structure

```
knowledgeshare/
├── AGENTS.md                # Agent orchestrator documentation
├── _config.yml              # Jekyll configuration
├── _layouts/
│   ├── default.html         # Base layout (dark tech theme)
│   └── post.html            # Blog post layout
├── _posts/                  # Blog posts (Markdown)
│   ├── 2026-06-10-qa-engineering-career-guide.md
│   ├── 2026-06-15-playwright-vs-selenium-2026.md
│   ├── 2026-06-20-building-bdd-frameworks-that-work.md
│   ├── 2026-06-25-ci-cd-pipelines-for-test-automation.md
│   └── 2026-06-28-healthcare-qa-automation.md
├── assets/css/main.css      # Custom dark theme styles
├── index.md                 # Home page
├── about.md                 # Portfolio / About page
├── blog/index.html         # Blog listing page
└── .github/workflows/       # GitHub Actions deployment
    └── jekyll-gh-pages.yml
```

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
3. **Use proper tags** — see taxonomy in AGENTS.md
4. **Write descriptive excerpts** — 120-160 characters
5. **Add alt text** to any images

---

## Deployment

The site auto-deploys on every push to `main` via GitHub Actions.

### Deployment Flow

1. Push to `main` branch
2. GitHub Actions builds the Jekyll site
3. Deploys to GitHub Pages at `veeresh.is-a.dev`
4. *(One-time setup)* Enable GitHub Pages in repository Settings → Pages → Source: **GitHub Actions**
5. The custom domain (`veeresh.is-a.dev`) is wired up automatically via the `CNAME` file at the repo root — no DNS changes needed in the GitHub UI

---

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
