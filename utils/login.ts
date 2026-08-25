import { Page } from '@playwright/test';

// Login page — NEW UI (gl-* classes, 2026-07 redesign).
// Sign-in button text is "Sign in" (lowercase i) — case-sensitive exact match.
export async function login(page: Page, url: string, email: string, password: string) {
    await page.goto(url);
    await page.locator('[name="email"]').fill(email);
    await page.locator('[name="password"]').fill(password);
    await page.getByText('Sign in', { exact: true }).click();
    await page.waitForTimeout(3000);

    // Wrong email / wrong password — new error class .gl-error.
    // "Incorrect password" is specific; anything else (e.g. generic
    // "Login Failed" for an unregistered email) is treated as an email error.
    const errorEl = page.locator('.gl-error');
    if (await errorEl.isVisible().catch(() => false)) {
        const errortext = (await errorEl.innerText()).toLowerCase();
        if (errortext.includes('incorrect password')) {
            console.log('Incorrect Password');
            return 'password error';
        } else {
            console.log('Email id Not Found');
            return 'email error';
        }
    }

    // Session conflict — the "Force logout from all other devices" checkbox
    // (label.gl-force-check) must be checked before the Sign in button
    // (disabled by default in this state) becomes clickable again.
    const forceCheck = page.locator('label.gl-force-check');
    if (await forceCheck.isVisible({ timeout: 2000 }).catch(() => false)) {
        await forceCheck.click();
        await page.waitForTimeout(500);
        console.log('Session conflict handled');
        await page.locator('button.gl-btn-sign').click();
        await page.waitForURL('**/dashboard', { timeout: 15000 });
        console.log('Dashboard open');
    }
}
