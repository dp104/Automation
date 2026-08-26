import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

test('Vivek Consultancy — Change Password', async ({ page }) => {
    test.setTimeout(120000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') {
        console.log('Login failed:', result);
        return;
    }
    console.log('Login success');

    // ── Open Change Password via profile dropdown ──────────────────────────────
    await page.waitForTimeout(1000);
    await page.locator('body').click();
    await page.locator('.nav-profile-div').click();

    await page.locator('.profile-action-btn').nth(1).click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/change-password/);
    console.log('Change Password page URL confirmed:', page.url());

    // ── Page heading ───────────────────────────────────────────────────────────
    await expect(page.locator('span').filter({ hasText: 'Change Password' }).first()).toBeVisible();
    console.log('Change Password heading visible ✓');

    // ── Dashboard back link ────────────────────────────────────────────────────
    // Breadcrumb redesign — old .dashboard-link is gone, replaced by
    // .cp-crumb-link (inside a .cp-crumb wrapper).
    await expect(page.locator('.cp-crumb-link').getByText('Dashboard', { exact: true })).toBeVisible();
    console.log('Dashboard back link visible ✓');

    // ── Form fields visible ────────────────────────────────────────────────────
    const formGroups = page.locator('.form-group');
    const groupCount = await formGroups.count();
    console.log('Form groups found:', groupCount);

    // Email field
    const emailField = page.locator('[name="email"], input[type="email"]').first();
    await expect(emailField).toBeVisible();
    console.log('Email field visible ✓');

    // New Password field
    const newPassField = page.locator('[name="newPassword"], input[type="password"]').first();
    await expect(newPassField).toBeVisible();
    console.log('New Password field visible ✓');

    // Confirm New Password field
    const confirmPassField = page.locator('input[type="password"]').nth(1);
    await expect(confirmPassField).toBeVisible();
    console.log('Confirm New Password field visible ✓');

    // ── Password rules hint visible ────────────────────────────────────────────
    // Hints only render once the New Password field has input — and the
    // redesign reworded them from "8+ characters"/"1 uppercase"/etc. to
    // "At least 8 characters"/"One uppercase letter"/"One number"/
    // "One special character".
    await newPassField.fill('Test');
    await expect(page.getByText('At least 8 characters', { exact: true })).toBeVisible();
    await expect(page.getByText('One uppercase letter', { exact: true })).toBeVisible();
    await expect(page.getByText('One number', { exact: true })).toBeVisible();
    await expect(page.getByText('One special character', { exact: true })).toBeVisible();
    console.log('Password rules hint visible ✓');

    // ── Mismatch password test ─────────────────────────────────────────────────
    // await emailField.fill('chittibabu@gmail.com');
    await newPassField.fill('NewPass@123');
    await confirmPassField.fill('DifferentPass@456');
    const submitBtn = page.getByRole('button', { name: /save|submit|update|change/i }).first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
        const mismatchErr = page.locator(':text-matches("do not match|mismatch|passwords must match", "i")').first();
        if (await mismatchErr.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('Mismatch error shown:', await mismatchErr.innerText());
        } else {
            console.log('Mismatch error not visible — check validation');
        }
    }

    // ── Clear fields — do NOT submit with real password change ────────────────
    await newPassField.fill('');
    await confirmPassField.fill('');
    console.log('Fields cleared — not submitting real password change');

    // ── Back to Dashboard link ─────────────────────────────────────────────────
    await page.locator('.cp-crumb-link').click();
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/dashboard/);
    console.log('Navigated back to dashboard ✓');

    console.log('Change Password test complete ✓');
});
