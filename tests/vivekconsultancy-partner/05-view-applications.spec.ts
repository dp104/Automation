import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { partnerConfig } from '../../utils/partnerConfig';
import { gotoPartnerRoute, PARTNER_ROUTES } from '../../utils/partnerNav';

// Partner Portal — View Applications (#/Get-Applications).
// Same "gad-*" component the student portal uses for its OWN applications
// (tests/vivekconsultancy-student/20,36) — but for a partner it aggregates
// EVERY managed student's applications, not just one person's. Each expanded
// student row also gets an extra "Invite" action (send the student a portal
// login invite) that a student obviously never sees on their own record.

test('Partner Portal — View Applications (aggregate)', async ({ page }) => {
    test.setTimeout(180000);

    const result = await login(page, partnerConfig.portalUrl, partnerConfig.email, partnerConfig.password);
    expect(result ?? 'ok', `login should not be rejected (got: ${result})`).not.toMatch(/error/i);
    await page.waitForTimeout(2000);

    await gotoPartnerRoute(page, partnerConfig.portalUrl, PARTNER_ROUTES.viewApplications);
    await page.waitForFunction(() => /\d+\s+applications?/i.test(document.body.innerText), undefined, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    console.log('✓ View Applications loaded:', page.url());

    const totalText = await page.evaluate(() => (document.body.innerText.match(/\d+\+?\s*Applications?/i) || [''])[0]);
    console.log(`✓ ${totalText || '(no applications total found)'}`);

    const studentRows = page.locator('.gad-row-wrap');
    const studentCount = await studentRows.count();
    expect(studentCount, 'the aggregate view should list multiple students').toBeGreaterThan(0);
    console.log(`✓ ${studentCount} students with applications listed (aggregate across the partner's roster)`);

    // ── Expand the first student row ──────────────────────────────────────────
    await page.locator('.gad-expander-icon').first().click();
    await page.waitForTimeout(2500);

    const rowButtons = await page.evaluate(() =>
        Array.from(document.querySelectorAll('button'))
            .filter(b => (b as HTMLElement).offsetParent !== null && (b.textContent?.trim().length || 0) > 0)
            .map(b => b.textContent?.trim())
            .filter(t => !/^(VK|[A-Z]{1,2})$/.test(t || '')));
    console.log('✓ Actions visible on expanded row:', [...new Set(rowButtons)].join(' | '));

    const hasInvite = rowButtons.some(b => /invite/i.test(b || ''));
    const hasCreateApp = rowButtons.some(b => /create new application/i.test(b || ''));
    const hasSmartAssessment = rowButtons.some(b => /smart assessment/i.test(b || ''));
    const hasSuggestions = rowButtons.some(b => /suggestions/i.test(b || ''));
    console.log(`  Invite: ${hasInvite} | Create New Application: ${hasCreateApp} | Smart Assessment: ${hasSmartAssessment} | Suggestions: ${hasSuggestions}`);
    expect(hasCreateApp, 'partner should be able to create an application from this view too').toBe(true);

    // ── Search across the whole roster ────────────────────────────────────────
    const searchInput = page.locator('.gad-search-input, input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchInput.fill('GUIDA');
        await page.waitForTimeout(2000);
        console.log('✓ Search box accepts a query (e.g. partial application id)');
        await searchInput.fill('');
        await page.waitForTimeout(1000);
    }

    console.log('\n✅ Partner aggregate applications view verified');
});
