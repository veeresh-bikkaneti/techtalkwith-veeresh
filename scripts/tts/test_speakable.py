"""Extractor checks. No model, no network."""

import unittest
from pathlib import Path

from speakable import expand_symbols, extract_blocks, extract_post, normalize

ROOT = Path(__file__).resolve().parents[2]
POSTS = ROOT / "_posts"


class SpeakableTests(unittest.TestCase):
    def test_symbol_expansion_matches_the_player_contract(self):
        self.assertEqual(normalize("cost is ~0 & rising 20%"), "cost is about 0 and rising 20 percent")
        self.assertEqual(expand_symbols("A & B"), "A and B")
        kept = extract_blocks("Keep the `page_obj` name and the _word_ emphasis.")
        self.assertIn("page_obj", kept[0]["text"])
        self.assertIn("word", kept[0]["text"])
        self.assertNotIn("_word_", kept[0]["text"])

    def test_short_post_skips_code_and_tables(self):
        post = extract_post(POSTS / "2026-06-15-playwright-vs-selenium-2026.md")
        blob = "\n".join(block["text"] for block in post["blocks"])
        self.assertEqual(post["slug"], "playwright-vs-selenium-2026")
        self.assertTrue(post["blocks"][0]["kind"] == "h1")
        self.assertIn("Playwright vs Selenium", post["blocks"][0]["text"])
        self.assertIn("After spending years with Selenium", blob)
        self.assertIn("Legacy codebases", blob)
        self.assertIn("Playwright", blob)
        self.assertNotIn("playwright.dev", blob)
        self.assertNotIn("NewPageAsync", blob)
        self.assertNotIn("login-button", blob)
        self.assertNotIn("Appium", blob)
        kinds = {block["kind"] for block in post["blocks"]}
        self.assertIn("li", kinds)
        self.assertIn("h2", kinds)

    def test_includes_and_fences_stay_out_of_the_four_drawers_post(self):
        post = extract_post(POSTS / "2026-09-29-four-drawers-one-agent.md")
        blob = "\n".join(block["text"] for block in post["blocks"])
        self.assertNotIn("drawers/map.html", blob)
        self.assertNotIn("data-drawers", blob)
        self.assertNotIn("def grade", blob)
        self.assertIn("rulebook is not memory", blob.lower())
        self.assertGreater(len(post["blocks"]), 8)


if __name__ == "__main__":
    unittest.main()
