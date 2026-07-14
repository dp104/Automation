import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

test('Vivek Consultancy — Universities Page & Filters', async ({ page }) => {
    test.setTimeout(120000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') {
        console.log('Login failed:', result);
        return;
    }
    console.log('Login success');

    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // ── Navigate to Universities ───────────────────────────────────────────────
    await page.locator('.menu-toggle-icon').click();
    await page.waitForTimeout(500);
    await page.locator('.menu-item').filter({ hasText: 'Universities/Courses' }).first().click();
    await page.waitForTimeout(400);
    await page.locator('.sub-menu .menu-link').filter({ hasText: 'Universities' }).first().click();
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/universities/i);
    console.log('Universities URL confirmed:', page.url());

    // ── Breadcrumb ─────────────────────────────────────────────────────────────
    await expect(page.locator('.dashboard-link').getByText('Dashboard', { exact: true })).toBeVisible();
    await expect(page.getByText('Universities/Courses', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Universities', { exact: true }).first()).toBeVisible();
    console.log('Breadcrumb: Dashboard > Universities/Courses > Universities ✓');

    // ── Search input ───────────────────────────────────────────────────────────
    await expect(page.locator('.global-search-input')).toBeVisible();
    console.log('Search input visible ✓');

    // ── Results & cards ────────────────────────────────────────────────────────
    await expect(page.locator('.results-info').first()).toBeVisible();
    const initialResults = await page.locator('.results-info').first().innerText();
    console.log('Initial results:', initialResults);

    await expect(page.locator('.university-card').first()).toBeVisible();
    const cardCount = await page.locator('.university-card').count();
    console.log('University cards per page:', cardCount);
    expect(cardCount).toBeGreaterThan(0);

    const firstCard = page.locator('.university-card').first();
    await expect(firstCard.locator('.card-logo')).toBeVisible();
    await expect(firstCard.locator('.card-title-university')).toBeVisible();
    const uniName = await firstCard.locator('.card-title-university').innerText();
    console.log('First university:', uniName);

    // ── Pagination ─────────────────────────────────────────────────────────────
    await expect(page.locator('.pagination-controls')).toBeVisible();
    console.log('Pagination visible ✓');

    // ── Search by keyword ──────────────────────────────────────────────────────
    await page.locator('.global-search-input').fill('London');
    await page.waitForTimeout(1000);
    const searchCount = await page.locator('.university-card').count();
    console.log('Search "London" — cards:', searchCount);
    await page.locator('.global-search-input').fill('');
    await page.waitForTimeout(500);

    // ── Open Filter panel ──────────────────────────────────────────────────────
    await page.locator('.get-btn-SlideFilter').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.get-filter-section')).toBeVisible();
    console.log('Filter panel opened ✓');

    // ── Filter labels ──────────────────────────────────────────────────────────
    for (const label of ['Country', 'State', 'City', 'University', 'Campus']) {
        await expect(page.locator('.get-filter-section label').filter({ hasText: label }).first()).toBeVisible();
        console.log(`Filter label visible: "${label}" ✓`);
    }

    // ── Enabled/disabled state ─────────────────────────────────────────────────
    await expect(page.locator('#react-select-2-input')).toBeEnabled();
    await expect(page.locator('#react-select-3-input')).toBeDisabled();
    await expect(page.locator('#react-select-4-input')).toBeDisabled();
    console.log('Country enabled, State/City disabled initially ✓');

    const applyBtn = page.locator('.get-filter-section').getByRole('button', { name: 'Apply Filters' });
    const resetBtn = page.locator('.get-filter-section').getByRole('button', { name: 'Reset Filters' });
    await expect(applyBtn).toBeVisible();
    await expect(resetBtn).toBeVisible();
    console.log('Apply Filters & Reset Filters buttons visible ✓');

    // ── Country: United Kingdom ────────────────────────────────────────────────
    await page.locator('#react-select-2-input').fill('United Kingdom');
    await page.waitForTimeout(600);
    await page.locator('[class*="-option"]').filter({ hasText: 'United Kingdom' }).first().click();
    await page.waitForTimeout(800);
    console.log('Country selected: United Kingdom ✓');

    // ── State: England ─────────────────────────────────────────────────────────
    await expect(page.locator('#react-select-3-input')).toBeEnabled();
    console.log('State enabled after country ✓');
    await page.locator('#react-select-3-input').click();
    await page.waitForTimeout(400);
    await page.locator('[class*="-option"]').filter({ hasText: 'England' }).first().click();
    await page.waitForTimeout(800);
    console.log('State selected: England ✓');

    // ── City: London ───────────────────────────────────────────────────────────
    await expect(page.locator('#react-select-4-input')).toBeEnabled();
    console.log('City enabled after state ✓');
    await page.locator('#react-select-4-input').click();
    await page.waitForTimeout(400);
    await page.locator('[class*="-option"]').filter({ hasText: 'London' }).first().click();
    await page.waitForTimeout(800);
    console.log('City selected: London ✓');

    // ── University: first option ───────────────────────────────────────────────
    await expect(page.locator('#react-select-5-input')).toBeEnabled();
    await page.locator('#react-select-5-input').click();
    await page.waitForTimeout(400);
    const uniOptions = await page.locator('[class*="-option"]').allInnerTexts();
    await page.locator('[class*="-option"]').first().click();
    await page.waitForTimeout(800);
    console.log('University selected:', uniOptions[0] || '', '✓');

    // ── Campus: first option ───────────────────────────────────────────────────
    await expect(page.locator('#react-select-6-input')).toBeEnabled();
    await page.locator('#react-select-6-input').click();
    await page.waitForTimeout(400);
    const campusOptions = await page.locator('[class*="-option"]').allInnerTexts();
    await page.locator('[class*="-option"]').first().click();
    await page.waitForTimeout(800);
    console.log('Campus selected:', campusOptions[0] || '', '✓');

    // ── Apply Filters ──────────────────────────────────────────────────────────
    await applyBtn.click();
    await page.waitForTimeout(1500);
    console.log('Apply Filters clicked ✓');
    // Filter panel closes after Apply — log URL to confirm navigation
    console.log('URL after apply:', page.url());

    console.log('Universities Page & Filters test complete ✓');
});
