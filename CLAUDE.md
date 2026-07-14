# Claude Code Instructions for Knowledge Share

## Project Context

Tech blog focused on QA engineering, test automation (Playwright, Selenium, Cypress), and quality-driven development. Audience: SDETs, QA engineers, and developers new to test automation.

## Tone & Voice (NON-NEGOTIABLE)

**Read `.agents/TONE.md` before writing any content.**

All posts, guides, and documentation MUST follow:
- **Human** — Real language, personality, metaphors. No corporate jargon.
- **Humorous** — Playful, light. Break tension with analogies.
- **Collaborative** — "We're in this together." Acknowledge expert confusion.
- **Positive** — Encouraging, solvable, achievable.
- **Conversational** — Write like a mentor. Casual grammar OK.

**Scope:** Beginner to Advanced. Start accessible, go deep.

## Mandatory Content Requirements

Every post addressing these topics MUST include:

1. **Timeouts** — Which one? When to use. Why seniors trip up. Decision tree.
2. **Test frameworks** — Jest vs Jasmine vs Playwright test. What's different. When to switch.
3. **Async operations** — async/await in *Playwright* context. Real problems it solves.
4. **Use cases** — Real (CI flakes, parallel, isolation). Not abstract.

## Template Posts

- `PLAYWRIGHT_GUIDE.md` — Gold standard. Use as template for structure, personality, depth.
- Blog post example: `_posts/2026-07-10-playwright-typescript-beginner-to-timeouts.md`

## Link Format for Internal References

All internal post links MUST use Jekyll `link` tag wrapped with `{{ site.baseurl }}` to respect GitHub Pages baseurl:

```markdown
[Text]({{ site.baseurl }}{% link _posts/YYYY-MM-DD-slug.md %})
```

✅ Correct (includes baseurl)
❌ Wrong: `[Text]({% link _posts/YYYY-MM-DD-slug.md %})` (missing baseurl)

See commit `165760c` for details on link fixes.

## When Writing/Reviewing

- [ ] Tone checklist in `.agents/TONE.md` passes?
- [ ] Real use cases present?
- [ ] Expert confusion acknowledged?
- [ ] Async/timeouts/framework choice explained in context?
- [ ] Cheatsheet, flowchart, or decision tree included?
- [ ] Links use `{{ site.baseurl }}{% link ... %}`?

## Project Structure

- `_posts/` — Jekyll blog posts
- `PLAYWRIGHT_GUIDE.md` — Consolidated Playwright guide (canonical reference)
- `.agents/` — Agent configs and tone guide
- `_config.yml` — Jekyll settings (baseurl: /techtalkwith-veeresh)

## Recent Work

- Fixed 38 blog posts with missing `{{ site.baseurl }}` in internal links (commit `165760c`)
- Identified `PLAYWRIGHT_GUIDE.md` as tone exemplar vs blog post
- Created tone guide to prevent repetition of preferences

## Next Steps

New posts should:
1. Start with `PLAYWRIGHT_GUIDE.md` structure/tone as template
2. Address confusing topics (timeouts, frameworks, async) with real use cases
3. Use correct link format with baseurl
4. Pass tone checklist before merge
