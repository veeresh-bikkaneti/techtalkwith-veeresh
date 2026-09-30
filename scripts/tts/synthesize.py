"""Synthesize neural narration with Kokoro-82M. CPU only.

One article, one accent:

    python3 scripts/tts/synthesize.py --voice af_heart --only four-drawers-one-agent

Resume a batch without rewriting files that already exist:

    HF_HUB_OFFLINE=1 python3 scripts/tts/synthesize.py --voice bf_emma --only-missing

Voices: af_heart -> audio/<slug>/us/, bf_emma -> audio/<slug>/uk/.
Failures are logged. The process exits nonzero if any article failed.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import traceback
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from speakable import extract_post  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
VOICES = {
    "af_heart": ("a", "us"),
    "bf_emma": ("b", "uk"),
}
SAMPLE_RATE = 24000
GAP_SECONDS = 0.22


def _sentences(text: str, limit: int = 420) -> list[str]:
    import re

    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    chunks: list[str] = []
    buf = ""
    for part in parts:
        piece = part.strip()
        if not piece:
            continue
        if buf and len(buf) + 1 + len(piece) > limit:
            chunks.append(buf)
            buf = piece
        else:
            buf = f"{buf} {piece}".strip()
        while len(buf) > limit:
            cut = buf.rfind(" ", 0, limit)
            if cut < 40:
                cut = limit
            chunks.append(buf[:cut].strip())
            buf = buf[cut:].strip()
    if buf:
        chunks.append(buf)
    return chunks


def _word_times(result, offset: float) -> list[dict]:
    words = []
    tokens = result.tokens or []
    for token in tokens:
        raw = (getattr(token, "text", "") or "").strip()
        start = getattr(token, "start_ts", None)
        end = getattr(token, "end_ts", None)
        if start is None or end is None:
            continue
        words.append(
            {
                "text": raw,
                "start": round(offset + float(start), 3),
                "end": round(offset + float(end), 3),
            }
        )
    return words


def _rss_mb() -> int:
    try:
        for line in Path("/proc/self/status").read_text(encoding="utf-8").splitlines():
            if line.startswith("VmRSS:"):
                return int(line.split()[1]) // 1024
    except OSError:
        return 0
    return 0


def _release() -> None:
    import gc

    gc.collect()
    try:
        import ctypes

        ctypes.CDLL("libc.so.6").malloc_trim(0)
    except OSError:
        pass


def render_blocks(pipeline, blocks: list, voice: str, raw) -> tuple[list, int]:
    """Speak these blocks into an open f32le file. Times start at 0."""
    gap = np.zeros(int(GAP_SECONDS * SAMPLE_RATE), dtype=np.float32)
    cursor = 0.0
    total = 0
    blocks_out = []
    for block in blocks:
        pieces = _sentences(block["text"])
        block_words = []
        block_start = cursor
        for piece in pieces:
            result = None
            for result in pipeline(piece, voice=voice, speed=1):
                audio = result.audio
                if audio is None:
                    continue
                samples = np.ascontiguousarray(
                    audio.detach().cpu().numpy().astype(np.float32, copy=False)
                )
                raw.write(samples.tobytes())
                total += int(samples.shape[0])
                block_words.extend(_word_times(result, cursor))
                cursor += samples.shape[0] / SAMPLE_RATE
                del samples
                del audio
            del result
        if block_words:
            block_end = block_words[-1]["end"]
        else:
            block_end = cursor
        blocks_out.append(
            {
                "index": block["index"],
                "kind": block["kind"],
                "text": block["text"],
                "start": round(block_start, 3),
                "end": round(max(block_end, block_start), 3),
                "words": block_words,
            }
        )
        raw.write(gap.tobytes())
        total += int(gap.shape[0])
        cursor += GAP_SECONDS
        _release()
    return blocks_out, total


def worker() -> int:
    job = json.loads(sys.stdin.read())
    os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
    os.environ.setdefault("HF_HUB_OFFLINE", "1")
    import torch

    torch.set_grad_enabled(False)
    torch.set_num_threads(2)
    from kokoro import KPipeline

    pipeline = KPipeline(lang_code=job["lang"], repo_id="hexgrad/Kokoro-82M")
    raw_path = Path(job["raw"])
    with raw_path.open("wb") as raw:
        blocks_out, total = render_blocks(pipeline, job["blocks"], job["voice"], raw)
    Path(job["meta"]).write_text(
        json.dumps({"blocks": blocks_out, "samples": total}),
        encoding="utf-8",
    )
    print(
        f"worker blocks={len(blocks_out)} samples={total} rss={_rss_mb()}MB",
        flush=True,
    )
    return 0


def _run_chunk(lang: str, voice: str, blocks: list) -> tuple[Path, dict]:
    import subprocess
    import tempfile

    raw_file = tempfile.NamedTemporaryFile(prefix="narration-part-", suffix=".f32", delete=False)
    meta_file = tempfile.NamedTemporaryFile(prefix="narration-part-", suffix=".json", delete=False)
    raw_path = Path(raw_file.name)
    meta_path = Path(meta_file.name)
    raw_file.close()
    meta_file.close()
    job = {
        "lang": lang,
        "voice": voice,
        "blocks": blocks,
        "raw": str(raw_path),
        "meta": str(meta_path),
    }
    env = os.environ.copy()
    env["HF_HUB_OFFLINE"] = "1"
    env["HF_HUB_DISABLE_TELEMETRY"] = "1"
    proc = subprocess.run(
        [sys.executable, str(Path(__file__).resolve()), "--worker"],
        input=json.dumps(job),
        text=True,
        capture_output=True,
        env=env,
    )
    if proc.stdout:
        print(proc.stdout, end="" if proc.stdout.endswith("\n") else "\n", flush=True)
    if proc.returncode != 0:
        raw_path.unlink(missing_ok=True)
        meta_path.unlink(missing_ok=True)
        detail = (proc.stderr or "").strip()
        raise RuntimeError(detail[-1500:] or f"worker exit {proc.returncode}")
    data = json.loads(meta_path.read_text(encoding="utf-8"))
    meta_path.unlink(missing_ok=True)
    return raw_path, data


def synthesize_post(post: dict, voice: str, accent: str, dest: Path, lang: str) -> None:
    import subprocess
    import tempfile

    dest.mkdir(parents=True, exist_ok=True)
    opus_path = dest / "narration.opus"
    json_path = dest / "narration.json"
    blocks = post["blocks"]
    if not blocks:
        raise RuntimeError("no speakable text")

    parts: list[tuple[Path, dict]] = []
    start = 0
    width = 4
    try:
        while start < len(blocks):
            end = min(start + width, len(blocks))
            print(
                f"  {post['slug']} {accent} blocks {start + 1}-{end}/{len(blocks)}",
                flush=True,
            )
            try:
                parts.append(_run_chunk(lang, voice, blocks[start:end]))
            except RuntimeError as exc:
                if end - start <= 1:
                    raise
                width = max(1, (end - start) // 2)
                print(f"  retry smaller chunk ({width}): {exc}", flush=True)
                continue
            start = end
            width = 4

        combined = tempfile.NamedTemporaryFile(prefix="narration-", suffix=".f32", delete=False)
        combined_path = Path(combined.name)
        combined.close()
        merged = []
        total = 0
        try:
            with combined_path.open("wb") as out:
                for raw_path, data in parts:
                    out.write(raw_path.read_bytes())
                    shift = total / SAMPLE_RATE
                    for block in data["blocks"]:
                        block["start"] = round(block["start"] + shift, 3)
                        block["end"] = round(block["end"] + shift, 3)
                        for word in block["words"]:
                            word["start"] = round(word["start"] + shift, 3)
                            word["end"] = round(word["end"] + shift, 3)
                        merged.append(block)
                    total += int(data["samples"])
                    raw_path.unlink(missing_ok=True)
            gap = int(GAP_SECONDS * SAMPLE_RATE)
            if total <= gap:
                raise RuntimeError("no audio produced")
            total -= gap
            with combined_path.open("r+b") as raw:
                raw.truncate(total * 4)
            duration = round(total / SAMPLE_RATE, 3)
            proc = subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-loglevel",
                    "error",
                    "-f",
                    "f32le",
                    "-ar",
                    str(SAMPLE_RATE),
                    "-ac",
                    "1",
                    "-i",
                    str(combined_path),
                    "-c:a",
                    "libopus",
                    "-b:a",
                    "24k",
                    "-vbr",
                    "on",
                    str(opus_path),
                ],
                check=False,
                capture_output=True,
                text=True,
                stdin=subprocess.DEVNULL,
            )
            if proc.returncode != 0:
                opus_path.unlink(missing_ok=True)
                raise RuntimeError(proc.stderr.strip() or "ffmpeg failed")
            manifest = {
                "slug": post["slug"],
                "voice": voice,
                "accent": accent,
                "sampleRate": SAMPLE_RATE,
                "duration": duration,
                "contentHash": post["contentHash"],
                "blocks": merged,
                "audio": "narration.opus",
                "generator": "kokoro-0.9.4",
            }
            json_path.write_text(
                json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
        finally:
            combined_path.unlink(missing_ok=True)
    finally:
        for raw_path, _data in parts:
            raw_path.unlink(missing_ok=True)


def _already_done(dest: Path) -> bool:
    return (dest / "narration.opus").is_file() and (dest / "narration.json").is_file()


def main() -> int:
    parser = argparse.ArgumentParser(description="Kokoro narration for Jekyll posts")
    parser.add_argument("--posts", default=str(ROOT / "_posts"))
    parser.add_argument("--out", default=str(ROOT / "audio"))
    parser.add_argument("--voice", default="af_heart", choices=sorted(VOICES))
    parser.add_argument("--only", action="append", default=[], help="slug to synthesize (repeatable)")
    parser.add_argument("--only-missing", action="store_true")
    parser.add_argument("--limit", type=int, default=0, help="stop after N articles (0 = all)")
    args = parser.parse_args()

    lang, accent = VOICES[args.voice]
    posts = sorted(Path(args.posts).glob("*.md"), key=lambda path: path.stat().st_size)
    if args.only:
        wanted = set(args.only)
        posts = [path for path in posts if path.stem[11:] in wanted or path.stem in wanted]
    if args.limit:
        posts = posts[: args.limit]

    pending = []
    for path in posts:
        post = extract_post(path)
        dest = Path(args.out) / post["slug"] / accent
        if args.only_missing and _already_done(dest):
            print(f"skip {post['slug']} {accent}", flush=True)
            continue
        pending.append((post, dest))
    if not pending:
        print(f"synthesized=0 failed=0 accent={accent}", flush=True)
        return 0

    os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
    failed = []
    done = 0
    for post, dest in pending:
        print(f"speak {post['slug']} {accent} blocks={len(post['blocks'])}", flush=True)
        try:
            synthesize_post(post, args.voice, accent, dest, lang)
            done += 1
            print(f"wrote {dest / 'narration.opus'}", flush=True)
        except Exception:
            failed.append(post["slug"])
            print(f"FAIL {post['slug']}", flush=True)
            traceback.print_exc()
    print(f"synthesized={done} failed={len(failed)} accent={accent}", flush=True)
    if failed:
        print("failed slugs: " + ", ".join(failed), flush=True)
        return 1
    return 0


if __name__ == "__main__":
    if "--worker" in sys.argv:
        raise SystemExit(worker())
    raise SystemExit(main())
