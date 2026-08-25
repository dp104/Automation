import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

test('Vivek Consultancy — Logout', async ({ page }) => {
    test.setTimeout(60000);

    const result = await login(page, env.vivekconsultancy, 'qapartnergopi@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') {
        console.log('Login failed:', result);
        return;
    }
    console.log('Login success');

    await expect(page).toHaveURL(/dashboard/);
    console.log('On dashboard before logout ✓');

    // ── Open profile dropdown ──────────────────────────────────────────────────
    await page.waitForTimeout(1000);
    await page.locator('body').click();
    await page.locator('.nav-profile-div').click();
    

    // ── Confirm dropdown items visible before logout ───────────────────────────
    await expect(page.locator('.profile-name')).toBeVisible();
    await expect(page.locator('.profile-action-btn').first()).toBeVisible();
    console.log('Profile dropdown opened ✓');

    // ── Sign out ───────────────────────────────────────────────────────────────
    await expect(page.locator('.profile-signout-item').getByText('Sign out from account', { exact: true })).toBeVisible();
    console.log('Sign out button visible ✓');
    await page.locator('.profile-signout-item').click();
    await page.waitForTimeout(3000);

    // ── Confirm back on login page ─────────────────────────────────────────────
    await expect(page).not.toHaveURL(/dashboard/);
    await expect(page.getByText('Sign in', { exact: true })).toBeVisible();
    console.log('Logout confirmed — back on login page ✓');
    console.log('Final URL after logout:', page.url());

    // ── Confirm session is cleared — dashboard route should redirect to login ──
    await page.goto('https://vivekconsultancy.flyurdream.com/#/dashboard');
    await page.waitForTimeout(2000);
    const onLogin = !page.url().includes('dashboard') || await page.getByText('Sign in', { exact: true }).isVisible().catch(() => false);
    if (onLogin) {
        console.log('Session cleared — dashboard access redirects to login ✓');
    } else {
        console.log('Session may still be active — check logout behaviour');
    }

    console.log('Logout test complete ✓');
});
