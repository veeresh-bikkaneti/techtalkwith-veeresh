import { test, expect } from '@playwright/test';
import { LocalFixtures } from '../../pages/LocalFixtures';
import { StripedTablePage } from '../../pages/StripedTablePage';

// ───────────────────────────────────────────────────────────────────────
// Appendix Scenario 2 — Dynamic striped table: A4 + B3 + D8 + F5
// Source: local fixture `fixtures/striped-table.html` (mirrors the appendix's DOM)
// 4 body rows, 4th cell = Status with mixed-case data + class attr encoding state
// Inside <tbody>:
//   row 1 (Smith)  — odd,  class="status status-open",  text="OPEN"  → match
//   row 2 (Bach)   — even, class="status status-closed", text="Closed" → skip
//   row 3 (Doe)    — odd,  class="status status-open",  text="Open"  → match
//   row 4 (Conway) — even, class="status status-closed", text="Closed" → skip
// ───────────────────────────────────────────────────────────────────────

test.describe('Appendix Scenario 2 — Dynamic striped table (A4 + B3 + D8 + F5)', () => {
  test('B3: tr:nth-child(odd) selects rows 1 and 3 (Smith + Doe); even = rows 2 and 4', async ({ page }) => {
    const lf = new LocalFixtures(page);
    const st = new StripedTablePage(page);
    await lf.gotoStripedTable();
    // B3 verifies the 1-indexed odd/even arithmetic inside <tbody>
    expect(await st.oddRows.count()).toBe(2);
    expect(await st.evenRows.count()).toBe(2);
  });

  test('A4 + D8: td:nth-child(4)[class*="open" i] matches Smith + Doe status cells (case-insensitive)', async ({ page }) => {
    const lf = new LocalFixtures(page);
    const st = new StripedTablePage(page);
    await lf.gotoStripedTable();
    // 2 odd rows × 1 status cell each = 2 matches
    expect(await st.oddOpenStatusCells.count()).toBe(2);
    // Sanity: the matched cells all carry the status-open class
    const texts = await st.oddOpenCellTexts();
    for (const t of texts) {
      expect(t.toLowerCase()).toMatch(/open/i);
    }
  });

  test('A4 XPath form: translate() returns 2 matches (text-based — Conway now has text "Closed", matching class)', async ({ page }) => {
    const lf = new LocalFixtures(page);
    await lf.gotoStripedTable();
    // XPath 1.0 case-insensitive text match — must NOT use lower-case()
    // (WebDriver silently fails on XPath 2.0+ functions per cheatsheet §4⚠️)
    // Conway's 4th cell now reads "Closed" (class="status-closed"), so
    // translate("Closed", 'A..Z', 'a..z') = "closed" ≠ "open" → skip.
    // 2 rows match: Smith (OPEN) and Doe (Open). Bach (Closed) and Conway (Closed) are skipped.
    const xpath =
      "//table//tbody/tr[td[translate(normalize-space(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = 'open']]";
    const matches = page.locator(xpath);
    expect(await matches.count()).toBe(2);
  });

  test('B3 XPath form: position() mod 2 = 1 returns 2 matches (1-indexed odd rows)', async ({ page }) => {
    const lf = new LocalFixtures(page);
    await lf.gotoStripedTable();
    const matches = page.locator('//table//tbody/tr[position() mod 2 = 1]');
    expect(await matches.count()).toBe(2);
  });

  test('F5 engine form: getByRole + filter({ hasText: /open/i }) returns 2 rows (text-based — Conway now "Closed")', async ({ page }) => {
    const lf = new LocalFixtures(page);
    const st = new StripedTablePage(page);
    await lf.gotoStripedTable();
    // Conway's 4th cell is now "Closed", so /open/i no longer matches.
    // 2 rows: Smith (OPEN) and Doe (Open).
    const texts = await st.oddOpenRowTexts();
    expect(texts.length).toBe(2);
    for (const t of texts) {
      expect(t.toLowerCase()).toContain('open');
    }
  });

  test('D8 negative: Conway (row 4) Status cell class is "status-closed" and text is "Closed"', async ({ page }) => {
    const lf = new LocalFixtures(page);
    await lf.gotoStripedTable();
    // Conway's Status cell — 4th child of 4th body row
    const conwayStatus = page.locator('table tbody tr:nth-child(4) td:nth-child(4)');
    const cls = (await conwayStatus.getAttribute('class')) ?? '';
    expect(cls).toContain('status-closed');
    // Class and text are now consistent — both say "Closed"
    expect(cls.toLowerCase()).not.toContain('open');
    await expect(conwayStatus).toHaveText('Closed');
  });
});
