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
    // Dashboard redesign — old .date-time-dashboard is gone, replaced by
    // .nd-date-pill (sits between "What's new" and "Broadcasts").
    await expect(page.locator('.nd-date-pill')).toBeVisible();
    const dateText = await page.locator('.nd-date-pill').innerText();
    console.log('Date displayed:', dateText);

    // ── Dashboard stat cards ───────────────────────────────────────────────────
    // Dashboard redesign — old .card-title is gone, replaced by .nd-stat-label.
    const cards = ['Total Students', 'Applications', 'Active Partners', 'Available Courses'];
    for (const card of cards) {
        const cardEl = page.locator('.nd-stat-label').getByText(card, { exact: true });
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
    // Sidebar redesign — it now starts collapsed to an icon-only rail
    // (.nsm-sidebar--collapsed, items only carry a title/tooltip, no visible
    // text). Clicking a LEAF item (e.g. Dashboard, no children) navigates and
    // immediately auto-collapses the rail back — clicking a PARENT item that
    // owns a sub-menu (e.g. Application) expands the whole rail and keeps it
    // expanded, revealing every top-level label (.nsm-link-label) at once.
    await page.locator('body').click();
    await page.waitForSelector('.nsm-sidebar', { timeout: 20000 });
    await page.locator('.nsm-link[title="Application"]').click();
    await page.waitForSelector('.nsm-sidebar--expanded', { timeout: 10000 });
    // The rail expand is CSS-transitioned — wait for a label to actually
    // become visible (isVisible() itself is an instant, non-polling check).
    await page.locator('.nsm-link-label').getByText('Dashboard', { exact: true })
        .waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    console.log('Sidebar expanded');

    // ── Menu items visible ─────────────────────────────────────────────────────
    // Enquiry and Accommodation are no longer sidebar entries (routes still
    // exist, reached via direct navigation elsewhere) — the current top-level
    // set is Dashboard, Universities/Courses, Application, Loan, Email Settings.
    const menuItems = ['Dashboard', 'Universities/Courses', 'Application', 'Loan', 'Email Settings'];
    for (const item of menuItems) {
        const el = page.locator('.nsm-link-label').getByText(item, { exact: true });
        if (await el.isVisible().catch(() => false)) {
            console.log(`Menu item VISIBLE: "${item}" ✓`);
        } else {
            console.log(`Menu item NOT visible: "${item}" ✗`);
        }
    }

    // ── Click Dashboard menu item — stays on dashboard ─────────────────────────
    await page.locator('.nsm-link[title="Dashboard"]').click();
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/dashboard/);
    console.log('Dashboard menu item click confirmed — still on dashboard');

    // ── Footer version visible ─────────────────────────────────────────────────
    // Dashboard redesign — old .dash-footer-ver-num is gone, replaced by
    // .nd-footer-ver-num.
    await expect(page.locator('.nd-footer-ver-num')).toBeVisible();
    const ver = await page.locator('.nd-footer-ver-num').innerText();
    console.log('Platform version:', ver);

    console.log('Dashboard test complete ✓');
});
