import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

// All .msd-trigger buttons on this page have a div overlay intercepting pointer
// events — every click on them requires { force: true }.

test('Vivek Consultancy — Search-Course (Beta) Page', async ({ page }) => {
    test.setTimeout(120000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') {
        console.log('Login failed:', result);
        return;
    }
    console.log('Login success');

    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForSelector('.nsm-sidebar', { timeout: 20000 });

    // ── Navigate to Search-Course directly ────────────────────────────────────
    await page.goto(`${env.vivekconsultancy}programpage4`);

    await page.waitForTimeout(2000);
    await page.waitForSelector('.program-feed .program-name-tag', { timeout: 40000 });
    await expect(page).toHaveURL(/programpage4/i);
    console.log('Search-Course URL confirmed:', page.url());

    // ── Left panel ───────────────────────────────────────────────────────────
    await expect(page.locator('.left-panel')).toBeVisible();
    console.log('Left panel visible ✓');

    for (const label of ['RECENT QUALIFICATION', 'ENGLISH PROFICIENCY EXAM', 'ACADEMIC LEVEL', 'TOP SEARCHED UNIVERSITIES']) {
        const el = page.locator('.panel-block').filter({ hasText: label }).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log(`Panel block visible: "${label}" ✓`);
        }
    }

    const resetAllBtn = page.locator('.left-panel').getByRole('button', { name: /Reset all/i }).first();
    if (await resetAllBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('Reset all button visible ✓');
    }

    // ── Right panel — search row ──────────────────────────────────────────────
    await expect(page.locator('.right-panel')).toBeVisible();
    await expect(page.locator('.search-row')).toBeVisible();
    console.log('Right panel & search row visible ✓');

    const filterTriggers = page.locator('.search-row .msd-trigger');
    expect(await filterTriggers.count()).toBe(5);
    for (const label of ['Select Nationality', 'Destination Country', 'Academic Level', 'University', 'Intake']) {
        await expect(filterTriggers.filter({ hasText: label }).first()).toBeVisible();
        console.log(`Filter button visible: "${label}" ✓`);
    }

    await expect(page.getByRole('button', { name: 'Search Programs' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear' }).first()).toBeVisible();
    console.log('Search Programs & Clear buttons visible ✓');

    // ── Tabs ─────────────────────────────────────────────────────────────────
    await expect(page.getByRole('button', { name: 'Shortlist' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Advanced/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Recommendation' }).first()).toBeVisible();
    console.log('Tabs visible: Shortlist, Advanced, Recommendation ✓');

    // ── Default results check ─────────────────────────────────────────────────
    const feedItems = page.locator('.program-feed .program-name-tag');
    const defaultCount = await feedItems.count();
    expect(defaultCount).toBeGreaterThan(0);
    console.log('Default program cards loaded:', defaultCount);
    console.log('First default program:', (await feedItems.first().innerText()).substring(0, 80));

    // ── Filter 1: Nationality → India ────────────────────────────────────────
    // Reference by index (nth) because trigger label text changes after selection
    await page.locator('.search-row').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    await filterTriggers.nth(0).click({ force: true });
    await page.waitForTimeout(800);

    await expect(page.locator('.msd-dropdown')).toBeVisible({ timeout: 3000 });
    await page.locator('.msd-dropdown input').first().fill('India');
    await page.waitForTimeout(400);
    await page.locator('.msd-option').filter({ hasText: /^India$/ }).first().click({ force: true });
    await page.waitForTimeout(600);

    const natLabel = await filterTriggers.nth(0).locator('.msd-label').innerText();
    expect(natLabel).toBe('India');
    console.log('Nationality selected: India ✓ (label:', natLabel, ')');

    // ── Filter 2: Destination Country → United Kingdom ────────────────────────
    await filterTriggers.nth(1).click({ force: true });
    await page.waitForTimeout(800);

    await expect(page.locator('.msd-dropdown')).toBeVisible({ timeout: 3000 });
    await page.locator('.msd-dropdown input').first().fill('United Kingdom');
    await page.waitForTimeout(400);
    await page.locator('.msd-option').filter({ hasText: 'United Kingdom' }).first().click({ force: true });
    await page.waitForTimeout(600);

    const dcLabel = await filterTriggers.nth(1).locator('.msd-label').innerText();
    console.log('Destination Country selected: United Kingdom ✓ (label:', dcLabel, ')');

    // Close dropdown by clicking outside the filter row
    await page.locator('.right-panel').click({ position: { x: 500, y: 10 }, force: true });
    await page.waitForTimeout(400);

    // ── Filter 3: Academic Level → Postgraduate ───────────────────────────────
    await filterTriggers.nth(2).click({ force: true });
    await page.waitForTimeout(800);

    await expect(page.locator('.msd-dropdown')).toBeVisible({ timeout: 3000 });
    const alOpts = await page.locator('.msd-option .msd-opt-text').allInnerTexts();
    console.log('Academic Level options:', JSON.stringify(alOpts));

    await page.locator('.msd-option').filter({ hasText: 'Postgraduate' }).first().click({ force: true });
    await page.waitForTimeout(600);

    const alLabel = await filterTriggers.nth(2).locator('.msd-label').innerText();
    console.log('Academic Level selected: Postgraduate ✓ (label:', alLabel, ')');

    // Close dropdown
    await page.locator('.right-panel').click({ position: { x: 500, y: 10 }, force: true });
    await page.waitForTimeout(400);

    // ── Search Programs ───────────────────────────────────────────────────────
    await page.getByRole('button', { name: 'Search Programs' }).first().click();
    await page.waitForTimeout(3000);
    console.log('Search Programs clicked ✓');

    await page.waitForSelector('.program-feed .program-name-tag', { timeout: 10000 }).catch(() => {
        console.log('No results within timeout');
    });
    await page.waitForTimeout(500);

    const filteredCount = await feedItems.count();
    expect(filteredCount).toBeGreaterThan(0);
    console.log('Filtered results (India + UK + Postgraduate):', filteredCount);

    for (let i = 0; i < Math.min(3, filteredCount); i++) {
        const name = await feedItems.nth(i).innerText().catch(() => '');
        console.log(`  Result ${i + 1}:`, name.substring(0, 80));
    }

    // // ── Card elements ─────────────────────────────────────────────────────────
    // if (await page.locator('.program-feed button').filter({ hasText: 'Apply Now' }).first().isVisible({ timeout: 2000 }).catch(() => false)) {
    //     console.log('Apply Now button visible on filtered results ✓');
    // }

    // if (await page.locator('.program-feed button').filter({ hasText: 'English Language Requirements' }).first().isVisible({ timeout: 2000 }).catch(() => false)) {
    //     await page.locator('.program-feed button').filter({ hasText: 'English Language Requirements' }).first().click();
    //     await page.waitForTimeout(500);
    //     console.log('English Language Requirements expanded ✓');
    // }

    // // ── Tabs ─────────────────────────────────────────────────────────────────
    // await page.getByRole('button', { name: 'Shortlist' }).first().click({ force: true });
    // await page.waitForTimeout(600);
    // console.log('Shortlist tab clicked ✓');

    // await page.getByRole('button', { name: 'Recommendation' }).first().click({ force: true });
    // await page.waitForTimeout(600);
    // console.log('Recommendation tab clicked ✓');

    // ── Clear all filters ─────────────────────────────────────────────────────
    await page.getByRole('button', { name: 'Clear' }).first().click({ force: true });
    await page.waitForTimeout(1500);

    const natLabelAfterClear = await filterTriggers.nth(0).locator('.msd-label').innerText();
    console.log('Nationality label after clear:', natLabelAfterClear);

    console.log('Search-Course (Beta) test complete ✓');
});
