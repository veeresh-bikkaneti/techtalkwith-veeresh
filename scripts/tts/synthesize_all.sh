#!/bin/bash
# One process per article. Kokoro's pipeline grows without bound if you
# leave it loaded, and a 4GB machine will kill the batch around article three.
set -u
cd "$(dirname "$0")/../.."
mkdir -p logs
slugs=$(python3 - << 'PY'
from pathlib import Path
posts = sorted(Path("_posts").glob("*.md"), key=lambda p: p.stat().st_size)
for path in posts:
    stem = path.stem
    print(stem[11:] if len(stem) > 11 and stem[10] == "-" else stem)
PY
)
for voice in af_heart bf_emma; do
  for slug in $slugs; do
    echo "BEGIN $voice $slug"
    if ! python3 scripts/tts/synthesize.py --voice "$voice" --only "$slug" --only-missing; then
      echo "FAIL $voice $slug"
    fi
    echo "END $voice $slug"
  done
done

echo "RETRY missing"
for voice in af_heart bf_emma; do
  for slug in $slugs; do
    echo "BEGIN $voice $slug"
    if ! python3 scripts/tts/synthesize.py --voice "$voice" --only "$slug" --only-missing; then
      echo "FAIL $voice $slug"
    fi
    echo "END $voice $slug"
  done
done
