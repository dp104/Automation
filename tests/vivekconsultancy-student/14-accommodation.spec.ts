import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

test('Vivek Consultancy — Accommodation', async ({ page }) => {
    test.setTimeout(60000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') {
        console.log('Login failed:', result);
        return;
    }
    console.log('Login success');

    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // ── Open sidebar, expand Accommodation sub-menu ───────────────────────────
    await page.locator('.menu-toggle-icon').click();
    await page.waitForTimeout(800);
    await page.locator('.menu-item').filter({ hasText: /^Accommodation$/ }).first().click();
    await page.waitForTimeout(800);

    // Verify sub-menu items
    await expect(page.locator('.sub-menu .menu-link').filter({ hasText: 'Student Accommodation' }).first()).toBeVisible();
    await expect(page.locator('.sub-menu .menu-link').filter({ hasText: 'View Submitted Accommodation' }).first()).toBeVisible();
    console.log('Accommodation sub-menu items visible ✓');

    // Navigate to Student Accommodation
    await page.locator('.sub-menu .menu-link').filter({ hasText: 'Student Accommodation' }).first().click();
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/accommodation/i);
    console.log('Accommodation URL confirmed:', page.url());

    // ── Main container ─────────────────────────────────────────────────────────
    await expect(page.locator('.housing-widget-container')).toBeVisible();
    console.log('Housing widget container visible ✓');

    // ── Search section ─────────────────────────────────────────────────────────
    await expect(page.locator('.sc-search-container')).toBeVisible();
    console.log('Search container visible ✓');

    await expect(page.locator('.typeahead-input')).toBeVisible();
    console.log('Search housing input visible ✓');

    // ── Filter buttons ─────────────────────────────────────────────────────────
    const filters = ['Room Type', 'Price', 'Move in month', 'Sort'];
    for (const filter of filters) {
        const btn = page.locator('.sc-filter-button, .sc-filter-container').filter({ hasText: filter }).first();
        if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log(`Filter visible: "${filter}" ✓`);
        } else {
            console.log(`Filter NOT found: "${filter}" ✗`);
        }
    }

    // ── Results count ──────────────────────────────────────────────────────────
    await expect(page.locator('.amber-results-count')).toBeVisible();
    const resultsText = await page.locator('.amber-results-count').innerText();
    console.log('Results count:', resultsText);

    // ── Property grid ──────────────────────────────────────────────────────────
    await expect(page.locator('.housing-property-grid')).toBeVisible();
    console.log('Property grid visible ✓');

    // ── Property cards ─────────────────────────────────────────────────────────
    const cards = page.locator('.housing-property-card');
    const cardCount = await cards.count();
    console.log('Property cards visible:', cardCount);
    expect(cardCount).toBeGreaterThan(0);

    // ── First card details ─────────────────────────────────────────────────────
    const firstCard = cards.first();

    await expect(firstCard.locator('.housing-property-details-heading')).toBeVisible();
    const firstCardName = await firstCard.locator('.housing-property-details-heading').innerText();
    console.log('First property name:', firstCardName);

    await expect(firstCard.locator('.housing-property-location')).toBeVisible();
    const location = await firstCard.locator('.housing-property-location').innerText();
    console.log('First property location:', location);

    await expect(firstCard.locator('.housing-room-count')).toBeVisible();
    const roomCount = await firstCard.locator('.housing-room-count').innerText();
    console.log('Room options:', roomCount);

    await expect(firstCard.locator('.housing-view-button')).toBeVisible();
    console.log('View button visible ✓');

    // ── Pagination ─────────────────────────────────────────────────────────────
    await expect(page.locator('.housing-pagination')).toBeVisible();
    console.log('Pagination visible ✓');

    const nextBtn = page.locator('.housing-carousel-arrow, .housing-pagination').getByText('>').first();
    if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('Next pagination button visible ✓');
    }

    console.log('Accommodation test complete ✓');
});
