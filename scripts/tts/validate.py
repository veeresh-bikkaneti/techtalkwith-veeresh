"""Check narration.json against its Opus file and, when asked, the post source."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from speakable import extract_post  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
REQUIRED = ("slug", "voice", "accent", "sampleRate", "duration", "contentHash", "blocks", "audio")


def _probe_duration(path: Path) -> float:
    ffmpeg = "ffmpeg"
    proc = subprocess.run(
        [ffmpeg, "-i", str(path), "-f", "null", "-"],
        check=False,
        capture_output=True,
        text=True,
    )
    blob = (proc.stderr or "") + (proc.stdout or "")
    import re

    match = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", blob)
    if not match:
        raise RuntimeError(blob.strip().splitlines()[-1] if blob.strip() else f"could not read duration of {path}")
    hours, minutes, seconds = match.groups()
    return int(hours) * 3600 + int(minutes) * 60 + float(seconds)


def validate_pair(manifest_path: Path, posts: Path, check_hash: bool) -> list[str]:
    errors = []
    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    for key in REQUIRED:
        if key not in data:
            errors.append(f"missing {key}")
    audio = manifest_path.parent / data.get("audio", "narration.opus")
    if not audio.is_file():
        errors.append(f"missing audio {audio.name}")
        return errors
    try:
        heard = _probe_duration(audio)
    except Exception as exc:
        errors.append(str(exc))
        return errors
    stated = float(data.get("duration") or 0)
    if abs(heard - stated) > 1.25:
        errors.append(f"duration mismatch manifest={stated:.2f} audio={heard:.2f}")
    last_end = 0.0
    for block in data.get("blocks") or []:
        start = float(block.get("start", 0))
        end = float(block.get("end", 0))
        if end + 0.05 < start:
            errors.append(f"block {block.get('index')} ends before it starts")
        prev = -1.0
        for word in block.get("words") or []:
            wstart = float(word["start"])
            wend = float(word["end"])
            if wstart < prev - 0.02 or wend + 0.02 < wstart:
                errors.append(f"non-monotonic word in block {block.get('index')}: {word.get('text')}")
                break
            prev = wstart
            last_end = max(last_end, wend)
        if block.get("words"):
            if float(block["words"][0]["start"]) + 0.05 < start:
                errors.append(f"block {block.get('index')} starts after its first word")
    if last_end > stated + 0.35:
        errors.append(f"last word {last_end:.2f}s is past duration {stated:.2f}s")
    if data.get("accent") and manifest_path.parent.name != data["accent"]:
        errors.append(f"accent dir {manifest_path.parent.name} != {data['accent']}")
    if check_hash:
        matches = list(posts.glob(f"*-{data.get('slug')}.md"))
        if not matches:
            errors.append(f"no post for slug {data.get('slug')}")
        else:
            post = extract_post(matches[0])
            if post["contentHash"] != data.get("contentHash"):
                errors.append("contentHash is stale against the post")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", default=str(ROOT / "audio"))
    parser.add_argument("--posts", default=str(ROOT / "_posts"))
    parser.add_argument("--no-hash", action="store_true")
    parser.add_argument("--strict-coverage", action="store_true", help="fail if any post lacks us and uk")
    args = parser.parse_args()
    audio = Path(args.audio)
    posts = Path(args.posts)
    manifests = sorted(audio.glob("*/*/narration.json"))
    bad = 0
    for path in manifests:
        errors = validate_pair(path, posts, check_hash=not args.no_hash)
        if errors:
            bad += 1
            print(f"FAIL {path.parent.relative_to(audio)}: {'; '.join(errors)}")
        else:
            print(f"ok {path.parent.relative_to(audio)}")
    if args.strict_coverage:
        slugs = {path.stem[11:] for path in posts.glob("*.md")}
        for slug in sorted(slugs):
            for accent in ("us", "uk"):
                if not (audio / slug / accent / "narration.json").is_file():
                    bad += 1
                    print(f"FAIL {slug}/{accent}: missing narration")
    print(f"manifests={len(manifests)} failed={bad}")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
