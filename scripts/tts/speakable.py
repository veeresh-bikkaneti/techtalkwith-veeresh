"""Turn a Jekyll post into the blocks Listen Mode is allowed to read aloud.

Code fences, tables, diagrams, and Liquid includes are skipped. The spoken
form expands a few symbols so the player can line the audio up with the
rendered article. Keep these expansions in sync with assets/js/listen.js.
"""

from __future__ import annotations

import hashlib
import re
import unicodedata
from pathlib import Path

# Display-text expansions. Applied to both the spoken string and the DOM text.
_EMOJI = re.compile(
    "[\U0001F000-\U0001FAFF\U00002600-\U000027BF\U0000FE00-\U0000FE0F\U0000200D]+"
)


def expand_symbols(text: str) -> str:
    text = text.replace("\u2192", " to ").replace("\u21d2", " implies ")
    text = text.replace("\u2014", ", ").replace("\u2013", ", ").replace("\u2026", ". ")
    text = text.replace("&", " and ").replace("&nbsp;", " ")
    text = re.sub(r"\s&\s", " and ", text)
    text = text.replace("&", " and ")
    text = re.sub(r"(?<!\w)~(\d)", r"about \1", text)
    text = re.sub(r"(?<!\w)~(?!\w)", " about ", text)
    text = text.replace("%", " percent")
    text = re.sub(r"https?://\S+", " ", text)
    text = _EMOJI.sub(" ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def normalize(text: str) -> str:
    text = expand_symbols(text).lower().replace("'", "")
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return " ".join(text.split())


def _liquid(text: str) -> str:
    def link_repl(match: re.Match) -> str:
        name = Path(match.group(1)).name
        name = re.sub(r"\.md$", "", name)
        name = re.sub(r"^\d{4}-\d{2}-\d{2}-", "", name)
        return name.replace("-", " ")

    text = re.sub(r"\{%\s*link\s+(\S+)\s*%\}", link_repl, text)
    text = re.sub(r"\{%.*?%\}", " ", text, flags=re.S)
    text = re.sub(r"\{\{.*?\}\}", " ", text, flags=re.S)
    return text


def _inline(text: str) -> str:
    text = _liquid(text)
    text = re.sub(r"<!--.*?-->", " ", text, flags=re.S)
    text = re.sub(r"!\[([^\]]*)\]\([^)]*\)", " ", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"`([^`]*)`", r"\1", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"\1", text)
    text = re.sub(r"__([^_]+)__", r"\1", text)
    text = re.sub(r"(?<!\w)_([^_\n]+)_(?!\w)", r"\1", text)
    text = re.sub(r"~~([^~]+)~~", r"\1", text)
    return expand_symbols(text)


def _front_matter(raw: str) -> tuple[dict, str]:
    if not raw.startswith("---"):
        return {}, raw
    end = raw.find("\n---", 3)
    if end == -1:
        return {}, raw
    header = raw[3:end]
    body = raw[end + 4 :]
    meta: dict[str, str] = {}
    for line in header.splitlines():
        if ":" not in line or line.startswith(" ") or line.startswith("-"):
            continue
        key, value = line.split(":", 1)
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        value = value.replace('\\"', '"').replace("\\'", "'")
        meta[key.strip()] = value
    return meta, body.lstrip("\n")


def _is_table(line: str) -> bool:
    stripped = line.strip()
    if stripped.count("|") < 1:
        return False
    if stripped.startswith("|") or re.match(r"^\|?\s*:?-{3,}", stripped):
        return True
    return "|" in stripped and not stripped.startswith("```")


def _skip_html_block(lines: list[str], start: int) -> int:
    first = lines[start].strip()
    tag = re.match(r"^</?([a-zA-Z0-9]+)", first)
    if not tag:
        return start + 1
    name = tag.group(1).lower()
    if first.endswith("/>") or name in {"img", "br", "hr"}:
        return start + 1
    depth = 0
    i = start
    while i < len(lines):
        depth += len(re.findall(rf"<{name}\b", lines[i], flags=re.I))
        depth -= len(re.findall(rf"</{name}>", lines[i], flags=re.I))
        i += 1
        if depth <= 0:
            break
    return i


def extract_blocks(body: str) -> list[dict]:
    lines = body.splitlines()
    blocks: list[dict] = []
    i = 0
    paragraph: list[str] = []

    def flush_paragraph() -> None:
        if not paragraph:
            return
        text = _inline(" ".join(paragraph))
        paragraph.clear()
        if normalize(text):
            blocks.append({"kind": "p", "text": text})

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if stripped.startswith("```"):
            flush_paragraph()
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                i += 1
            i += 1
            continue

        if re.match(r"^<(table|figure|div|script|style|pre|svg|iframe)\b", stripped, re.I):
            flush_paragraph()
            i = _skip_html_block(lines, i)
            continue

        if stripped.startswith("<") and stripped.endswith(">") and not stripped.startswith("<a "):
            flush_paragraph()
            i += 1
            continue

        if _is_table(line):
            flush_paragraph()
            while i < len(lines) and (_is_table(lines[i]) or not lines[i].strip()):
                if not lines[i].strip() and i + 1 < len(lines) and not _is_table(lines[i + 1]):
                    break
                i += 1
            continue

        heading = re.match(r"^(#{1,4})\s+(.*)$", stripped)
        if heading:
            flush_paragraph()
            level = min(len(heading.group(1)), 4)
            text = _inline(heading.group(2))
            text = re.sub(r"\s+#+\s*$", "", text)
            if normalize(text):
                blocks.append({"kind": f"h{level}", "text": text})
            i += 1
            continue

        quote = re.match(r"^>\s?(.*)$", stripped)
        if quote:
            flush_paragraph()
            parts = [quote.group(1)]
            i += 1
            while i < len(lines) and re.match(r"^>\s?", lines[i].strip()):
                parts.append(re.sub(r"^>\s?", "", lines[i].strip()))
                i += 1
            text = _inline(" ".join(parts))
            if normalize(text):
                blocks.append({"kind": "quote", "text": text})
            continue

        item = re.match(r"^(?:[-*+]|\d+\.)\s+(.*)$", stripped)
        if item:
            flush_paragraph()
            parts = [item.group(1)]
            i += 1
            while i < len(lines):
                nxt = lines[i]
                if not nxt.strip():
                    break
                if re.match(r"^(?:[-*+]|\d+\.)\s+", nxt.strip()):
                    break
                if nxt.startswith((" ", "\t")) or nxt.strip().startswith(">"):
                    parts.append(nxt.strip().lstrip("> ").strip())
                    i += 1
                    continue
                break
            text = _inline(" ".join(parts))
            if normalize(text):
                blocks.append({"kind": "li", "text": text})
            continue

        if not stripped or stripped in {"---", "***", "___"}:
            flush_paragraph()
            i += 1
            continue

        paragraph.append(stripped)
        i += 1

    flush_paragraph()
    for index, block in enumerate(blocks):
        block["index"] = index
    return blocks


def extract_post(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8")
    meta, body = _front_matter(raw)
    blocks = []
    title = _inline(meta.get("title", "").replace("**", ""))
    if normalize(title):
        blocks.append({"kind": "h1", "text": title})
    blocks.extend(extract_blocks(body))
    for index, block in enumerate(blocks):
        block["index"] = index
    slug = re.sub(r"^\d{4}-\d{2}-\d{2}-", "", path.stem)
    joined = "\n".join(block["text"] for block in blocks)
    return {
        "slug": slug,
        "title": title,
        "source": str(path),
        "blocks": blocks,
        "contentHash": hashlib.sha256(joined.encode("utf-8")).hexdigest(),
    }


def content_hash(blocks: list[dict]) -> str:
    joined = "\n".join(block["text"] for block in blocks)
    return hashlib.sha256(joined.encode("utf-8")).hexdigest()
