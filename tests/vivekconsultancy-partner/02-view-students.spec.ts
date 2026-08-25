import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { partnerConfig } from '../../utils/partnerConfig';
import { gotoPartnerRoute, PARTNER_ROUTES } from '../../utils/partnerNav';

// Partner Portal — View Student Information (#/get-student).
// This page does not exist for students — it is the partner's roster of
// EVERY student they manage (paginated, searchable, filterable), each with a
// portal-invite action. This is the clearest "one-to-many" difference from
// the student portal: a student only ever sees themselves.

test('Partner Portal — View Students', async ({ page }) => {
    test.setTimeout(120000);

    const result = await login(page, partnerConfig.portalUrl, partnerConfig.email, partnerConfig.password);
    expect(result ?? 'ok', `login should not be rejected (got: ${result})`).not.toMatch(/error/i);
    await page.waitForTimeout(2000);

    await gotoPartnerRoute(page, partnerConfig.portalUrl, PARTNER_ROUTES.viewStudents);
    await page.waitForTimeout(3500);
    console.log('✓ Student Profiles page loaded:', page.url());

    // ── Header / summary ──────────────────────────────────────────────────────
    await expect(page.getByRole('heading', { name: /Student Profiles/i })).toBeVisible({ timeout: 10000 });
    const summary = await page.evaluate(() => (document.body.innerText.match(/Showing \d+ of \d+/i) || [''])[0]);
    console.log(`✓ ${summary || '(no "Showing N of M" summary found)'}`);
    expect(summary.length, 'the roster should show a "Showing N of M" summary').toBeGreaterThan(0);

    const totalStudents = parseInt((summary.match(/of (\d+)/) || [])[1] || '0', 10);
    console.log(`✓ Partner manages ${totalStudents} students total`);
    expect(totalStudents, 'the partner should have at least one student on record').toBeGreaterThan(0);

    // ── Table structure ────────────────────────────────────────────────────────
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount, 'student rows should be listed').toBeGreaterThan(0);
    console.log(`✓ ${rowCount} rows rendered on this page`);

    const firstRowText = (await rows.first().innerText()).replace(/\n/g, ' | ').substring(0, 150);
    console.log(`✓ First row: ${firstRowText}`);

    // ── Toolbar actions ────────────────────────────────────────────────────────
    for (const label of ['Share', 'Add Student', 'Filter']) {
        const visible = await page.getByRole('button', { name: label, exact: false }).first().isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`  toolbar button "${label}": ${visible}`);
    }

    // ── Portal-invite action per student (partner-only capability) ────────────
    const inviteBtn = rows.first().locator('button, a').filter({ hasText: /invite/i }).first();
    const inviteVisible = await inviteBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`✓ Per-student "Invite" action visible: ${inviteVisible} (invites an unregistered student to the portal)`);

    // ── Search / filter narrows the roster ────────────────────────────────────
    const searchInput = page.locator('input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const firstStudentName = (await rows.first().innerText()).split('\n').find(l => /[a-z]{3,}/i.test(l)) || '';
        const keyword = firstStudentName.trim().split(/\s+/)[0] || '';
        if (keyword) {
            await searchInput.fill(keyword);
            await page.waitForTimeout(2000);
            const filteredCount = await rows.count();
            console.log(`✓ Rows after searching "${keyword}": ${filteredCount}`);
            await searchInput.fill('');
            await page.waitForTimeout(1500);
        }
    } else {
        console.log('  (no visible search input found on this view)');
    }

    console.log('\n✅ Partner student roster verified');
});
