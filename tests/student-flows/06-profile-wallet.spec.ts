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
    // Wallet redesign — old .wallet-tabs/.amount-transfer-div/.wallet-cards/
    // .wallet-card/.transfer-btn/.view-all-btn classes are gone, replaced by
    // a wt-* naming scheme (.wt-balance-card, .wt-balance-amount,
    // .wt-wallet-id-chip, .wt-hero-action-btn, .wt-toolbar-btn...).
    await expect(page.locator('.wt-balance-card').getByText('GBP', { exact: true }).first()).toBeVisible();
    console.log('Wallet currency: GBP ✓');

    await expect(page.getByText('Available Balance', { exact: true })).toBeVisible();
    console.log('Available Balance label visible ✓');

    await expect(page.locator('.wt-balance-amount')).toBeVisible();
    const balance = await page.locator('.wt-balance-amount').innerText();
    console.log('Wallet balance:', balance);

    // ── Wallet ID ──────────────────────────────────────────────────────────────
    await expect(page.locator('.wt-wallet-id-chip')).toBeVisible();
    const walletId = await page.locator('.wt-wallet-id-chip').innerText();
    console.log('Wallet ID:', walletId);

    // ── Add Amount button visible ──────────────────────────────────────────────
    await expect(page.getByRole('button', { name: 'Add Amount' })).toBeVisible();
    console.log('Add Amount button visible ✓');

    // ── Transfer button visible ────────────────────────────────────────────────
    await expect(page.getByRole('button', { name: 'Transfer', exact: true })).toBeVisible();
    console.log('Transfer button visible ✓');

    // ── View All Wallet Transactions ───────────────────────────────────────────
    await expect(page.getByRole('button', { name: 'View All Wallet Transactions' })).toBeVisible();
    console.log('View All Wallet Transactions button visible ✓');

    // ── Recent Wallet Transactions section ─────────────────────────────────────
    // Must be checked BEFORE clicking "Payment Transactions" below — that
    // button is not a toggle, it navigates to a separate "All Payment
    // Transaction" page and this panel disappears once you're there.
    await expect(page.locator('.wt-tx-panel-title').getByText('Recent Wallet Transactions', { exact: true })).toBeVisible();
    console.log('Recent Wallet Transactions section visible ✓');

    const noTxn = page.locator('.wt-tx-empty').getByText('No recent transactions', { exact: true });
    if (await noTxn.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('No recent transactions — wallet is empty');
    } else {
        const txnRows = page.locator('[class*="wt-tx-row"], [class*="wt-tx-item"]');
        const count = await txnRows.count();
        console.log('Transaction rows found:', count);
    }

    // ── Payment Transactions button — navigates to a dedicated page ───────────
    await expect(page.getByRole('button', { name: 'Payment Transactions' })).toBeVisible();
    await page.getByRole('button', { name: 'Payment Transactions' }).click();
    await page.waitForTimeout(1500);
    console.log('Payment Transactions button clicked ✓');

    // Heading is rendered visually uppercase via CSS but the actual DOM text
    // is title case ("All Payment Transaction").
    await expect(page.getByText('All Payment Transaction', { exact: true })).toBeVisible();
    console.log('All Payment Transaction page loaded ✓');

    // ── Back to Wallet ──────────────────────────────────────────────────────────
    await page.locator('.back-to-courses-btn').click();
    await page.waitForTimeout(1500);
    await expect(page.locator('.tab-btn.active')).toHaveText('Wallet');
    console.log('Navigated back to Wallet ✓');

    console.log('Profile Wallet test complete ✓');
});
