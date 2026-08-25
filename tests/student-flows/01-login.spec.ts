import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

test('Vivek Consultancy — Student Login', async ({ page }) => {
    test.setTimeout(60000);

    // ── Login ──────────────────────────────────────────────────────────────────
    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') {
        console.log('Login failed:', result);
        return;
    } else {
        console.log('Login success');
    }

    // // ── Invalid email test ─────────────────────────────────────────────────────
    // await page.goto(env.vivekconsultancy);
    // await page.locator('[name="email"]').fill('wronguser@test.com');
    // await page.locator('[name="password"]').fill('Data@1234');
    // await page.getByText('Sign In', { exact: true }).click();
    // await page.waitForTimeout(3000);
    // const emailErr = await page.locator('.error-modern');
    // if (await emailErr.isVisible()) {
    //     const msg = await emailErr.innerText();
    //     console.log('Invalid email error shown:', msg);
    // } else {
    //     console.log('No error shown for invalid email — check selector');
    // }

    // // ── Wrong password test ────────────────────────────────────────────────────
    // await page.goto(env.vivekconsultancy);
    // await page.locator('[name="email"]').fill('chittibabu@gmail.com');
    // await page.locator('[name="password"]').fill('WrongPass@999');
    // await page.getByText('Sign In', { exact: true }).click();
    // await page.waitForTimeout(3000);
    // const passErr = await page.locator('.error-modern');
    // if (await passErr.isVisible()) {
    //     const msg = await passErr.innerText();
    //     console.log('Wrong password error shown:', msg);
    // } else {
    //     console.log('No error shown for wrong password — check selector');
    // }

    // // ── Empty fields test ──────────────────────────────────────────────────────
    // await page.goto(env.vivekconsultancy);
    // await page.getByText('Sign In', { exact: true }).click();
    // await page.waitForTimeout(2000);
    // const stillOnLogin = !page.url().includes('dashboard');
    // if (stillOnLogin) {
    //     console.log('Empty field validation working — stayed on login page');
    // }

    // ── Valid login + dashboard confirm ────────────────────────────────────────
    // const result2 = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    // if (result2 === 'email error' || result2 === 'password error') {
    //     console.log('Re-login failed:', result2);
    //     return;
    // }

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
