import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { partnerConfig } from '../../utils/partnerConfig';
import { gotoPartnerRoute, PARTNER_ROUTES } from '../../utils/partnerNav';

// Partner Portal — Universities/Courses.
// UNLIKE most of this folder, Universities and Search-Course are IDENTICAL
// shared components between the student and partner portals — same
// .newuniv-campus-card grid (tests/vivekconsultancy-student/15/16) and same
// prog-tile course search (tests 17/18/33-35). This is a deliberate parity
// smoke test rather than a deep re-test: full coverage of these pages already
// exists in tests/vivekconsultancy-student and doesn't need duplicating here.

test('Partner Portal — Universities/Courses parity with student portal', async ({ page }) => {
    test.setTimeout(120000);

    const result = await login(page, partnerConfig.portalUrl, partnerConfig.email, partnerConfig.password);
    expect(result ?? 'ok', `login should not be rejected (got: ${result})`).not.toMatch(/error/i);
    await page.waitForTimeout(2000);

    await gotoPartnerRoute(page, partnerConfig.portalUrl, PARTNER_ROUTES.universities);
    await page.waitForSelector('.newuniv-campus-card', { timeout: 40000 });
    const cardCount = await page.locator('.newuniv-campus-card').count();
    expect(cardCount, 'the same universities grid should render for a partner').toBeGreaterThan(0);
    console.log(`✓ Universities page: ${cardCount} cards (identical component to the student portal)`);

    await gotoPartnerRoute(page, partnerConfig.portalUrl, PARTNER_ROUTES.searchCourse);
    await page.waitForSelector('.program-feed article.prog-tile', { timeout: 60000 });
    const tileCount = await page.locator('.program-feed article.prog-tile').count();
    expect(tileCount, 'the same course search feed should render for a partner').toBeGreaterThan(0);
    console.log(`✓ Search-Course page: ${tileCount} course tiles (identical component to the student portal)`);

    console.log('\n✅ Universities/Courses parity confirmed — see tests/vivekconsultancy-student for full coverage');
});
