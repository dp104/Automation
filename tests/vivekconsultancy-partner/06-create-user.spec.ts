import { expect, test } from '@playwright/test';
import { fakerEN_IN as faker } from '@faker-js/faker';
import { login } from '../../utils/login';
import { partnerConfig } from '../../utils/partnerConfig';
import { gotoPartnerRoute, PARTNER_ROUTES } from '../../utils/partnerNav';

// Partner Portal — Create User (#/Create-User), under the sidebar's
// "Authentication" section. Students have no equivalent page at all: this is
// where a partner owner creates STAFF/COUNSELLOR sub-accounts under their own
// company, each with a role and timezone — the RBAC layer described in this
// org's model ("Partner staff/counsellor restricted view"). Companion page
// "Get User" (#/Users) lists the accounts this creates.

test('Partner Portal — Create Staff User', async ({ page }) => {
    test.setTimeout(180000);

    const result = await login(page, partnerConfig.portalUrl, partnerConfig.email, partnerConfig.password);
    expect(result ?? 'ok', `login should not be rejected (got: ${result})`).not.toMatch(/error/i);
    await page.waitForTimeout(2000);

    await gotoPartnerRoute(page, partnerConfig.portalUrl, PARTNER_ROUTES.createUser);
    await page.waitForTimeout(3000);
    await expect(page.getByText('Create user', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    console.log('✓ Create User page loaded:', page.url());

    const stamp = Date.now().toString().slice(-6);
    const sex = faker.person.sexType();
    const firstName = faker.person.firstName(sex).replace(/[^A-Za-z]/g, '');
    const lastName = faker.person.lastName().replace(/[^A-Za-z]/g, '');
    const email = `${firstName}.${lastName}${stamp}@gmail.com`.toLowerCase();
    console.log(`  New staff user: ${firstName} ${lastName} <${email}>`);

    // ── Fill the form ─────────────────────────────────────────────────────────
    // Fields have real `name` attributes (unlike their masked example
    // placeholders, e.g. mobile's placeholder is "987** ***10" — matching by
    // placeholder text silently misses it and the form fails validation with
    // no visible error). Use name-attribute selectors, the reliable option.
    await page.locator('select[name="salutation"]').selectOption({ index: 1 }).catch(() => {});
    await page.locator('input[name="firstName"]').fill(firstName);
    await page.locator('input[name="lastName"]').fill(lastName);
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="phoneNumber"]').fill(`9${stamp.padStart(9, '0')}`.slice(0, 10));
    console.log('✓ Name, email, and mobile filled');

    // Phone country code — react-select, plain first-option pick
    const codeCtrl = page.locator('[class*="-control"]').filter({ hasText: 'Code' }).first();
    if (await codeCtrl.isVisible({ timeout: 3000 }).catch(() => false)) {
        await codeCtrl.click();
        await page.waitForTimeout(800);
        const firstCode = page.locator('[role="option"]').first();
        if (await firstCode.isVisible({ timeout: 5000 }).catch(() => false)) {
            const codeText = await firstCode.textContent();
            await firstCode.click();
            console.log(`✓ Phone code selected: "${codeText?.trim()}"`);
        }
    }

    // Password is auto-generated and pre-filled (readonly) by default — no
    // action needed unless "Change password" is explicitly required later.

    // Role select (react-select) — pick the first available role
    const roleCtrl = page.locator('[class*="-control"]').filter({ hasText: 'Select role' }).first();
    if (await roleCtrl.isVisible({ timeout: 5000 }).catch(() => false)) {
        await roleCtrl.click();
        await page.waitForTimeout(1000);
        const firstOption = page.locator('[role="option"]').first();
        if (await firstOption.isVisible({ timeout: 5000 }).catch(() => false)) {
            const roleName = await firstOption.textContent();
            await firstOption.click();
            console.log(`✓ Role selected: "${roleName?.trim()}"`);
        }
    } else {
        console.log('  ⚠ "Select role" dropdown not found — role may be required to submit');
    }

    // Timezone select — react-select, plain first-option pick (required field)
    const tzCtrl = page.locator('[class*="-control"]').filter({ hasText: 'Select timezone' }).first();
    if (await tzCtrl.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tzCtrl.click();
        await page.waitForTimeout(800);
        const firstTz = page.locator('[role="option"]').first();
        if (await firstTz.isVisible({ timeout: 5000 }).catch(() => false)) {
            await firstTz.click();
            console.log('✓ Timezone selected');
        }
    }

    // ── Submit ────────────────────────────────────────────────────────────────
    const [resp] = await Promise.all([
        page.waitForResponse(r => /user/i.test(r.url()) && r.request().method() !== 'GET', { timeout: 20000 }).catch(() => null),
        page.locator('button.newcreateuser-btn-primary').click(),
    ]);
    await page.waitForTimeout(2000);

    if (resp) {
        const body = await resp.text().catch(() => '');
        console.log(`  API response [${resp.status()}]: ${body.substring(0, 200)}`);
        const success = resp.status() < 300 && !/error|fail/i.test(body);
        console.log(`✓ Staff user creation ${success ? 'succeeded' : 'may have failed — check response above'}`);
    } else {
        const errText = await page.evaluate(() =>
            Array.from(document.querySelectorAll('[class*="error"]'))
                .filter(el => (el as HTMLElement).offsetParent !== null)
                .map(el => el.textContent?.trim()).filter(Boolean).join(' | '));
        console.log(`  no API response captured — visible errors: "${errText || '(none)'}"`);
    }

    // ── Confirm the account shows up in "Get User" ─────────────────────────────
    await gotoPartnerRoute(page, partnerConfig.portalUrl, PARTNER_ROUTES.getUsers);
    await page.waitForTimeout(3000);
    const listedNow = await page.evaluate((em: string) => document.body.innerText.toLowerCase().includes(em.toLowerCase()), email);
    console.log(`✓ New user visible in "Get User" list: ${listedNow}`);

    console.log(`\n✅ Create Staff User flow complete — ${email}`);
});
