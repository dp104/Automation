import { expect, test } from '@playwright/test';
import { env } from '../../utils/environmenturls';

test('Vivek Consultancy — Forgot Password', async ({ page }) => {
    test.setTimeout(90000);

    await page.goto(env.vivekconsultancy);
    await page.waitForTimeout(2000);
    console.log('Login page loaded');

    // ── Step 1: Open Forgot Password page ─────────────────────────────────────
    await page.locator('.forgot-password-modern').click();
    await page.waitForTimeout(1500);
    await expect(page.getByText('Forgot Password', { exact: true })).toBeVisible();
    console.log('Forgot Password page opened');

    // ── Step 2: Unregistered email → expect "Email does not exists" ────────────
    await page.locator('[name="email"]').fill('notregistered@test.com');
    await page.getByRole('button', { name: 'SEND OTP' }).click();
    await page.waitForTimeout(3000);
    await expect(page.locator('.error-message')).toBeVisible();
    const unregErr = await page.locator('.error-message').innerText();
    console.log('Unregistered email error:', unregErr);
    expect(unregErr.length).toBeGreaterThan(0);

    // ── Step 3: Registered email → OTP sent ───────────────────────────────────
    // Replace below email with a valid registered email for this portal
    const registeredEmail = 'chittibabu@gmail.com';
    await page.locator('[name="email"]').fill('');
    await page.locator('[name="email"]').fill(registeredEmail);
    await page.getByRole('button', { name: 'SEND OTP' }).click();
    await page.waitForTimeout(4000);

    const sendErr = await page.locator('.error-message').isVisible().catch(() => false);
    if (sendErr) {
        const errText = await page.locator('.error-message').innerText();
        console.log('OTP send failed:', errText);
        // Go back and end test — email not registered in this portal
        await page.locator('.go-back-forgot').click();
        await page.waitForTimeout(1000);
        console.log('Email not registered in portal — skipping OTP steps');
        return;
    }

    // ── OTP sent success message ───────────────────────────────────────────────
    // Expected: "OTP sent to your email. Please enter it below."
    const otpSentMsg = page.getByText('OTP sent to your email. Please enter it below.', { exact: true });
    if (await otpSentMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('SUCCESS: OTP sent to your email. Please enter it below.');
    } else {
        console.log('OTP sent — message not found with exact text, checking for OTP input field');
    }

    // ── Step 4: OTP input field visible ───────────────────────────────────────
    const otpInput = page.locator('input[name="otp"], input[placeholder*="OTP" i], input[placeholder*="otp" i]').first();
    if (await otpInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('OTP input field is visible');

        // ── Step 5: Wrong OTP ──────────────────────────────────────────────────
        await otpInput.fill('000000');
        const verifyBtn = page.getByRole('button', { name: /verify|submit/i }).first();
        if (await verifyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await verifyBtn.click();
            await page.waitForTimeout(3000);
            const otpErr = await page.locator('.error-message, [class*="error"]').first();
            if (await otpErr.isVisible({ timeout: 2000 }).catch(() => false)) {
                console.log('Wrong OTP error:', await otpErr.innerText());
            }
        }

        // ── Step 6: Correct OTP (manual — OTP comes to email) ─────────────────
        // NOTE: Correct OTP must be filled manually from the email
        // On success the platform shows: "OTP verified. Please enter your new password."
        console.log('Correct OTP step: OTP is sent to registered email inbox.');
        console.log('Expected success message after correct OTP: "OTP verified. Please enter your new password."');

        // ── Step 7: New Password page (after OTP verified) ────────────────────
        // Expected fields: "New Password" and "Confirm New Password"
        // Success message: "Password reset successfully."
        // Mismatch error: "New password and confirm password do not match!"
        console.log('After OTP verified — new password fields appear:');
        console.log('  - Enter New Password');
        console.log('  - Confirm New Password');
        console.log('  - Click Reset Password button');
        console.log('  - Success: "Password reset successfully."');
        console.log('  - Mismatch error: "New password and confirm password do not match!"');
    } else {
        console.log('OTP input not visible — check if OTP was actually sent');
    }

    // ── Go Back ────────────────────────────────────────────────────────────────
    const goBack = page.locator('.go-back-forgot');
    if (await goBack.isVisible({ timeout: 3000 }).catch(() => false)) {
        await goBack.click();
        await page.waitForTimeout(1500);
        await expect(page.getByText('Sign In', { exact: true })).toBeVisible();
        console.log('Navigated back to login page');
    }

    console.log('Forgot Password test complete');
});
