# Contributing to Tech Talk with Veeresh

This repository publishes a Jekyll blog to GitHub Pages. **No one pushes directly to `main`.** All changes—content, fixes, and policy—go through a pull request.

---

## Branch policy

- **`main` is the protected production branch.** It is the only branch that triggers a live GitHub Pages deploy.
- **Never run `git push origin main`** for feature work, content, or fixes.
- Create a topic branch from `main` using one of these prefixes:
  - `feature/…` — site features or tooling
  - `content/…` — blog posts and editorial updates
  - `fix/…` — bug fixes
  - `policy/…` — process or governance changes

Keep branch names short and descriptive (e.g. `content/rust-async-guide`, `fix/broken-nav-link`).

---

## Pull request workflow

1. **Sync with `main`**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create and switch to your branch**
   ```bash
   git checkout -b content/my-post-title
   ```

3. **Commit on the branch** — one logical change per commit where possible.

4. **Push the branch**
   ```bash
   git push -u origin content/my-post-title
   ```

5. **Open a pull request** targeting `main` on GitHub.

6. **Wait for CI** — the **Deploy Jekyll Site** workflow must pass on the PR. It runs Jekyll build, dependency audit, internal link checks (htmlproofer), and citation URL validation.

7. **Human review** — a maintainer reviews the PR. Do not merge your own PR unless explicitly authorized.

8. **Merge to `main`** — after approval and green CI, the PR is merged. **GitHub Pages deploy runs only after merge to `main`**, not on branch pushes alone.

9. **Delete the branch after merge** — merged topic branches are removed from the remote. GitHub is configured to delete the head branch automatically when a PR merges. Maintainers should not leave stale `feature/`, `content/`, `fix/`, or `policy/` branches on `origin`. Delete your local copy too:

   ```bash
   git checkout main
   git pull origin main
   git branch -d content/my-post-title
   ```

   If GitHub did not auto-delete (e.g. a manual merge), delete the remote branch explicitly:

   ```bash
   git push origin --delete content/my-post-title
   ```

---

## Agent and AI contributors

Automated agents (Codebuff, Cursor, Copilot, etc.) follow the same rules as human contributors:

- **Do not push to `main`.** Ever.
- **Review before push.** Run a code/content review (subagent or human) on the branch diff before `git push`. Fix findings on the branch, then push.
- **Open a PR and stop.** Agents push the branch and open (or leave ready to open) a PR. A human approves and merges — agents do not merge.
- **Content posts require the QA gate** before the PR is ready for review: fact-check claims, verify links, and humanize tone per the local `AGENTS.md` orchestrator spec (gitignored, not published). Do not mark a content PR ready until those checks are complete.

Irreversible actions (merge, deploy) require a human checkpoint.

---

## Pre-merge checklist

Before requesting review, confirm:

- [ ] **CI green** — Deploy Jekyll Site workflow passed on the PR
- [ ] **Internal links valid** — htmlproofer checks pass (no broken relative links or images)
- [ ] **New posts** — front matter date rules, citations, and tone follow `AGENTS.md` (local)
- [ ] **Scope** — changes are limited to what the PR describes; no unrelated edits

---

## Local preview

Preview the site locally before opening a PR using the Docker setup in [`docker/jekyll-serve`](docker/jekyll-serve):

```bash
cd docker/jekyll-serve
docker compose up --build
```

The site is served at **http://localhost:4000**. Edit files in the repo root; Jekyll reloads on save.

## Protecting `main` on GitHub

Enforce this policy in repository settings (maintainer one-time setup):

1. **Settings → Branches → Branch protection rules** (or **Rulesets**) for `main`
2. **Require a pull request before merging** — block direct pushes
3. **Require status checks to pass** — select the `build` job from **Deploy Jekyll Site**
4. **Do not allow bypassing** (including admins, if your org permits)

Until branch protection is enabled, contributors must still follow the PR workflow above. Agents must never push to `main` regardless of settings.

For agent workflows and content standards, see local `AGENTS.md` (not committed to the public repo).