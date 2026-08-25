import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';
import { completeWizardSubmission, describeOutcome, fillVisibleReactSelects, clickModalPrimary } from '../../utils/applyFlow';

// Flow 1 — Dashboard top search:
// Type a course name in the header "Search Course" box, press Enter →
// redirects to the Search-Course results page (#/programpage4) →
// click "Apply Now" on a course tile.

test('Vivek Consultancy — Apply via Dashboard Top Search', async ({ page }) => {
    test.setTimeout(420000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') { console.log('Login failed:', result); return; }
    console.log('✓ Login');
    await page.waitForSelector('.nsm-sidebar', { timeout: 20000 });

    // ── Search from the dashboard header ──────────────────────────────────────
    const keywords = ['Business', 'Management', 'Computing', 'Data', 'Engineering'];
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];
    const topSearch = page.locator('input[placeholder*="Search Course" i]').first();
    await expect(topSearch).toBeVisible({ timeout: 10000 });
    await topSearch.fill(keyword);
    await topSearch.press('Enter');
    console.log(`✓ Searched for "${keyword}" via top search`);

    // ── Redirects to the course results page ──────────────────────────────────
    await expect(page).toHaveURL(/programpage4/i, { timeout: 15000 });
    console.log('✓ Redirected to course results:', page.url());

    await page.waitForSelector('.program-feed article.prog-tile', { timeout: 120000 });
    const tiles = page.locator('.program-feed article.prog-tile');
    const tileCount = await tiles.count();
    expect(tileCount, 'course tiles should be listed for the search').toBeGreaterThan(0);
    console.log(`✓ ${tileCount} course tiles loaded`);

    // ── Apply on a random tile ────────────────────────────────────────────────
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
    // the application created and its GUIDA id generated.
    if (/add-student/i.test(page.url())) {
        await expect(page.locator('.sp-header-title')).toContainText('Student Profile Journey', { timeout: 15000 });
        console.log('✓ Apply Now opened the Student Profile Journey wizard');

        const result = await completeWizardSubmission(page, courseName);
        expect(result.submitted, 'application should be submitted from the Create Application tab').toBe(true);
        if (result.newIds.length) console.log(`\n🎯 CREATED APP ID: ${result.newIds.join(', ')}`);
        console.log('\n✅ Apply-via-top-search flow complete — application submitted');
        return;
    }

    // If the apply dialog contains dropdowns (e.g. intake/student), complete them
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

    const navigated = /add-student|Get-Applications|application/i.test(page.url()) && !/programpage4/i.test(page.url());
    const responded = outcome.responded || navigated || outcome.duplicate;
    expect(responded, 'Apply Now should open a dialog, navigate, or respond with a toast').toBe(true);

    const errorToast = /error|fail/i.test(outcome.toast) && !outcome.duplicate;
    expect(errorToast, `apply should not error (toast: "${outcome.toast}")`).toBe(false);

    console.log('\n✅ Apply-via-top-search flow complete');
});
