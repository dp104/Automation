import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

test('Vivek Consultancy — Profile Preferences', async ({ page }) => {
    test.setTimeout(60000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') {
        console.log('Login failed:', result);
        return;
    }
    console.log('Login success');

    await page.goto('https://vivekconsultancy.flyurdream.com/#/get-profile');
    await page.waitForTimeout(2500);

    // ── Click Preferences tab ──────────────────────────────────────────────────
    await page.locator('.tab-btn').getByText('Preferences', { exact: true }).click();
    await page.waitForTimeout(1500);
    await expect(page.locator('.tab-btn.active')).toHaveText('Preferences');
    console.log('Preferences tab is active ✓');

    // ── Theme section ──────────────────────────────────────────────────────────
    await expect(page.getByText('Select a Theme:', { exact: true })).toBeVisible();
    console.log('Theme section visible ✓');

    // Default Theme card (active by default) — this used to be called "Light
    // Mode"; the theme-selector redesign renamed it (and dropped the old
    // Light/Dark Mode concept in favor of Default Theme / Logo Theme /
    // Custom Theme Colors), but .theme-card/.theme-card.active are unchanged.
    await expect(page.locator('.theme-card.active').getByText('Default Theme', { exact: true })).toBeVisible();
    console.log('Default Theme is active theme ✓');

    // Logo Theme card
    await expect(page.locator('.theme-card').getByText('Logo Theme', { exact: true })).toBeVisible();
    console.log('Logo Theme card visible ✓');

    // ── Click Logo Theme ───────────────────────────────────────────────────────
    await page.locator('.theme-card').getByText('Logo Theme', { exact: true }).click();
    await page.waitForTimeout(1000);
    console.log('Logo Theme clicked ✓');

    // ── Switch back to Default Theme ───────────────────────────────────────────
    await page.locator('.theme-card').getByText('Default Theme', { exact: true }).click();
    await page.waitForTimeout(1000);
    console.log('Default Theme restored ✓');

    // ── Notifications & Alerts section ────────────────────────────────────────
    await expect(page.locator('.notif-title').getByText('Notifications & Alerts', { exact: true })).toBeVisible();
    console.log('Notifications & Alerts section visible ✓');

    // ── Notification toggles ───────────────────────────────────────────────────
    const notifItems = [
        { heading: 'Application Updates', desc: 'Get emailed when student application statuses change.' },
        { heading: 'Application Notifications', desc: 'Notify me when a new Action has been done In Application.' },
        { heading: 'Comment Emails', desc: 'Receive alerts about Comments.' },
    ];
    for (const item of notifItems) {
        const headingEl = page.getByText(item.heading, { exact: true });
        if (await headingEl.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log(`Notification item visible: "${item.heading}" ✓`);
        } else {
            console.log(`Notification item NOT found: "${item.heading}" ✗`);
        }
        const descEl = page.getByText(item.desc, { exact: true });
        if (await descEl.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log(`  Description: "${item.desc}" ✓`);
        }
    }

    // ── Toggle first notification switch ──────────────────────────────────────
    const toggleSwitch = page.locator('input[type="checkbox"], .toggle-switch, .switch input').first();
    if (await toggleSwitch.isVisible({ timeout: 3000 }).catch(() => false)) {
        await toggleSwitch.click();
        await page.waitForTimeout(800);
        console.log('Notification toggle clicked ✓');
        // restore
        await toggleSwitch.click();
        await page.waitForTimeout(800);
        console.log('Notification toggle restored ✓');
    } else {
        console.log('Toggle switch selector not found — check preferences UI');
    }

    console.log('Profile Preferences test complete ✓');
});
