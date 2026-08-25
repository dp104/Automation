import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { partnerConfig } from '../../utils/partnerConfig';
import { gotoPartnerRoute, PARTNER_ROUTES } from '../../utils/partnerNav';
import { completeWizardSubmission, describeOutcome, fillVisibleReactSelects, clickModalPrimary } from '../../utils/applyFlow';

// Partner Portal — Apply via Search-Course Filters (#/programpage4).
// Search-Course is one of the pages confirmed IDENTICAL between the student
// and partner portals (see test 09 — same .msd-trigger filter row, same
// .program-feed prog-tile grid, 50 tiles observed live). Mechanically nothing
// changes for a partner running this flow: same filters, same tiles, same
// Apply Now → Student Profile Journey wizard. The only real difference is WHO
// the resulting application gets created for — the partner is acting on
// behalf of whichever student profile the wizard resolves to, not applying
// for themselves.
// Note: all .msd-trigger buttons need { force: true } (overlay intercepts clicks).

test('Partner Portal — Apply via Search-Course Filters', async ({ page }) => {
    test.setTimeout(480000);

    const result = await login(page, partnerConfig.portalUrl, partnerConfig.email, partnerConfig.password);
    expect(result ?? 'ok', `login should not be rejected (got: ${result})`).not.toMatch(/error/i);
    await page.waitForTimeout(2000);

    await gotoPartnerRoute(page, partnerConfig.portalUrl, PARTNER_ROUTES.searchCourse);
    await page.waitForSelector('.program-feed article.prog-tile', { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(2000);
    console.log('✓ Search-Course page loaded');

    const filterTriggers = page.locator('.search-row .msd-trigger');
    expect(await filterTriggers.count(), '5 filter triggers should be present').toBe(5);

    // Select an option in filter dropdown n; type toSearch first when provided.
    // Empty match = pick the first option in the list.
    const setFilter = async (n: number, label: string, toSearch: string, match?: RegExp) => {
        await filterTriggers.nth(n).click({ force: true });
        await page.waitForTimeout(800);
        await expect(page.locator('.msd-dropdown')).toBeVisible({ timeout: 5000 });
        if (toSearch) {
            await page.locator('.msd-dropdown input').first().fill(toSearch);
            await page.waitForTimeout(600);
        }
        const opt = match
            ? page.locator('.msd-option').filter({ hasText: match }).first()
            : page.locator('.msd-option').first();
        const optText = (await opt.innerText().catch(() => '')).trim();
        await opt.click({ force: true });
        await page.waitForTimeout(700);
        // close dropdown if it stays open (multi-select dropdowns)
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(300);
        console.log(`✓ Filter "${label}" = "${optText.substring(0, 50)}"`);
        return optText;
    };

    // ── All 5 filters ─────────────────────────────────────────────────────────
    await setFilter(0, 'Nationality', 'India', /^India$/);
    await setFilter(1, 'Destination Country', 'United Kingdom', /United Kingdom/);
    await setFilter(2, 'Academic Level', '', /Postgraduate/i);
    const university = await setFilter(3, 'University', '', undefined);
    const intake = await setFilter(4, 'Intake', '', undefined);
    console.log(`✓ All filters set (university="${university}", intake="${intake}")`);

    // ── Search ────────────────────────────────────────────────────────────────
    await page.locator('button.go-btn').filter({ hasText: 'Search Programs' }).first().click({ force: true });
    console.log('✓ Clicked "Search Programs"');
    await page.waitForTimeout(5000);

    await page.waitForSelector('.program-feed article.prog-tile', { timeout: 60000 });
    const tiles = page.locator('.program-feed article.prog-tile');
    const tileCount = await tiles.count();
    expect(tileCount, 'filtered results should include course tiles').toBeGreaterThan(0);
    console.log(`✓ ${tileCount} filtered course tiles loaded`);

    const firstTileText = (await tiles.first().innerText()).replace(/\n/g, ' | ').substring(0, 200);
    console.log('  first result:', firstTileText);

    // ── Apply on a random filtered tile ───────────────────────────────────────
    const idx = Math.floor(Math.random() * Math.min(tileCount, 6));
    const tile = tiles.nth(idx);
    await tile.scrollIntoViewIfNeeded();
    const courseName = (await tile.locator('.prog-name').first().innerText().catch(() => '(unknown)')).trim();
    console.log(`✓ Applying to tile ${idx + 1}: "${courseName}"`);

    await tile.locator('.apply-now-btn').first().click();
    console.log('✓ Clicked "Apply Now"');

    // ── Handle the apply flow that opens ──────────────────────────────────────
    let outcome = await describeOutcome(page);
    console.log('  URL:', outcome.url);
    if (outcome.modalText) console.log('  Modal:', outcome.modalText.substring(0, 300).replace(/\n/g, ' | '));
    if (outcome.toast) console.log('  Toast:', outcome.toast);

    // Apply Now redirects to the Student Profile Journey wizard. Wait for it to
    // settle, open the Create Application tab, and submit there — only then is
    // the application created and its GUIDA id generated. For the partner,
    // acting on behalf of whichever student row is in context, this is the
    // exact same shared wizard the student portal uses.
    if (/add-student/i.test(page.url())) {
        await expect(page.locator('.sp-header-title')).toContainText('Student Profile Journey', { timeout: 15000 });
        console.log('✓ Apply Now opened the Student Profile Journey wizard');

        const result = await completeWizardSubmission(page, courseName);
        expect(result.submitted, 'application should be submitted from the Create Application tab').toBe(true);
        if (result.newIds.length) console.log(`\n🎯 CREATED APP ID: ${result.newIds.join(', ')}`);
        console.log('\n✅ Apply-via-search-course-filters flow complete — application submitted');
        return;
    }

    const selects = await fillVisibleReactSelects(page, 10);
    if (selects.length) console.log(`✓ Filled ${selects.length} dropdowns in apply dialog`);

    const primary = await clickModalPrimary(page);
    if (primary) {
        console.log(`✓ Clicked dialog action: "${primary}"`);
        outcome = await describeOutcome(page);
        if (outcome.toast) console.log('  Toast:', outcome.toast);
    }

    if (outcome.duplicate) {
        console.log('  ⚠ Portal reports duplicate application for this course — apply flow reached the server (already applied earlier)');
    }

    const navigated = !/programpage4/i.test(page.url());
    const responded = outcome.responded || navigated || outcome.duplicate;
    expect(responded, 'Apply Now should open a dialog, navigate, or respond with a toast').toBe(true);

    const errorToast = /error|fail/i.test(outcome.toast) && !outcome.duplicate;
    expect(errorToast, `apply should not error (toast: "${outcome.toast}")`).toBe(false);

    console.log('\n✅ Apply-via-search-course-filters flow complete');
});
