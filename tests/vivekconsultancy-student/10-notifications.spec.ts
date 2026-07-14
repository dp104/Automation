import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

test('Vivek Consultancy — Top Nav Notifications', async ({ page }) => {
    test.setTimeout(60000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') {
        console.log('Login failed:', result);
        return;
    }
    console.log('Login success');
    await expect(page).toHaveURL(/dashboard/);

    // ── Notification Bell ──────────────────────────────────────────────────────
    await page.waitForTimeout(500);
    await page.locator('body').click();
    

    await expect(page.locator('.notification-nav-div')).toBeVisible();
    await page.locator('.notification-nav-div').click();
    await page.waitForTimeout(1500);
    console.log('Notification bell clicked ✓');

    // ── Notifications panel header ─────────────────────────────────────────────
    await expect(page.locator('.nav-header-info').getByText('Notifications', { exact: true })).toBeVisible();
    console.log('Notifications panel header visible ✓');

    // ── Notification items ─────────────────────────────────────────────────────
    const notifItems = page.locator('.notification-key');
    const notifCount = await notifItems.count();
    console.log('Notification items count:', notifCount);

    if (notifCount > 0) {
        for (let i = 0; i < notifCount; i++) {
            const txt = await notifItems.nth(i).innerText();
            console.log(`Notification ${i + 1}: ${txt}`);
        }
    } else {
        console.log('No notification items — inbox may be empty');
    }

    // ── See All link ───────────────────────────────────────────────────────────
    const seeAll = page.getByText('See All', { exact: true });
    if (await seeAll.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('See All link visible ✓');
        await seeAll.click();
        await page.waitForTimeout(2000);
        console.log('See All clicked — URL:', page.url());
        // go back to dashboard for next steps
        await page.goto('https://vivekconsultancy.flyurdream.com/#/dashboard');
        await page.waitForTimeout(2000);
    }

    // ── Messages icon ──────────────────────────────────────────────────────────
    await page.locator('body').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.message-nav-div')).toBeVisible();
    await page.locator('.message-nav-div').click();
    await page.waitForTimeout(1500);
    console.log('Messages icon clicked ✓');

    const msgPanel = page.locator('.allmessage-item');
    const msgCount = await msgPanel.count();
    if (msgCount > 0) {
        console.log('Message items found:', msgCount);
        const firstMsg = await msgPanel.first().innerText();
        console.log('First message:', firstMsg);
    } else {
        console.log('No messages found — inbox empty');
    }

    // ── Reminders icon ─────────────────────────────────────────────────────────
    await page.locator('body').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.reminder-nav-div').first()).toBeVisible();
    await page.locator('.reminder-nav-div').first().click();
    await page.waitForTimeout(1500);
    console.log('Reminders icon clicked ✓');

    const reminderItems = page.locator('.allmessage-item');
    const reminderCount = await reminderItems.count();
    if (reminderCount > 0) {
        console.log('Reminder/wallet items found:', reminderCount);
        for (let i = 0; i < Math.min(reminderCount, 5); i++) {
            const txt = await reminderItems.nth(i).innerText();
            console.log(`Reminder ${i + 1}: ${txt}`);
        }
    } else {
        console.log('No reminder items found');
    }

    // ── What's New button ──────────────────────────────────────────────────────
    await page.locator('body').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.btn-whatsnew')).toBeVisible();
    console.log('What\'s New button visible ✓');
    await page.locator('.btn-whatsnew').click();
    await page.waitForTimeout(1500);
    console.log('What\'s New clicked ✓');

    // close by clicking body
    await page.locator('body').click();
    await page.waitForTimeout(500);

    console.log('Top Nav Notifications test complete ✓');
});
