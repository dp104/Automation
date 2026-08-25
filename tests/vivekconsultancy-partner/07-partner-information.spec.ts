import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { partnerConfig } from '../../utils/partnerConfig';
import { gotoPartnerRoute, PARTNER_ROUTES } from '../../utils/partnerNav';

// Partner Portal — Partner Information / "Agent Form" (#/agent-form).
// A student has no equivalent — this is the partner's OWN white-label
// company profile: name, business registration, website, portal subdomain
// (its "Full URL" IS this tenant's base URL, e.g.
// https://vivekconsultancy.flyurdream.com), address, logo, plus separate tabs
// for Primary Contact, Agent Details, Bank Details, and Remarks. This is
// effectively the tenant-configuration surface exposed to the partner owner.

test('Partner Portal — Partner (Company) Information', async ({ page }) => {
    test.setTimeout(120000);

    const result = await login(page, partnerConfig.portalUrl, partnerConfig.email, partnerConfig.password);
    expect(result ?? 'ok', `login should not be rejected (got: ${result})`).not.toMatch(/error/i);
    await page.waitForTimeout(2000);

    await gotoPartnerRoute(page, partnerConfig.portalUrl, PARTNER_ROUTES.partnerInformation);
    await page.waitForTimeout(3000);
    await expect(page.getByText('Partner Details', { exact: false }).first()).toBeVisible({ timeout: 10000 });
    console.log('✓ Partner Information (Agent Form) loaded:', page.url());

    // ── All 5 tabs present ─────────────────────────────────────────────────────
    const expectedTabs = ['Company Details', 'Primary Contact', 'Agent Details', 'Bank Details', 'Remarks'];
    for (const tab of expectedTabs) {
        const visible = await page.locator('.tab-button').filter({ hasText: tab }).first().isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`  tab "${tab}": ${visible ? '✓' : '✗ MISSING'}`);
        expect(visible, `"${tab}" tab should be present`).toBe(true);
    }

    // ── Company Details shows THIS tenant's own portal URL ─────────────────────
    const portalUrlText = await page.evaluate(() => (document.body.innerText.match(/Full URL:\s*(\S+)/i) || [])[1] || '');
    console.log(`✓ Configured portal URL: ${portalUrlText}`);
    const expectedHost = new URL(partnerConfig.portalUrl.replace('/#/', '')).host;
    expect(portalUrlText, 'the Full URL shown should match this tenant').toContain(expectedHost);

    // ── Walk the remaining tabs and confirm content renders ────────────────────
    for (const tab of expectedTabs.slice(1)) {
        await page.locator('.tab-button').filter({ hasText: tab }).first().click();
        await page.waitForTimeout(1500);
        const active = await page.locator('.tab-button').filter({ hasText: tab }).first().evaluate(el => el.className);
        console.log(`  [${tab}] active class: "${active}"`);
        const contentLen = await page.evaluate(() => document.body.innerText.length);
        expect(contentLen, `"${tab}" tab should render some content`).toBeGreaterThan(100);
    }

    console.log('\n✅ Partner Information page verified across all tabs');
});
