import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

test('Vivek Consultancy — Profile', async ({ page }) => {
    test.setTimeout(60000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') {
        console.log('Login failed:', result);
        return;
    }
    console.log('Login success');

    // ── Open profile via nav dropdown ──────────────────────────────────────────
    await page.waitForTimeout(1000);
    await page.locator('body').click();
    await page.locator('.nav-profile-div').click();
    

    // ── Profile dropdown items visible ─────────────────────────────────────────
    await expect(page.locator('.profile-name')).toBeVisible();
    const profileName = await page.locator('.profile-name').innerText();
    console.log('Profile name in dropdown:', profileName);

    await expect(page.locator('.profile-email')).toBeVisible();
    const profileEmail = await page.locator('.profile-email').innerText();
    console.log('Profile email in dropdown:', profileEmail);

    // User ID and Company ID
    const metaValues = page.locator('.profile-meta-value');
    const userId = await metaValues.nth(0).innerText();
    const companyId = await metaValues.nth(1).innerText();
    console.log('User ID:', userId);
    console.log('Company ID:', companyId);

    // ── Click View Profile ─────────────────────────────────────────────────────
    await page.locator('.profile-action-btn').first().click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/get-profile/);
    console.log('Profile page URL confirmed:', page.url());

    // ── Profile tabs visible ───────────────────────────────────────────────────
    const tabs = ['Profile', 'Calendar', 'Wallet', 'Preferences'];
    for (const tab of tabs) {
        await expect(page.locator('.tab-btn').getByText(tab, { exact: true })).toBeVisible();
        console.log(`Tab visible: "${tab}" ✓`);
    }

    // ── Profile tab active by default ─────────────────────────────────────────
    await expect(page.locator('.tab-btn.active')).toHaveText('Profile');
    console.log('Profile tab is active by default');

    // ── Profile contact info ───────────────────────────────────────────────────
    const labels = ['Email Address', 'Contact Number', 'Time Zone', 'Last Login'];
    for (const label of labels) {
        const labelEl = page.locator('.contact-label').getByText(label, { exact: true });
        if (await labelEl.isVisible({ timeout: 3000 }).catch(() => false)) {
            const valueEl = labelEl.locator('..').locator('.contact-value');
            const value = await page.locator('.contact-value').nth(labels.indexOf(label)).innerText().catch(() => '');
            console.log(`${label}: ${value}`);
        }
    }

    // ── Address tabs ───────────────────────────────────────────────────────────
    const addressTabs = ['Home Address', 'Office Address', 'Billing Address'];
    for (const tab of addressTabs) {
        const tabEl = page.locator('.address-tab-btn').getByText(tab, { exact: true });
        if (await tabEl.isVisible({ timeout: 3000 }).catch(() => false)) {
            await tabEl.click();
            await page.waitForTimeout(500);
            console.log(`Address tab clicked: "${tab}" ✓`);
        }
    }

    // ── Security section ───────────────────────────────────────────────────────
    await expect(page.locator('.security-title')).toBeVisible();
    console.log('Security & Access section visible');
    await expect(page.locator('.security-btn').getByText('Enable', { exact: true })).toBeVisible();
    console.log('2FA Enable button visible');

    // ── Account status ─────────────────────────────────────────────────────────
    await expect(page.locator('.profile-header-button').getByText('Active Account', { exact: true })).toBeVisible();
    console.log('Account status: Active Account ✓');

    console.log('Profile test complete ✓');
});
