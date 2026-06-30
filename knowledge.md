# Project Knowledge

## Project: TechTalkWithVeeresh — Developer Portfolio & Blog

A Jekyll-based developer portfolio and technical blog showcasing QA engineering expertise, test automation frameworks, and AI-driven testing insights. Deployed on GitHub Pages with a custom domain.

## Owner
- Name: Veeresh Bikkaneti
- Role: Principal QA Architect | AI Test Architect | Product Owner | Scrum Master
- Location: United States
- Focus: QA engineering, test automation, AI-driven testing, enterprise quality strategy
- Email: resume.qasdet@gmail.com
- LinkedIn: https://www.linkedin.com/in/sdetbaveer/
- GitHub: https://github.com/veeresh-bikkaneti
- Medium: https://medium.com/@veeresh.esh

## Tech Stack
- Static Site Generator: Jekyll
- Templating: Liquid
- Styling: Custom CSS (dark theme with glassmorphism, gradient accents)
- Syntax Highlighting: Rouge (Monokai theme)
- Deployment: GitHub Pages
- Canonical URL: https://veeresh-bikkaneti.github.io/knowledgeshare/ (served at the GitHub Pages project path — no custom domain)
- Fonts: Inter (sans), JetBrains Mono (mono)
- Icons: Font Awesome 6.5

## Key Directories
- _layouts/ — Jekyll layout templates (default.html, post.html)
- _posts/ — Blog posts (Markdown with front matter)
- assets/css/ — Stylesheets (main.css)
- .agents/ — Agent orchestrator definitions
- .github/workflows/ — GitHub Actions deployment

## Build Commands
- Build: bundle exec jekyll build
- Serve locally: bundle exec jekyll serve --livereload
- Docker serve: docker run -d --name jekyll-preview -v "C:/path/to/knowledgeshare:/srv/jekyll" -p 4000:4000 jekyll/jekyll sh -c 'bundle install && bundle exec jekyll serve --host 0.0.0.0'

## Key Files
- _config.yml — Jekyll configuration (url: https://veeresh-bikkaneti.github.io + baseurl: /knowledgeshare for the canonical project-path URL)
- index.md — Homepage with hero, latest posts, open source projects
- about.md — Full portfolio with resume, skills, experience, certifications
- blog/index.html — Blog listing page (must use .html, not .md)
- Gemfile — Ruby dependencies (github-pages, webrick, jekyll-feed, jekyll-seo-tag)

## Conventions
- Blog posts use .md extension with Jekyll front matter
- Blog listing page uses .html extension (not .md) to avoid Liquid escaping
- CSS uses custom properties (CSS variables) for theming
- BEM-style class naming for CSS
- Semantic HTML throughout
- All external links have rel="noopener noreferrer"
- Metric highlights use .metric CSS class (not inline styles)

## Content Structure
Blog posts cover:
- Test automation (Playwright, Selenium, Cypress, BDD)
- CI/CD pipelines (Azure DevOps, GitHub Actions, Docker)
- AI-driven testing (Copilot, LLM tooling, agent orchestration)
- QA leadership (SAFe, Scrum, CoE, product ownership)
- Healthcare/insurance/education QA compliance
- Career growth and learning paths

## Resume Data (from about.md)
- 20+ years of QA experience
- Roles: FM Global, USBE, GMR, Werner Enterprises, Tricentis
- Certifications: PSM, Postman, SpecFlow BDD, Six Sigma YB, Scrum Master Accredited, Software Test Automator
- Education: M.S. Computer Science (Wilmington), MBA (Calorx), B.S. Computer Science (Osmania)
- Open source: cypress-qa-ai-workforce, LLMcouncil, azdo-ai-toolkit, cypress-playwright
