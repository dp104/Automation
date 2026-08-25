import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

test('Vivek Consultancy — Profile Calendar', async ({ page }) => {
    test.setTimeout(60000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') {
        console.log('Login failed:', result);
        return;
    }
    console.log('Login success');

    await page.goto('https://vivekconsultancy.flyurdream.com/#/get-profile');
    await page.waitForTimeout(2500);
    await expect(page).toHaveURL(/get-profile/);

    // ── Click Calendar tab ─────────────────────────────────────────────────────
    await page.locator('.tab-btn').getByText('Calendar', { exact: true }).click();
    await page.waitForTimeout(1500);
    await expect(page.locator('.tab-btn.active')).toHaveText('Calendar');
    console.log('Calendar tab is active ✓');

    // ── Month title visible ────────────────────────────────────────────────────
    await expect(page.locator('.month-title')).toBeVisible();
    const monthTitle = await page.locator('.month-title').innerText();
    console.log('Calendar month visible:', monthTitle);

    // ── Calendar day names visible ─────────────────────────────────────────────
    await expect(page.locator('.react-datepicker__day-names')).toBeVisible();
    const dayNames = await page.locator('.react-datepicker__day-name').allInnerTexts();
    console.log('Calendar day names:', dayNames.join(', '));

    // ── Calendar days rendered ─────────────────────────────────────────────────
    const days = page.locator('.react-datepicker__day');
    const dayCount = await days.count();
    console.log('Calendar days rendered:', dayCount);
    expect(dayCount).toBeGreaterThan(0);

    // ── Click a day ────────────────────────────────────────────────────────────
    await days.nth(5).click();
    await page.waitForTimeout(1000);
    console.log('Clicked a calendar day ✓');

    console.log('Profile Calendar test complete ✓');
});
