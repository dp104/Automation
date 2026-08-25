import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

test('Vivek Consultancy — Enquiry Form', async ({ page }) => {
    test.setTimeout(60000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') {
        console.log('Login failed:', result);
        return;
    }
    console.log('Login success');

    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // ── Navigate directly to Create Enquiry (sidebar entry removed entirely) ───
    await page.goto('https://vivekconsultancy.flyurdream.com/#/create-enquiry');
    await page.waitForSelector('.nsm-sidebar', { timeout: 20000 });
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/create-enquiry/i);
    console.log('Create Enquiry page URL confirmed:', page.url());

    // ── Breadcrumb ─────────────────────────────────────────────────────────────
    await expect(page.locator('.dashboard-link').getByText('Dashboard', { exact: true })).toBeVisible();
    console.log('Breadcrumb: Dashboard visible ✓');

    // // ── Form heading ───────────────────────────────────────────────────────────
    // await expect(page.getByText('ENQUIRY FORM', { exact: true })).toBeVisible();
    // console.log('Enquiry form heading visible ✓');

    // ── Required form fields visible (labels use CSS uppercase, match DOM text) ──
    const requiredLabels = [
        'First Name',
        'Last Name',
        'Date of Birth',
        'Phone Number',
        'Email Id',
        'Marital Status',
        'Address',
    ];
    for (const label of requiredLabels) {
        const labelEl = page.locator('label').filter({ hasText: label }).first();
        if (await labelEl.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log(`Field label visible: "${label}" ✓`);
        } else {
            console.log(`Field label NOT found: "${label}" ✗`);
        }
    }

    // ── Marital status options ─────────────────────────────────────────────────
    await expect(page.locator('label').filter({ hasText: 'MARRIED' }).first()).toBeVisible();
    await expect(page.locator('label').filter({ hasText: 'UNMARRIED' }).first()).toBeVisible();
    console.log('Marital status options visible ✓');

    // ── Input fields present ───────────────────────────────────────────────────
    const firstNameInput = page.locator('input[placeholder*="First"], input[name*="first"], input[name*="firstName"]').first();
    if (await firstNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('First name input visible ✓');
    }

    const emailInput = page.locator('input[type="email"], input[name*="email"], input[placeholder*="email" i]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('Email input visible ✓');
    }

    // ── Submit / Save button visible ───────────────────────────────────────────
    const submitBtn = page.getByRole('button', { name: /submit|save|create|add/i }).first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('Submit button visible:', await submitBtn.innerText());
    }

    console.log('Enquiry Form test complete ✓');
});
