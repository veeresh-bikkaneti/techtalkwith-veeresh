---
layout: post
title: "Four Drawers, One Agent"
date: 2026-09-29
categories: [ai, architecture]
tags: [agents-md, claude-md, rag, okf, openviking, langgraph, memory]
excerpt: "CLAUDE.md is not memory, a vector search is not a decision, and OpenViking is not a nicer RAG. Here is which drawer holds what."
reading_time: 10
motion: true
---

Here's a stack diagram that sounds tidy until you try to ship it. A rules file, then a vector database, then a markdown knowledge format, then a context database, then a graph framework on top. Each box supposedly replaces the one under it.

They don't.

A vector database does not know your architecture decision. A markdown rulebook does not remember that a teammate wants the gap named. A graph framework contains neither. It only decides which drawer opens next, and whether you are allowed to open one again.

The small version of this mix-up is already in the [portfolio chatbot write-up]({{ site.baseurl }}{% link _posts/2026-09-25-web-grounded-chatbot-chrome-on-device-ai-cloudflare-worker.md %}). Chrome's on-device model can decide to call a tool. It cannot search the web by itself, and it cannot remember that you scoped a proxy last Thursday unless you stored that somewhere else. The enterprise picture is the same shape with more names on it.

{% include drawers/map.html %}

## The rulebook is not memory

People hear "memory" and point at `CLAUDE.md`, because the file is sitting there when the session starts. That file is a standing order. It does not remember that the proxy was scoped and then not shipped. Ask it to, and the model will sound sure. That is worse than a short memory.

There are two files, and they are not twins.

