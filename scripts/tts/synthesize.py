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


def synthesize_post(pipeline, post: dict, voice: str, accent: str, dest: Path) -> None:
    import soundfile as sf

    dest.mkdir(parents=True, exist_ok=True)
    wav_path = dest / "narration.wav"
    opus_path = dest / "narration.opus"
    json_path = dest / "narration.json"
    chunks_audio: list[np.ndarray] = []
    blocks_out = []
    cursor = 0.0

    for block in post["blocks"]:
        pieces = _sentences(block["text"])
        block_words = []
        block_start = cursor
        for piece in pieces:
            result = None
            for result in pipeline(piece, voice=voice, speed=1):
                audio = result.audio
                if audio is None:
                    continue
                samples = audio.detach().cpu().numpy().astype(np.float32)
                block_words.extend(_word_times(result, cursor))
                chunks_audio.append(samples)
                cursor += samples.shape[0] / SAMPLE_RATE
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
        gap = np.zeros(int(GAP_SECONDS * SAMPLE_RATE), dtype=np.float32)
        chunks_audio.append(gap)
        cursor += GAP_SECONDS

    if not chunks_audio:
        raise RuntimeError("no audio produced")
    audio = np.concatenate(chunks_audio)
    # Drop the trailing gap so the file ends on the last word.
    trail = int(GAP_SECONDS * SAMPLE_RATE)
    if audio.shape[0] > trail:
        audio = audio[:-trail]
        cursor -= GAP_SECONDS
    duration = round(float(audio.shape[0] / SAMPLE_RATE), 3)
    sf.write(wav_path, audio, SAMPLE_RATE)
    del audio
    import subprocess

    proc = subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-i",
            str(wav_path),
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
    )
    wav_path.unlink(missing_ok=True)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or "ffmpeg failed")
    manifest = {
        "slug": post["slug"],
        "voice": voice,
        "accent": accent,
        "sampleRate": SAMPLE_RATE,
        "duration": duration,
        "contentHash": post["contentHash"],
        "blocks": blocks_out,
        "audio": "narration.opus",
        "generator": "kokoro-0.9.4",
    }
    json_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


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

    os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
    import torch
    torch.set_grad_enabled(False)
    torch.set_num_threads(2)
    from kokoro import KPipeline

    print(f"loading Kokoro lang={lang} voice={args.voice}", flush=True)
    pipeline = KPipeline(lang_code=lang, repo_id="hexgrad/Kokoro-82M")
    failed = []
    done = 0
    for path in posts:
        post = extract_post(path)
        dest = Path(args.out) / post["slug"] / accent
        if args.only_missing and _already_done(dest):
            print(f"skip {post['slug']} {accent}", flush=True)
            continue
        print(f"speak {post['slug']} {accent} blocks={len(post['blocks'])}", flush=True)
        try:
            synthesize_post(pipeline, post, args.voice, accent, dest)
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
    raise SystemExit(main())
