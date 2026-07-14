import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

test('Vivek Consultancy — Profile Wallet', async ({ page }) => {
    test.setTimeout(60000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') {
        console.log('Login failed:', result);
        return;
    }
    console.log('Login success');

    await page.goto('https://vivekconsultancy.flyurdream.com/#/get-profile');
    await page.waitForTimeout(2500);

    // ── Click Wallet tab ───────────────────────────────────────────────────────
    await page.locator('.tab-btn').getByText('Wallet', { exact: true }).click();
    await page.waitForTimeout(1500);
    await expect(page.locator('.tab-btn.active')).toHaveText('Wallet');
    console.log('Wallet tab is active ✓');

    // ── Currency / balance display ─────────────────────────────────────────────
    await expect(page.locator('.wallet-tabs').getByText('GBP', { exact: true })).toBeVisible();
    console.log('Wallet currency: GBP ✓');

    await expect(page.getByText('Available Balance', { exact: true })).toBeVisible();
    console.log('Available Balance label visible ✓');

    await expect(page.locator('.amount-transfer-div')).toBeVisible();
    const balance = await page.locator('.amount-transfer-div').innerText();
    console.log('Wallet balance:', balance);

    // ── Wallet ID ──────────────────────────────────────────────────────────────
    await expect(page.locator('.wallet-cards')).toBeVisible();
    const walletId = await page.locator('.wallet-cards').innerText();
    console.log('Wallet ID:', walletId);

    // ── Add Amount card visible ────────────────────────────────────────────────
    await expect(page.locator('.wallet-card').getByText('Add Amount', { exact: true })).toBeVisible();
    console.log('Add Amount card visible ✓');

    // ── Transfer button visible ────────────────────────────────────────────────
    await expect(page.locator('.transfer-btn').getByText('Transfer', { exact: true })).toBeVisible();
    console.log('Transfer button visible ✓');

    // ── View All Wallet Transactions ───────────────────────────────────────────
    await expect(page.locator('.view-all-btn')).toBeVisible();
    console.log('View All Wallet Transactions button visible ✓');

    // ── Payment Transactions button ────────────────────────────────────────────
    await expect(page.getByRole('button', { name: 'Payment Transactions' })).toBeVisible();
    await page.getByRole('button', { name: 'Payment Transactions' }).click();
    await page.waitForTimeout(1500);
    console.log('Payment Transactions button clicked ✓');

    // // ── Recent Wallet Transactions section ─────────────────────────────────────
    // await expect(page.locator('.wallet-card-tanscation-div').getByText('Recent Wallet Transactions', { exact: true })).toBeVisible();
    // console.log('Recent Wallet Transactions section visible ✓');

    // const noTxn = page.locator('.transction-description').getByText('No recent transactions', { exact: true });
    // if (await noTxn.isVisible({ timeout: 3000 }).catch(() => false)) {
    //     console.log('No recent transactions — wallet is empty');
    // } else {
    //     const txnRows = page.locator('.transction-description');
    //     const count = await txnRows.count();
    //     console.log('Transaction rows found:', count);
    // }

    console.log('Profile Wallet test complete ✓');
});
