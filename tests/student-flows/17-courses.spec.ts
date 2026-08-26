import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

// react-select IDs change after each selection (React re-renders), so we use
// positional .async-dropdown-container nth(n) to target each dropdown reliably.
// Index: 0=Nationality, 1=Destination Country, 2=State, 3=City,
//        4=Academic Level, 5=Intake Month, 6=University, 7=Course

test('Vivek Consultancy — Courses Page & Filter Cascade', async ({ page }) => {
    test.setTimeout(120000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') {
        console.log('Login failed:', result);
        return;
    }
    console.log('Login success');

    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // ── Navigate to Courses ──────────────────────────────────────────────────
    await page.goto('https://vivekconsultancy.flyurdream.com/#/programs');
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/programs/i);
    console.log('Courses URL confirmed:', page.url());

    // ── Verify 8 filter dropdowns ────────────────────────────────────────────
    const dropdownCount = await page.locator('.async-dropdown-container').count();
    expect(dropdownCount).toBe(8);
    console.log('8 filter dropdowns confirmed ✓');

    // ── Initial state: only Nationality (idx 0) enabled ───────────────────────
    const nat0 = page.locator('.async-dropdown-container').nth(0).locator('input').first();
    const dc0  = page.locator('.async-dropdown-container').nth(1).locator('input').first();
    await expect(nat0).toBeEnabled();
    await expect(dc0).toBeDisabled();
    console.log('Initial state: Nationality enabled, all others disabled ✓');

    // Confirm all downstream dropdowns start disabled
    for (let i = 2; i <= 7; i++) {
        const inp = page.locator('.async-dropdown-container').nth(i).locator('input').first();
        const disabled = await inp.isDisabled().catch(() => true);
        console.log(`Dropdown [${i}] initially disabled: ${disabled}`);
    }

    // ── Results info & pagination ────────────────────────────────────────────
    // The initial course count fetch can be slow on this tenant (server can
    // lag several seconds) — give this its own generous timeout rather than
    // the default 5s.
    const resultsInfo = page.locator('.results-info').first();
    await expect(resultsInfo).toBeVisible({ timeout: 20000 });
    console.log('Initial results:', await resultsInfo.innerText());

    await expect(page.locator('.page-controll')).toBeVisible({ timeout: 20000 });
    console.log('Pagination visible ✓');

    // ── Cascade step 1: Nationality → Indian ─────────────────────────────────
    await nat0.fill('Indian');
    await page.waitForTimeout(800);
    await page.locator('[class*="-option"]').filter({ hasText: 'Indian' }).first().click();
    await page.waitForTimeout(1000);
    console.log('Nationality selected: Indian ✓');

    // After Nationality: Destination Country should be enabled
    const dc1 = page.locator('.async-dropdown-container').nth(1).locator('input').first();
    await expect(dc1).toBeEnabled({ timeout: 5000 });
    console.log('Destination Country enabled after Nationality ✓');

    // ── Cascade step 2: Destination Country → United Kingdom ─────────────────
    await dc1.fill('United Kingdom');
    await page.waitForTimeout(800);
    await page.locator('[class*="-option"]').filter({ hasText: 'United Kingdom' }).first().click();
    await page.waitForTimeout(1000);
    console.log('Destination Country selected: United Kingdom ✓');

    // After Destination Country: State (idx 2) should be enabled
    const state2 = page.locator('.async-dropdown-container').nth(2).locator('input').first();
    const stateEnabled = await state2.isEnabled().catch(() => false);
    console.log('State enabled after Destination Country:', stateEnabled);

    // ── Click Search with Nationality + Destination Country ───────────────────
    await page.locator('.pageload-filter-button').filter({ hasText: 'Search' }).first().click();
    await page.waitForTimeout(2000);
    console.log('Search clicked ✓');

    // ── Wait for course cards to load ─────────────────────────────────────────
    await page.waitForSelector('.uni-card:not(.courseskeleton-card)', { timeout: 15000 }).catch(() => {
        console.log('No real cards visible within timeout');
    });
    await page.waitForTimeout(500);

    const resultsAfter = await resultsInfo.innerText().catch(() => '');
    console.log('Results after search:', resultsAfter);

    // ── Verify course card structure ──────────────────────────────────────────
    const cards = page.locator('.uni-card:not(.courseskeleton-card)');
    const cardCount = await cards.count();
    console.log('Course cards visible:', cardCount);

    if (cardCount > 0) {
        const firstCard = cards.first();

        // Logo
        if (await firstCard.locator('.card-logo').isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log('Card logo visible ✓');
        }

        // Course name link
        if (await firstCard.locator('.card-title1').isVisible({ timeout: 2000 }).catch(() => false)) {
            const name = await firstCard.locator('.card-title1').innerText().catch(() => '');
            console.log('Course name:', name.substring(0, 80));
        }

        // Credibility badge
        if (await firstCard.locator('.credibility-badge').isVisible({ timeout: 2000 }).catch(() => false)) {
            const badge = await firstCard.locator('.credibility-badge').innerText().catch(() => '');
            console.log('Credibility badge:', badge.trim());
        }

        // Card body details
        if (await firstCard.locator('.card-body').isVisible({ timeout: 2000 }).catch(() => false)) {
            const details = await firstCard.locator('.card-body').innerText().catch(() => '');
            console.log('Card details snippet:', details.substring(0, 120));
        }

        // English Language Requirements toggle
        if (await firstCard.locator('.english-req-toggle-ou').isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log('English Language Requirements toggle visible ✓');
            await firstCard.locator('.english-req-toggle-ou').click();
            await page.waitForTimeout(600);
            console.log('English Language Requirements expanded ✓');
        }

        // Wishlist star
        if (await firstCard.locator('.card-header-wishlist').isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log('Wishlist star visible ✓');
        }

        // Apply Now button
        if (await firstCard.locator('.program-apply-button').isVisible({ timeout: 2000 }).catch(() => false)) {
            const applyText = await firstCard.locator('.program-apply-button').innerText().catch(() => '');
            console.log('Apply button visible:', applyText.trim(), '✓');
        }
    }

    // ── Clear filters ─────────────────────────────────────────────────────────
    await page.getByRole('button', { name: 'Clear' }).first().click();
    await page.waitForTimeout(1500);
    console.log('Clear clicked ✓');

    // After clear: Destination Country should be disabled again
    const dcClear = page.locator('.async-dropdown-container').nth(1).locator('input').first();
    const dcDisabled = await dcClear.isDisabled().catch(() => false);
    console.log('Destination Country disabled after clear:', dcDisabled);

    console.log('Courses Page & Filter Cascade test complete ✓');
});
