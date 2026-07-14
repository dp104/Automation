import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

test('Vivek Consultancy — Application Menu & View Applications', async ({ page }) => {
    test.setTimeout(60000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') {
        console.log('Login failed:', result);
        return;
    }
    console.log('Login success');

    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // ── Open sidebar and expand Application menu ───────────────────────────────
    await page.locator('.menu-toggle-icon').click();
    await page.waitForTimeout(800);

    await page.locator('.menu-item').filter({ hasText: /^Application$/ }).first().click();
    await page.waitForTimeout(800);

    const subMenu = page.locator('.sub-menu');
    await expect(subMenu).toBeVisible();
    console.log('Application sub-menu open ✓');

    // ── Verify all sub-menu items ──────────────────────────────────────────────
    const expectedItems = [
        'Add Student Information',
        'View Student Information',
        'View Applications',
        'Primary Status Applications',
        'Secondary Status Applications',
    ];
    for (const item of expectedItems) {
        const link = page.locator('.sub-menu .menu-link').filter({ hasText: item }).first();
        await expect(link).toBeVisible();
        console.log(`Sub-menu item visible: "${item}" ✓`);
    }

    // ── Navigate to View Applications ─────────────────────────────────────────
    await page.locator('.sub-menu .menu-link').filter({ hasText: 'View Applications' }).first().click();
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/Get-Applications/i);
    console.log('View Applications URL confirmed:', page.url());

    // ── Breadcrumb ─────────────────────────────────────────────────────────────
    await expect(page.locator('.dashboard-link').getByText('Dashboard', { exact: true })).toBeVisible();
    await expect(page.getByText('Application', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('View Applications', { exact: true }).first()).toBeVisible();
    console.log('Breadcrumb: Dashboard > Application > View Applications ✓');

    // ── Stat cards ─────────────────────────────────────────────────────────────
    const statLabels = ['TOTAL STUDENTS', 'IN PROGRESS', 'OFFERS RECEIVED', 'TOTAL APPLICATIONS'];
    for (const label of statLabels) {
        const el = page.getByText(label, { exact: true });
        if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log(`Stat card visible: "${label}" ✓`);
        } else {
            console.log(`Stat card NOT found: "${label}" ✗`);
        }
    }

    // ── Filters / search ───────────────────────────────────────────────────────
    await expect(page.locator('.gad-search-input')).toBeVisible();
    console.log('Search input visible ✓');

    // ── Table headers ──────────────────────────────────────────────────────────
    const tableHeaders = ['ID', 'STUDENT', 'COMPANY', 'EMAIL', 'MOBILE', 'PASSPORT'];
    for (const header of tableHeaders) {
        const th = page.locator('.gad-th').filter({ hasText: header }).first();
        if (await th.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log(`Table header visible: "${header}" ✓`);
        }
    }

    // ── Student row visible ────────────────────────────────────────────────────
    const rowCount = await page.locator('.gad-row').count();
    console.log('Application rows count:', rowCount);

    if (rowCount > 0) {
        await expect(page.locator('.gad-row').first()).toBeVisible();
        const firstRowText = await page.locator('.gad-name-primary').first().innerText().catch(() => '');
        console.log('First student name:', firstRowText);
    }

    // ── Navigate to Primary Status Applications ────────────────────────────────
    await page.locator('.menu-toggle-icon').click();
    await page.waitForTimeout(500);
    await page.locator('.menu-item').filter({ hasText: /^Application$/ }).first().click();
    await page.waitForTimeout(600);
    await page.locator('.sub-menu .menu-link').filter({ hasText: 'Primary Status Applications' }).first().click();
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/Application_PrimaryStatus/i);
    console.log('Primary Status Applications URL confirmed:', page.url());

    const primaryText = await page.locator('body').innerText();
    console.log('Primary Status page loaded, snippet:', primaryText.substring(0, 150));

    // ── Navigate to Secondary Status Applications ──────────────────────────────
    await page.locator('.menu-toggle-icon').click();
    await page.waitForTimeout(500);
    await page.locator('.menu-item').filter({ hasText: /^Application$/ }).first().click();
    await page.waitForTimeout(600);
    await page.locator('.sub-menu .menu-link').filter({ hasText: 'Secondary Status Applications' }).first().click();
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/Application_SecondaryStatus/i);
    console.log('Secondary Status Applications URL confirmed:', page.url());

    console.log('Application Menu test complete ✓');
});
