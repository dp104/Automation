import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

test('Vivek Consultancy — University Detail & All Tabs', async ({ page }) => {
    test.setTimeout(90000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') {
        console.log('Login failed:', result);
        return;
    }
    console.log('Login success');

    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // ── Navigate to Universities ───────────────────────────────────────────────
    await page.goto('https://vivekconsultancy.flyurdream.com/#/universities');
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/universities/i);

    // ── Open first university detail ───────────────────────────────────────────
    const firstUniName = await page.locator('.card-title-university').first().innerText();
    console.log('Opening university:', firstUniName);
    await page.locator('.card-title-university').first().click();
    await page.waitForTimeout(4000);

    await expect(page).toHaveURL(/universityinformation/i);
    console.log('University detail URL confirmed:', page.url());

    // ── Header ─────────────────────────────────────────────────────────────────
    await expect(page.locator('.uni-back-btn')).toBeVisible();
    console.log('Back button visible ✓');

    await expect(page.locator('.uni-lse-logo')).toBeVisible();
    await expect(page.locator('.uni-name')).toBeVisible();
    const detailName = await page.locator('.uni-name').innerText();
    console.log('University name:', detailName);

    await expect(page.locator('.uni-location')).toBeVisible();
    const location = await page.locator('.uni-location').innerText();
    console.log('Location:', location);

    await expect(page.locator('.uni-website')).toBeVisible();
    const website = await page.locator('.uni-website').innerText().catch(() => '');
    console.log('Website:', website);

    // ── All 6 tabs visible ─────────────────────────────────────────────────────
    const expectedTabs = ['Overview', 'Rankings', 'Courses', 'Academic Requirements', 'English Language Requirements', 'Accommodation'];
    for (const tab of expectedTabs) {
        await expect(page.locator('.uni-tab').filter({ hasText: tab }).first()).toBeVisible();
        console.log(`Tab visible: "${tab}" ✓`);
    }
    await expect(page.locator('.uni-tab.active')).toHaveText('Overview');
    console.log('Overview tab active by default ✓');

    // ── Tab 1: Overview ────────────────────────────────────────────────────────
    await expect(page.locator('.uni-content-section')).toBeVisible();
    const overviewSnippet = await page.locator('.uni-content-section').innerText();
    console.log('Overview snippet:', overviewSnippet.substring(0, 80));

    // ── Tab 2: Rankings ────────────────────────────────────────────────────────
    await page.locator('.uni-tab').filter({ hasText: 'Rankings' }).first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.uni-tab').filter({ hasText: 'Rankings' }).first()).toHaveClass(/active/);
    await expect(page.locator('.uni-rankings-list')).toBeVisible();
    const rankings = await page.locator('.uni-rankings-list').innerText();
    console.log('Rankings:', rankings.substring(0, 150));

    // ── Tab 3: Courses ─────────────────────────────────────────────────────────
    await page.locator('.uni-tab').filter({ hasText: 'Courses' }).first().click();
    await page.waitForTimeout(1500);
    await expect(page.locator('.uni-tab').filter({ hasText: 'Courses' }).first()).toHaveClass(/active/);
    await expect(page.locator('.uni-course-search-input')).toBeVisible();
    await expect(page.locator('.uni-course-name-header')).toBeVisible();
    await expect(page.locator('.uni-degree-header')).toBeVisible();
    await expect(page.locator('.uni-intake-header')).toBeVisible();
    console.log('Courses tab: search + table headers visible ✓');

    // Search within courses tab
    await page.locator('.uni-course-search-input').fill('MBA');
    await page.waitForTimeout(800);
    console.log('Course search "MBA" applied ✓');
    await page.locator('.uni-course-search-input').fill('');
    await page.waitForTimeout(500);

    // ── Tab 4: Academic Requirements ──────────────────────────────────────────
    await page.locator('.uni-tab').filter({ hasText: 'Academic Requirements' }).first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.uni-tab').filter({ hasText: 'Academic Requirements' }).first()).toHaveClass(/active/);
    await expect(page.locator('.uni-tab-content')).toBeVisible();
    const acadSnippet = await page.locator('.uni-tab-content').innerText();
    console.log('Academic Requirements snippet:', acadSnippet.substring(0, 100));

    // ── Tab 5: English Language Requirements ──────────────────────────────────
    await page.locator('.uni-tab').filter({ hasText: 'English Language Requirements' }).first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.uni-tab').filter({ hasText: 'English Language Requirements' }).first()).toHaveClass(/active/);
    await expect(page.locator('.uni-entry-section').first()).toBeVisible();
    const engSnippet = await page.locator('.uni-entry-section').first().innerText();
    console.log('English Language Requirements:', engSnippet.substring(0, 150));
    if (await page.locator('.uni-entry-list').first().isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('Entry list visible ✓');
    }

    // ── Tab 6: Accommodation ──────────────────────────────────────────────────
    await page.locator('.uni-tab').filter({ hasText: 'Accommodation' }).first().click();
    await page.waitForTimeout(2500);
    await expect(page.locator('.uni-tab').filter({ hasText: 'Accommodation' }).first()).toHaveClass(/active/);
    await expect(page.locator('.uni-content-section-accomodation')).toBeVisible();
    console.log('Accommodation tab: container visible ✓');
    if (await page.locator('.uni-content-section-accomodation .typeahead-input').isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('Accommodation tab: housing search input visible ✓');
    }
    const accResults = await page.locator('.uni-content-section-accomodation .amber-results-count').innerText().catch(() => '');
    console.log('Accommodation tab results:', accResults);

    // ── Back to Universities list ──────────────────────────────────────────────
    await page.locator('.uni-back-btn').click();
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/universities/i);
    console.log('Back to Universities list ✓');

    console.log('University Detail & All Tabs test complete ✓');
});
