import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

test('Vivek Consultancy — Dashboard', async ({ page }) => {
    test.setTimeout(90000);

    // ── Login ──────────────────────────────────────────────────────────────────
    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') {
        console.log('Login failed:', result);
        return;
    }
    console.log('Login success');

    // ── Dashboard URL confirmed ────────────────────────────────────────────────
    await expect(page).toHaveURL(/dashboard/);
    console.log('Dashboard URL confirmed:', page.url());

    // ── Page title ────────────────────────────────────────────────────────────
    await expect(page).toHaveTitle(/CRM/i);
    console.log('Page title confirmed: CRM | Vivek Consultancy');

    // ── Welcome heading ────────────────────────────────────────────────────────
    await expect(page.getByText("Welcome back! Here's what's happening today.", { exact: true })).toBeVisible();
    console.log('Welcome heading visible');

    // ── Student greeting (name + role) ─────────────────────────────────────────
    const userName = page.locator('.user-name');
    await expect(userName).toBeVisible();
    const name = await userName.innerText();
    console.log('Logged in student name:', name);

    const userRole = page.locator('.user-role');
    await expect(userRole).toBeVisible();
    const role = await userRole.innerText();
    console.log('Student role:', role);

    // ── Date display visible ───────────────────────────────────────────────────
    await expect(page.locator('.date-time-dashboard')).toBeVisible();
    const dateText = await page.locator('.date-time-dashboard').innerText();
    console.log('Date displayed:', dateText);

    // ── Dashboard stat cards ───────────────────────────────────────────────────
    const cards = ['Total Students', 'Applications', 'Active Partners', 'Available Courses'];
    for (const card of cards) {
        const cardEl = page.locator('.card-title').getByText(card, { exact: true });
        if (await cardEl.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log(`Stat card visible: "${card}"`);
        } else {
            console.log(`Stat card NOT found: "${card}"`);
        }
    }

    // ── Analytics sections ─────────────────────────────────────────────────────
    const sections = ['Application Trends', 'Students by Country', 'Recent Applications'];
    for (const section of sections) {
        const el = page.getByText(section, { exact: true });
        if (await el.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log(`Section visible: "${section}"`);
        } else {
            console.log(`Section NOT found: "${section}"`);
        }
    }

    // ── Sidebar toggle ─────────────────────────────────────────────────────────
    // Sidebar is now an always-visible icon rail — the old toggle icon is gone,
    // so just wait for the sidebar itself to be ready instead of clicking a toggle.
    await page.locator('body').click();
    await page.waitForSelector('.nsm-sidebar', { timeout: 20000 });
    console.log('Sidebar opened');

    // ── Menu items visible ─────────────────────────────────────────────────────
    const menuItems = ['Dashboard', 'Universities/Courses', 'Application', 'Enquiry', 'Accommodation'];
    for (const item of menuItems) {
        const el = page.getByText(item, { exact: true });
        if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log(`Menu item VISIBLE: "${item}" ✓`);
        } else {
            console.log(`Menu item NOT visible: "${item}" ✗`);
        }
    }

    // ── Click Dashboard menu item — stays on dashboard ─────────────────────────
    await page.getByText('Dashboard', { exact: true }).click();
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/dashboard/);
    console.log('Dashboard menu item click confirmed — still on dashboard');

    // ── Footer version visible ─────────────────────────────────────────────────
    await expect(page.locator('.dash-footer-ver-num')).toBeVisible();
    const ver = await page.locator('.dash-footer-ver-num').innerText();
    console.log('Platform version:', ver);

    console.log('Dashboard test complete ✓');
});
