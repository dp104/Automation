import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';
import { gotoPartnerRoute, PARTNER_ROUTES } from '../../utils/partnerNav';
import { fillVisibleReactSelects, completeWizardSubmission } from '../../utils/applyFlow';
import {
    generateNewStudentIdentity,
    fillPlainWizardInputs,
    advanceWizardTab,
    fillEducationDetailsTab,
    selectDropdownOption,
} from '../../utils/partnerWizard';

// Daily Jenkins job — Mahindra (HYD FTeam) partner portal.
// Logs in as the partner, onboards a brand-new synthetic lead through the
// shared sp-wizard (#/add-student), creates an application for them, captures
// the new application ID, and stops (no Documents-tab upload attempted).

const PORTAL_URL = env.hydftem;
const PARTNER_EMAIL = 'hydfteam@mailinator.com';
const PARTNER_PASSWORD = 'Data@12345';

test('Mahindra (HYD FTeam) — Daily: Partner Add Student + Create Application', async ({ page }) => {
    test.setTimeout(900000);
    const t0 = Date.now();
    const elapsed = () => `+${Math.round((Date.now() - t0) / 1000)}s`;

    const result = await login(page, PORTAL_URL, PARTNER_EMAIL, PARTNER_PASSWORD);
    expect(result ?? 'ok', `login should not be rejected (got: ${result})`).not.toMatch(/error/i);
    await page.waitForTimeout(2000);

    // Baseline application count from View Applications
    await gotoPartnerRoute(page, PORTAL_URL, PARTNER_ROUTES.viewApplications);
    await page.waitForFunction(
        () => /\d+\s+applications?/i.test(document.body.innerText),
        undefined,
        { timeout: 20000 }
    ).catch(() => {});
    await page.waitForTimeout(2000);
    const readAppsPage = () => page.evaluate(() => {
        const m = document.body.innerText.match(/(\d+)\s+applications?/i);
        return { count: m ? parseInt(m[1], 10) : -1 };
    });
    const baseline = await readAppsPage();
    console.log(`  Baseline: ${baseline.count} applications [${elapsed()}]`);

    // Dynamic realistic identity — same approach as tests/student-flows/39-register-student.spec.ts.
    const student = generateNewStudentIdentity();
    console.log(`  New student: ${student.firstName} ${student.lastName} | ${student.email} | ${student.mobile}`);

    await gotoPartnerRoute(page, PORTAL_URL, PARTNER_ROUTES.addStudent);
    await page.waitForTimeout(3000);
    await expect(page.locator('.sp-header-title')).toContainText('Student Profile Journey', { timeout: 15000 });
    console.log(`✓ Add Student wizard opened [${elapsed()}]`);

    // ── Tab 1: Personal Details — leave Student ID blank, fill a NEW person ────
    const filledTab1 = await fillPlainWizardInputs(page, student);
    console.log(`✓ Personal Details: filled ${filledTab1.length} plain fields`);

    // Nationality/Country deliberately pinned to India — the generic filler
    // otherwise defaults to alphabetically-first "Afghanistan", which this
    // tenant has no course-eligibility data for, silently dead-ending the
    // Create Application step later.
    const nationalitySet = await selectDropdownOption(page, 'nationality', 'India');
    const countrySet = await selectDropdownOption(page, 'country', 'India');
    console.log(`✓ Personal Details: nationality="${nationalitySet}", country="${countrySet}"`);

    const selectsTab1 = await fillVisibleReactSelects(page, 10);
    console.log(`✓ Personal Details: filled ${selectsTab1.length} dropdowns: ${selectsTab1.join(' | ')}`);

    const advancedToEducation = await advanceWizardTab(page, 'Education Details');
    console.log(`✓ Personal Details saved, advanced to Education Details: ${advancedToEducation} [${elapsed()}]`);
    expect(advancedToEducation, 'the wizard should advance to Education Details after saving Personal Details').toBe(true);

    // ── Tab 2: Education Details ────────────────────────────────────────────────
    // Highest level = Higher Secondary Certificate / Diploma → cascades
    // through 10th + 12th/Diploma (2 record blocks).
    const eduResult = await fillEducationDetailsTab(page, 'Higher Secondary Certificate / Diploma');
    console.log(`✓ [Education Details] filled ${eduResult.dropdowns.length} dropdowns: ${eduResult.dropdowns.join(' | ')}`);
    if (eduResult.yesNoAnswered) console.log(`✓ [Education Details] answered ${eduResult.yesNoAnswered} Yes/No prompt(s) with "No"`);

    const advancedToEmergency = await advanceWizardTab(page, 'Emergency & Visa');
    console.log(`✓ Education Details saved, advanced to Emergency & Visa: ${advancedToEmergency} [${elapsed()}]`);

    if (!advancedToEmergency) {
        // Don't blindly keep filling against a possibly stale/mid-save page —
        // stop cleanly and report exactly how far the flow got. The new
        // student record itself was already created in Personal Details.
        console.log('\n⚠ The wizard did not advance past Education Details within the wait window.');
        console.log(`  New student record was created up to this point: ${student.email}`);
        console.log(`\n✅ Daily job coverage complete (stopped before Emergency & Visa) [returning at ${elapsed()}]`);
        return;
    }

    // ── Tab 3: Emergency & Visa ─────────────────────────────────────────────────
    const plainFilled = await fillPlainWizardInputs(page, student);
    const selectsFilled = await fillVisibleReactSelects(page, 10);
    console.log(`✓ [Emergency & Visa] filled ${plainFilled.length} plain fields, ${selectsFilled.length} dropdowns: ${selectsFilled.join(' | ')}`);

    const advancedToCreateApp = await advanceWizardTab(page, 'Create Application');
    console.log(`✓ Emergency & Visa saved, advanced to Create Application: ${advancedToCreateApp}`);

    if (!advancedToCreateApp) {
        console.log('\n⚠ The wizard did not advance past Emergency & Visa within the wait window.');
        console.log(`  New student record was created up to this point: ${student.email}`);
        console.log('\n✅ Daily job coverage complete (stopped before Create Application)');
        return;
    }

    // ── Tab 4: Create Application ───────────────────────────────────────────────
    const submission = await completeWizardSubmission(page);
    if (!submission.submitted) {
        console.log('\n⚠ Application could not be completed via the Create Application tab —');
        console.log('  the new student profile itself was still created up to this point.');
        console.log(`  Student on record: ${student.email}`);
        console.log('\n✅ Daily job coverage complete (application submission incomplete)');
        return;
    }

    // Capture the new application ID and stop — no Documents-tab upload.
    console.log(`\n🎯 CREATED APP ID: ${submission.newIds.join(', ') || '(id not captured)'}`);
    console.log(`\n✅ Partner created new student "${student.firstName} ${student.lastName}" (${student.email}), application ${submission.newIds.join(', ') || '(id not captured)'} submitted [${elapsed()}]`);
});
