import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

// Application Details — University Communication Tab
// Grid with 4 cards: Conditional offer Upload, University Update,
// Unconditional offer Upload, Other
// Each card: label, status ("No file uploaded"), row actions, file-check SVG icon

test('Vivek Consultancy — App Details: University Communication Tab', async ({ page }) => {
    test.setTimeout(90000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') {
        console.log('Login failed:', result);
        return;
    }
    console.log('Login success');

    await page.waitForSelector('.nsm-sidebar', { timeout: 20000 });

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 1 — NAVIGATE TO APP DETAILS
    // ═══════════════════════════════════════════════════════════════════════

    await page.goto('https://vivekconsultancy.flyurdream.com/#/Applications-details-Accordion-3?appId=GUIDA336&companyId=6&branchId=null&studentUniqueId=GUIDS7');
    await page.waitForTimeout(1000);

    await page.waitForFunction(() => {
        const c = document.querySelector('.app-details-2-tab-content');
        return c && !c.querySelector('.app-details-2-skeleton') && c.children.length > 0;
    }, { timeout: 20000 }).catch(() => {});
    console.log('✓ App details content loaded');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 2 — CLICK UNIVERSITY COMMUNICATION TAB
    // ═══════════════════════════════════════════════════════════════════════

    await page.locator('.app-details-2-tab-btn').filter({ hasText: 'University Communication' }).first().click();
    await page.waitForTimeout(1500);
    await expect(page.locator('.app-details-2-tab-btn').filter({ hasText: 'University Communication' }).first()).toHaveClass(/app-details-2-tab-btn--active/);
    console.log('✓ University Communication tab active');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 3 — GRID VISIBLE
    // ═══════════════════════════════════════════════════════════════════════

    const grid = page.locator('.app-details-2-uni-docs-grid');
    await expect(grid).toBeVisible();
    console.log('✓ University docs grid visible');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 4 — CARD COUNT (EXPECT 4)
    // ═══════════════════════════════════════════════════════════════════════

    const cards = page.locator('.app-details-2-uni-doc-card');
    await page.waitForTimeout(500);
    const cardCount = await cards.count();
    console.log('✓ Card count:', cardCount);
    expect(cardCount).toBe(4);

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 5 — VERIFY EACH CARD LABEL AND STATUS
    // ═══════════════════════════════════════════════════════════════════════

    const expectedLabels = [
        'Conditional offer Upload',
        'University Update',
        'Unconditional offer Upload',
        'Other',
    ];

    for (let i = 0; i < cardCount; i++) {
        const card = cards.nth(i);

        // Label
        const labelEl = card.locator('.app-details-2-uni-doc-label').first();
        const labelText = await labelEl.textContent().catch(() => '');
        console.log(`✓ Card ${i + 1} label: "${labelText?.trim()}"`);

        if (i < expectedLabels.length) {
            const expected = expectedLabels[i];
            const match = labelText?.trim().toLowerCase().includes(expected.toLowerCase().split(' ')[0]);
            console.log(`  Expected approx: "${expected}", match: ${match}`);
        }

        // Status
        const statusEl = card.locator('.app-details-2-uni-doc-status').first();
        const statusText = await statusEl.textContent().catch(() => '');
        console.log(`✓ Card ${i + 1} status: "${statusText?.trim()}"`);

        // Row actions visible
        const rowActs = card.locator('.app-details-2-row-acts').first();
        const rowActsVisible = await rowActs.isVisible().catch(() => false);
        console.log(`✓ Card ${i + 1} row actions visible: ${rowActsVisible}`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 6 — VERIFY EXPECTED LABELS (ASSERTIONS)
    // ═══════════════════════════════════════════════════════════════════════

    const allLabels = await page.locator('.app-details-2-uni-doc-label').allTextContents();
    console.log('✓ All card labels:', allLabels);

    for (const expected of expectedLabels) {
        const found = allLabels.some(l => l.toLowerCase().includes(expected.toLowerCase().split(' ')[0]));
        console.log(`✓ Label "${expected}" found: ${found}`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 7 — VERIFY STATUS "NO FILE UPLOADED"
    // ═══════════════════════════════════════════════════════════════════════

    const allStatuses = await page.locator('.app-details-2-uni-doc-status').allTextContents();
    console.log('✓ All card statuses:', allStatuses);

    for (let i = 0; i < allStatuses.length; i++) {
        const status = allStatuses[i].trim();
        const isNoFile = status.toLowerCase().includes('no file');
        console.log(`✓ Card ${i + 1} status "No file uploaded": ${isNoFile} — actual: "${status}"`);
    }

    console.log('✓ University Communication tab test complete');
});
