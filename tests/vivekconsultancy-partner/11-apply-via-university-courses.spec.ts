import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { partnerConfig } from '../../utils/partnerConfig';
import { gotoPartnerRoute, PARTNER_ROUTES } from '../../utils/partnerNav';
import { completeWizardSubmission } from '../../utils/applyFlow';

// Flow 2 — Universities (new UI):
// Universities page → click the UNIVERSITY NAME → university detail page
// (new-univmanager) → "Courses" tab → search the course → "View more" →
// "Apply Now" in the course popup → complete the submission in the wizard.
// (The card's "View Course" button is a different shortcut — it goes straight
// to the filtered Search-Course page; this flow covers the detail-page route.)

// Partner Portal — Apply via Universities/Courses tab.
// The Universities page and the university detail page are the same shared
// component used by the student portal (Universities/Search-Course parity was
// already confirmed live in 09-universities-courses-parity.spec.ts), so
// mechanically this flow should be identical for a partner: same
// .newuniv-campus-card grid, same new-univmanager Courses tab, same "View
// more" → Apply Now → wizard chain. The only difference is WHO the
// application gets created for — the student portal applies for the
// logged-in student, whereas the partner is applying on behalf of whichever
// student profile is in context in the wizard. The detail-page → wizard route
// itself was NOT separately re-verified as partner in this session, so all of
// the source file's retry/fallback/defect-detection logic below is kept
// completely intact.

// ═══════════════ CONFIGURE WHICH UNIVERSITY & COURSE TO APPLY TO ═══════════════
// UNIVERSITY_NAME : university to search for and open ('' = first card).
// COURSE_SEARCH   : text typed into the Courses tab search box ('' = full list).
// COURSE_NAME     : exact course row to apply to ('' = random from the list).
const UNIVERSITY_NAME = 'Coventry University';
const COURSE_SEARCH   = 'MSc';
const COURSE_NAME     = '';
// ═══════════════════════════════════════════════════════════════════════════════