[AGENTS.md](https://agents.md/) is plain markdown with no required fields. The site calls it a README for agents. The [Agentic AI Foundation](https://aaif.io/), under the Linux Foundation, stewards it. Codex, Cursor, and Gemini CLI read it as project instructions. Windsurf support shows up in older write-ups. Confirm it on the tool you actually run, rather than trusting a roundup from May.

`CLAUDE.md` is Anthropic's file for Claude Code. It can also be layered from a user or an org, which a repo file cannot override. Since version 2.1.277, announced around 18 Sep 2026, Claude Code reads `AGENTS.md` when no `CLAUDE.md` is present. If both exist, it reads `CLAUDE.md` and ignores `AGENTS.md`. That fallback was not on Bedrock, Vertex, or Foundry in the notes I could corroborate, and sessions that never fetch Anthropic's feature flags may not get it either.

The symlink still works.

```bash
ln -s AGENTS.md CLAUDE.md
```

Use it only when the two names must be the same bytes. The moment you want a Claude-only note, the symlink is the wrong tool, because you no longer have a place to put that note. A one-line `@AGENTS.md` import inside `CLAUDE.md` keeps one body of rules and leaves room under it.

Keep the rulebook short enough to load every turn. Procedures belong in a skill file. Decisions belong in the next drawer. A 2,000-line constitution feels thorough and then gets skimmed, which is how the one rule you cared about goes missing.

{% include drawers/rulebook.html %}

## Two ways to know something

Retrieval-augmented generation is the honest tool for a pile. You split documents, embed the chunks, store the vectors, and pull back whatever sits near the question. It retrieves neighbors, not answers. Two chunks can be close in meaning and still contradict each other. Nothing in the pattern gives you freshness unless you built freshness yourself.

The Open Knowledge Format is the other job. Google Cloud published it on 12 Jun 2026. Sam McVeety and Amir Hormati described a vendor-neutral bundle: a directory of markdown files with YAML frontmatter. No SDK. No account. I read the spec in the [open-knowledge-format repo](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md) rather than the announcement recap. As of that spec, v0.2, the only required field is still `type`. A file with nothing else is conformant.

v0.2 puts the useful optional fields where an agent can see them without guessing. `sources` for where a fact came from, `generated` and `verified` for who produced it and who checked it, `status` and `stale_after` for whether it is still current. I am confident about those names because they are in `SPEC.md`. I did not re-implement a consumer.

Here is the part the tidy diagram gets wrong. OKF is not a graph database, and it does not replace a vector index. A link from one file to another is an ordinary markdown link. The spec says the kind of relationship lives in the sentence around the link, not in the link. A tool may draw those links as edges. The edge type was never in a schema. That is a gift if your review process is a pull request. It is a disappointment if you wanted SPARQL.

It is a good fit for things a person would actually curate. A table catalog. A runbook. An architecture decision. The kind of short product note a trio does not want re-litigated next sprint. It is a bad fit for every PDF and every Slack thread. That pile stays in RAG. Tell the agent, in the rulebook, that a retrieved chunk is evidence. The decision file is policy.

```markdown
---
type: Architecture Decision
title: Web search stays behind a proxy
description: The on-device model may call searchWeb. The key never ships in the page.
status: draft
tags: [chatbot, secrets]
stale_after: 2026-12-01T00:00:00Z
---

The Prompt API can request a tool. It does not search the web.
Any key in client JavaScript is public. If we build search, the key
lives in one server-side proxy. That proxy is not in production.
```

That sketch follows OKF v0.2. `status: draft` matches the spec's lifecycle values: draft, stable, deprecated. The June announcement used `timestamp` in its examples. Prefer `stale_after` if you are writing against v0.2. Do not copy the announcement's frontmatter blindly into a current bundle.

{% include drawers/knowledge.html %}

## The notebook that survives the session

[OpenViking](https://github.com/volcengine/OpenViking) is an open-source context database from Volcengine. The interface is a virtual filesystem under `viking://`. You can list, read, and search. The docs sort context into three kinds, not two.

- **Resources.** Documents and other reference material you put there. Relatively static.
- **Memories.** What the agent extracts from sessions: profile, preferences, entities, events, plus identity and soul for the assistant's own continuity. These update. You do not hand-author every line.
- **Skills.** Reusable instructions for how to do a job. Closer to a procedure than to a recollection.

I went looking for "episodic" and "semantic" in those docs, because that is how a lot of agent write-ups sort memory. The words are not the product's. The translation is still useful if you label it as a translation. The session log, before you commit it, is the episodic scratchpad. Extracted events and preferences are what people mean by long-term memory. Skills are the procedural drawer. Resources overlap the knowledge drawer more than they overlap memory. Use the analogy in a design review if it helps. Do not grep the docs for "episodic" and conclude the feature is missing.

The other correction: OpenViking is not a vector database you threw away. The storage doc splits content (AGFS, their filesystem layer) from a vector index that stores URIs and vectors, not the file body. Retrieval can be semantic. Reading is still "open this path." Directories carry summaries. L0 is an abstract, L1 an overview, L2 the source. The agent is supposed to scan labels and open one file, not inhale the tree.

Their README reports a LoCoMo user-memory result: integrations landing around 80 to 83 percent, up from roughly 24 to 57 percent on native memory, with large token and latency drops. That is the project's number. I did not re-run it. Treat it as a claim on the tin, not as your benchmark.

```text
viking://resources/decisions/web-search
viking://user/{user}/memories/events/2026-09-25-proxy-scoped
viking://user/{user}/memories/preferences/tone
viking://agent/skills/cite-the-file
```

{% include drawers/memory.html %}

## The floor manager, not the filing cabinet

LangChain is a box of adapters. Loaders, retrievers, model calls. Useful when you want one style of code across a lot of vendors. Skippable when you are reading three files and calling one model. Importing it does not give you judgment.

LangGraph is the piece that can go backwards. State lives on the graph. Edges can branch. A node is allowed to run again. You want that the moment some step may say "this isn't enough." If the agent does one tool call and answers, you already have an orchestrator. The browser bot in that September post is the whole thing. Hauling in a graph library so the architecture slide looks finished is how small systems get heavy.

The hybrid people describe is a design, not a product you install. Nothing ships as "the stack." A graph can read the rulebook at the start of the session, query OpenViking, open an OKF file by path, and run a vector search for the messy pile. The grade node is the one that earns the dependency. Without it you have a parade.

```python
# Sketch of the back edge. Not a full integration.
def grade(state):
    state["enough"] = any("status: scoped" in note for note in state["notes"])
    return state

def route(state):
    return END if state["enough"] else "read_decision_again"
```

{% include drawers/loop.html %}

## One question, all four drawers

Picture a new teammate on a Monday, except the teammate is the agent. You do not hand them the company drive. You hand them the house rules, the decision log, and a notebook. If that still is not enough, they search the archive, then they come back and say what they found before they guess.

The question on the table: did we already ship web search for the portfolio bot?

{% include drawers/walk.html %}

## Same loop, smaller, for a product trio

A BA, a PO, and a PM sharing one discovery loop already know this shape. They just rarely file it where an agent can open it on Thursday.

The rulebook is the trio's definition of evidence. A slide is not a decision. A hunch is not an interview. The curated drawer is the opportunity note or the ADR: one markdown file, a status, a date, a link to the conversation that changed it. The notebook is what the last few customer conversations actually moved, so you do not re-derive last week's argument from whoever talks loudest in the standup. The back edge is build, measure, learn. If the note and the newest conversation disagree, you update the file or you stop. You do not ship the story that sounds smoother.

A loop that cannot end in "we were wrong" is a pipeline with extra boxes. That is as true for a sprint as it is for LangGraph.

## Which drawer to open

If you only keep one table from this, keep this one. The middle column is the job. The right column is the confident mistake.

| You need | Open | Not |
| --- | --- | --- |
| How to behave in this repo | `AGENTS.md`, short | A vector chunk of the README |
| Claude-only notes | `CLAUDE.md` that imports `AGENTS.md` | A second full copy |
| A fact with an owner and a status | An OKF file | Whatever ranked nearest |
| A pile of docs, tickets, PDFs | RAG | Hand-linking four thousand files |
| What this person prefers, what happened last session | OpenViking memory, after a commit | The chat tab you closed |
| A procedure worth repeating | A skill file | Hoping the model remembers the steps |
| Branching, retries, a refusal | LangGraph, or any explicit loop | A single linear chain |
| One tool call in a browser | The tool-calling loop you already have | A graph library |

## What I'd actually do

1. Write `AGENTS.md` as the real rulebook. If Claude needs an extra note, import the shared file. Don't maintain two constitutions.
2. Put any fact you will not tolerate the model inventing into a small markdown file with a type and a status. Link it from an index. That is the whole OKF idea.
3. Leave the unstructured pile in RAG, and say so in the rulebook. Retrieved text is evidence.
4. Commit sessions into a context store if the agent must know a person across conversations. OpenViking fits when you want that store to look like folders.
5. Add a back edge only when a grade step is allowed to fail. Otherwise keep the loop you can read in one screen.

## What's verified, what's a translation

High means I checked a primary page, or several independent write-ups of a named release. Medium means I am passing on the project's own number, or a detail I would re-read before betting a design on it. "Don't say this" means the tidy version was wrong.

| Claim | Confidence | Why |
| --- | --- | --- |
| AGENTS.md is stewarded by the Agentic AI Foundation under the Linux Foundation. | High | Stated on agents.md. Markdown, no required fields. |
| Claude Code 2.1.277 reads AGENTS.md only when CLAUDE.md is absent. If both exist, CLAUDE.md wins. | High | Claude Code team announcement, reported 18–19 Sep 2026. Not on Bedrock, Vertex, or Foundry in those notes. I did not re-quote Anthropic's raw changelog. |
| A symlink or an `@AGENTS.md` import keeps one rulebook. | High | Both are long-standing Claude Code workarounds. The import is the one that still lets you add Claude-only lines. |
| OKF was introduced 12 Jun 2026. v0.2's only required frontmatter key is `type`. | High | Google Cloud blog for the date and authors. `SPEC.md` for the required key and for `sources`, `generated`, `verified`, `status`, `stale_after`. |
| OKF links are a typed knowledge graph you can query. | Don't say this | Links are markdown links. The relationship kind lives in the prose. There is no required SDK. |
| OpenViking is a context database with `viking://`, and context is resources, memories, and skills. | High | docs.openviking.ai, checked Sep 2026. Memory subtypes include profile, preferences, entities, events, identity, and soul. |
| OpenViking's memory model is episodic versus semantic. | Translation | Useful analogy. Not the vocabulary in the docs. Skills are the procedural piece. |
| OpenViking replaces the vector database. | Don't say this | Storage docs describe AGFS for content plus a vector index of URIs. L0, L1, and L2 are how you avoid reading everything. |
| LoCoMo accuracy of about 80–83% with large token savings. | Medium | Printed in the OpenViking README. Not reproduced for this essay. |
| LangGraph can cycle and branch on state. LangChain is optional plumbing. | High | That is the frameworks' actual split. The hybrid "stack" is a design, not a single install. |

## Citations & Further Reading

- [AGENTS.md](https://agents.md/) — format, stewardship, and the "README for agents" line.
- [Agentic AI Foundation](https://aaif.io/) — the foundation named on agents.md.
- [Claude Code adds an AGENTS.md fallback](https://devops.com/claude-code-adds-agents-md-fallback-cutting-instruction-file-sprawl/) — the 2.1.277 behavior, including the "both files" rule. Corroborated by Classmethod's 19 Sep 2026 notes.
- [Introducing the Open Knowledge Format](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing) — Google Cloud, 12 Jun 2026. McVeety and Hormati.
- [OKF SPEC.md](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md) — v0.2 required and optional frontmatter. This outranks the announcement if they differ.
- [OpenViking introduction](https://docs.openviking.ai/en/getting-started/01-introduction) — context database, `viking://`, resources, memories, skills.
- [OpenViking context types](https://docs.openviking.ai/en/concepts/02-context-types) — memory subtypes and who writes them.
- [OpenViking storage](https://docs.openviking.ai/en/concepts/05-storage) — AGFS plus a vector index. L0, L1, and L2.
- [OpenViking repository](https://github.com/volcengine/OpenViking) — where the LoCoMo figures are claimed.
- [LangGraph](https://github.com/langchain-ai/langgraph) — stateful graphs, cycles, the back edge in the sketch.
- [Web-grounded answers without a server]({{ site.baseurl }}{% link _posts/2026-09-25-web-grounded-chatbot-chrome-on-device-ai-cloudflare-worker.md %}) — the client-side chatbot this essay keeps using as the concrete case.
