import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

test('Vivek Consultancy — Student Login', async ({ page }) => {
    test.setTimeout(90000);

    // ── Invalid email test ─────────────────────────────────────────────────────
    const emailResult = await login(page, env.vivekconsultancy, 'wronguser@test.com', 'Data@1234');
    if (emailResult === 'email error') {
        console.log('Invalid email correctly rejected ✓');
    } else {
        console.log('Invalid email test — unexpected result:', emailResult);
    }

    // ── Wrong password test ────────────────────────────────────────────────────
    const passResult = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'WrongPass@999');
    if (passResult === 'password error') {
        console.log('Wrong password correctly rejected ✓');
    } else {
        console.log('Wrong password test — unexpected result:', passResult);
    }

    // ── Empty fields test ──────────────────────────────────────────────────────
    await page.goto(env.vivekconsultancy);
    await page.getByText('Sign in', { exact: true }).click();
    await page.waitForTimeout(2000);
    if (!page.url().includes('dashboard')) {
        console.log('Empty field validation working — stayed on login page ✓');
    } else {
        console.log('Empty fields allowed login — check validation ✗');
    }

    // ── Login ──────────────────────────────────────────────────────────────────
    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') {
        console.log('Login failed:', result);
        return;
    } else {
        console.log('Login success');
    }

    if (page.url().includes('dashboard')) {
        console.log('Dashboard confirmed after valid login');
        await expect(page.locator('body')).toBeVisible();

        // ── Logout ─────────────────────────────────────────────────────────────
        await page.locator('body').click();
        const profileBtn = await page.locator('.nav-profile-div');
        if (await profileBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await profileBtn.click();
            const logoutBtn = page.locator('.nav-sign-btn');
            if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                await logoutBtn.click();
                await page.waitForTimeout(2000);
                if (page.url().includes(env.vivekconsultancy) && !page.url().includes('dashboard')) {
                    console.log('Logged out successfully — back on login page');
                }
            }
        }
    } else {
        console.log('Not on dashboard after login — current URL:', page.url());
    }
});