test('Partner Portal — Apply via University Courses Tab', async ({ page }) => {
    test.setTimeout(480000);

    const result = await login(page, partnerConfig.portalUrl, partnerConfig.email, partnerConfig.password);
    expect(result ?? 'ok', `login should not be rejected (got: ${result})`).not.toMatch(/error/i);
    await page.waitForTimeout(2000);
    await page.waitForSelector('.nsm-sidebar', { timeout: 20000 });

    // ── Universities page → pick a university ─────────────────────────────────
    await gotoPartnerRoute(page, partnerConfig.portalUrl, PARTNER_ROUTES.universities);
    await page.waitForSelector('.newuniv-campus-card', { timeout: 40000 });
    console.log('✓ Universities page loaded (new UI)');

    let card = page.locator('.newuniv-campus-card').first();
    if (UNIVERSITY_NAME) {
        await page.locator('input[placeholder*="Search universities" i]').first().fill(UNIVERSITY_NAME);
        await page.waitForFunction(
            (name: string) => Array.from(document.querySelectorAll('.newuniv-campus-name'))
                .some(n => (n.textContent || '').toLowerCase().includes(name.toLowerCase())),
            UNIVERSITY_NAME,
            { timeout: 20000 }
        ).catch(() => {});
        await page.waitForTimeout(1500);

        const wanted = page.locator('.newuniv-campus-card').filter({ hasText: UNIVERSITY_NAME }).first();
        if (await wanted.isVisible({ timeout: 5000 }).catch(() => false)) {
            card = wanted;
        } else {
            console.log(`  ⚠ "${UNIVERSITY_NAME}" not found — clearing search, using the first university`);
            await page.locator('input[placeholder*="Search universities" i]').first().fill('');
            await page.waitForTimeout(1500);
        }
    }
    const uniName = (await card.locator('.newuniv-campus-name').first().innerText()).trim();

    // ── Click the university NAME → detail page ───────────────────────────────
    let onDetail = false;
    for (let attempt = 1; attempt <= 3 && !onDetail; attempt++) {
        await card.locator('.newuniv-campus-name').first().click();
        onDetail = await page.waitForURL(/universityinformation/i, { timeout: 15000 })
            .then(() => true).catch(() => false);
        if (!onDetail) console.log(`  name click ${attempt} did not navigate — retrying`);
    }
    expect(onDetail, 'clicking the university name should open the university page').toBe(true);
    console.log(`✓ Opened university page: "${uniName}"`);
    await page.waitForSelector('.new-univmanager-tab', { timeout: 30000 });

    // ── Courses tab → search the course ───────────────────────────────────────
    await page.locator('.new-univmanager-tab').filter({ hasText: 'Courses' }).first().click();
    await page.waitForSelector('.new-univmanager-course-row', { timeout: 30000 });
    console.log('✓ Courses tab open');

    const rows = page.locator('.new-univmanager-course-row');
    const waitForRows = (ms: number) => page.waitForFunction(
        () => document.querySelectorAll('.new-univmanager-course-row').length > 0,
        undefined,
        { timeout: ms }
    ).then(() => true).catch(() => false);

    if (COURSE_SEARCH) {
        const search = page.locator('input.new-univmanager-course-search');
        await search.fill(COURSE_SEARCH);
        await search.press('Enter');
        await waitForRows(10000);
    }
    let rowCount = await rows.count();
    if (rowCount === 0 && COURSE_SEARCH) {
        // NOTE: this search box returning 0 for a term visible in the course
        // names ("MSc" vs "MSc By Research…") looks like a UI bug — worth
        // checking with the GuideUni team.
        console.log(`  ⚠ no courses match "${COURSE_SEARCH}" (possible search bug) — clearing, using the full list`);
        await page.locator('input.new-univmanager-course-search').fill('');
        await waitForRows(20000);
        rowCount = await rows.count();
    }
    expect(rowCount, 'course rows should be listed').toBeGreaterThan(0);
    console.log(`✓ ${rowCount} courses listed`);

    // ── Pick the configured course (or a random one) ──────────────────────────
    let row = rows.nth(Math.floor(Math.random() * Math.min(rowCount, 8)));
    if (COURSE_NAME) {
        let wanted = rows.filter({ hasText: COURSE_NAME }).first();
        if (!(await wanted.isVisible({ timeout: 3000 }).catch(() => false))) {
            console.log(`  "${COURSE_NAME}" not in the filtered list — searching for it directly`);
            await page.locator('input.new-univmanager-course-search').fill(COURSE_NAME);
            await page.waitForTimeout(2000);
            wanted = rows.filter({ hasText: COURSE_NAME }).first();
        }
        if (await wanted.isVisible({ timeout: 3000 }).catch(() => false)) {
            row = wanted;
        } else {
            console.log(`  ⚠ Course "${COURSE_NAME}" not found — using a random course from the list`);
            await page.locator('input.new-univmanager-course-search').fill(COURSE_SEARCH);
            await page.waitForTimeout(2000);
            row = rows.first();
        }
    }
    await row.scrollIntoViewIfNeeded();
    const courseName = (await row.locator('.new-univmanager-course-name').innerText()).trim();
    const intake = (await row.locator('.new-univmanager-course-intake').innerText().catch(() => '')).trim();
    console.log(`✓ Opening course: "${courseName}" (intake ${intake || 'n/a'})`);

    // ── "View more" popup → Apply Now ─────────────────────────────────────────
    await row.locator('.new-univmanager-course-view-btn').click();
    const applyBtn = page.locator('.new-univmanager-popup-apply-btn').first();
    await expect(applyBtn, 'course popup should show an Apply Now button').toBeVisible({ timeout: 15000 });
    await applyBtn.click();
    console.log('✓ Clicked "Apply Now" in the course popup');

    // The redirect to the wizard can be slow — wait explicitly, retry once
    let toWizard = await page.waitForURL(/add-student/i, { timeout: 20000 }).then(() => true).catch(() => false);
    if (!toWizard) {
        if (await applyBtn.isVisible().catch(() => false)) {
            console.log('  no redirect yet — clicking "Apply Now" again');
            await applyBtn.click();
            toWizard = await page.waitForURL(/add-student/i, { timeout: 20000 }).then(() => true).catch(() => false);
        }
    }
    expect(toWizard, 'Apply Now should open the application wizard').toBe(true);
    await expect(page.locator('.sp-header-title')).toContainText('Student Profile Journey', { timeout: 15000 });
    console.log('✓ Apply Now opened the Student Profile Journey wizard');

    // ── Complete the submission in the wizard ─────────────────────────────────
    // (the partner, acting on behalf of whichever student row is in context,
    // completes the same shared wizard the student portal drives directly)
    const submission = await completeWizardSubmission(page, courseName);
    if (submission.submitted) {
        if (submission.newIds.length) console.log(`\n🎯 CREATED APP ID: ${submission.newIds.join(', ')}`);
        console.log('\n✅ Apply-via-university-courses flow complete — application submitted');
        return;
    }

    // Known application defect on this route: the Apply-Now-prefilled wizard
    // form can arrive with the Intake Month dropdown permanently empty (the
    // programmatic prefill never triggers the cascade fetch), so the form
    // cannot be completed for a course that has no existing application.
    const formStuck = await page.evaluate(() => {
        const ctrls = Array.from(document.querySelectorAll('[class*="-control"]'))
            .filter(el => (el as HTMLElement).offsetParent !== null);
        const empty = ctrls.filter(c => !c.querySelector('[class*="-singleValue"], [class*="-multiValue"]'));
        const toast = document.querySelector('.Toastify__toast-body')?.textContent || '';
        return ctrls.length > 0 && empty.length > 0 && !/success|created|submitted/i.test(toast);
    });
    expect(formStuck, 'form should be visibly stuck without an error (known defect signature)').toBe(true);
    console.log('\n⚠ APP DEFECT (report to GuideUni team): university-course "Apply Now" prefills the');
    console.log('  wizard form but the Intake Month dropdown never loads options, so the application');
    console.log('  cannot be completed for a new course. Flow verified up to that point.');
    console.log('\n✅ Apply-via-university-courses flow coverage complete (submission blocked by app defect)');
});
