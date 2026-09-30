# Listen Mode

Every post has a Listen button. Nothing plays until you press it.

If `audio/<slug>/us/narration.opus` (or `uk`) is in the repo, you hear a Kokoro voice and the word being spoken is highlighted from the audio clock. Pause, the seek bar, and the speed buttons stay in sync because the highlight reads `audio.currentTime`, not a timer. US, UK, and Auto are remembered in this browser.

If that file is missing, or you picked an accent that has not been synthesized, the browser reads the article with its own voice. Highlighting then follows sentences when the browser reports them, and the paragraph otherwise. Leaving the page stops both.

The floating button sits above the chat launcher. It uses the same play/pause state as the button at the top of the article.

## Regenerate narration

From the repo root, on a machine with the CPU toolchain:

```bash
pip install torch==2.6.0+cpu --index-url https://download.pytorch.org/whl/cpu --extra-index-url https://pypi.org/simple
pip install -r scripts/tts/requirements.txt
python3 scripts/tts/synthesize.py --voice af_heart --only-missing
python3 scripts/tts/synthesize.py --voice bf_emma --only-missing
python3 scripts/tts/validate.py --strict-coverage
```

`af_heart` writes `audio/<slug>/us/`. `bf_emma` writes `audio/<slug>/uk/`. The first run downloads `hexgrad/Kokoro-82M` and the voice packs. Later runs should set `HF_HUB_OFFLINE=1` so a missing cache fails instead of reaching the network.

The toolchain used for the committed audio is torch 2.6.0+cpu, kokoro 0.9.4, soundfile 0.14.0, ffmpeg libopus at 24 kbps. Weights stay in the Hugging Face cache. Do not commit `*.wav`. Commit opus and json a few articles at a time, and only after that article has finished writing.

`scripts/tts/synthesize_all.sh` runs one article per process. That is the batch to use. A single long-lived Kokoro process grows until a small machine kills it.

`scripts/tts/test_speakable.py` checks the extractor. `node scripts/tts/verify_player.mjs` loads a fixture article in headless Chromium, presses play, and checks that the highlight moves with the clock. It also checks the browser-voice path when the manifest is absent.

Audio URLs are rooted at `site.baseurl` (`/techtalkwith-veeresh` on GitHub Pages). The player resolves `narration.opus` relative to the manifest response, so the subpath is included.
