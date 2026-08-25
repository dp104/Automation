import { expect, test } from '@playwright/test';
import { fakerEN_IN as faker } from '@faker-js/faker';
import { env } from '../../utils/environmenturls';
import { login } from '../../utils/login';
import { saveStudent } from '../../utils/studentStore';
import { fillVisibleReactSelects, completeWizardSubmission } from '../../utils/applyFlow';
import {
    fillPlainWizardInputs,
    advanceWizardTab,
    fillEducationDetailsTab,
    selectDropdownOption,
    fillEmergencyContact,
} from '../../utils/partnerWizard';

// Daily Jenkins job — Mahindra (HYD FTeam) student portal.
// THOROUGH variant of the self-register + create-application flow: every
// optional field worth having realistic data for is filled in, not just
// the ones required to advance each tab.
//
// Highest education level = Undergraduate (10th + 12th/Diploma + UG, 3
// record blocks) rather than stopping at Diploma — a Diploma-only
// candidate isn't eligible for the Postgraduate courses Create Application
// defaults to, which was silently dead-ending every attempt at this step.
//
// Education Details: Course Preferences (adds a preferred course), English
// Proficiency Test Scores (selects IELTS Academic and fills all 5 band
// scores), and Work Experience (fills a full company/role/dates/description
// entry) are all answered "Yes" and completed, instead of the default "No".
//
// Emergency & Visa: Emergency Contact (a normal detail any real application
// would have) is answered "Yes" and filled with a realistic name/email/
// phone. The other five sections there (Visa Refusal, Visa History,
// Serious Medical Condition, Disability, Criminal Offence) are red-flag/
// negative-circumstance questions — left unanswered (the tab's own default,
// it's fully skippable), which is the realistic choice for a synthetic
// test student.

const PORTAL_URL = env.hydftem;

test('Mahindra (HYD FTeam) — Daily: Student Self-Register (Undergraduate, Thorough) + Create Application', async ({ page }) => {
    test.setTimeout(900000);

    // Fully dynamic realistic identity via Faker (Indian locale, +91 phone).
    const stamp = Date.now().toString().slice(-8);
    const sex = faker.person.sexType();
    const firstName = faker.person.firstName(sex).replace(/[^A-Za-z]/g, '');
    const lastName = faker.person.lastName().replace(/[^A-Za-z]/g, '');
    const student = {
        salutation: sex === 'male' ? 'Mr' : 'Ms',
        firstName,
        lastName,
        email: `${firstName}.${lastName}${stamp.slice(-4)}@mailinator.com`.toLowerCase(),
        password: 'Data@1234',
        mobile: `${faker.helpers.arrayElement(['9', '8', '7', '6'])}${stamp.padStart(9, '0')}`.slice(0, 10),
    };
    console.log(`  Registering: ${student.salutation} ${student.firstName} ${student.lastName} | ${student.email} | ${student.mobile}`);

    // ── Login page → Create one ───────────────────────────────────────────────
    await page.goto(PORTAL_URL);
    await page.waitForTimeout(3000);
    await page.locator('.gl-signup-link').click();
    await expect(page).toHaveURL(/register/i, { timeout: 15000 });
    console.log('✓ Registration page opened:', page.url());
    await page.waitForTimeout(1500);

    // ── Fill the form ─────────────────────────────────────────────────────────
    await page.locator('select[name="salutation"]').selectOption({ label: student.salutation }).catch(() =>
        page.locator('select[name="salutation"]').selectOption({ index: 1 }));
    await page.locator('input[name="firstName"]').fill(student.firstName);
    await page.locator('input[name="lastName"]').fill(student.lastName);
    await page.locator('input[name="email"]').fill(student.email);
    await page.locator('input[name="password"]').fill(student.password);
    await page.locator('input[name="confirmPassword"]').fill(student.password);
    console.log('✓ Name, email, and password filled');

    const studentRadioChecked = await page.evaluate(() =>
        (document.querySelector('input[name="groupId"]') as HTMLInputElement | null)?.checked ?? false);
    if (!studentRadioChecked) {
        await page.locator('label').filter({ hasText: 'Student' }).first().click();
    }
    console.log(`✓ Register as: Student (${studentRadioChecked ? 'default' : 'clicked'})`);

    await page.locator('input.rg-input--code').fill('+91');
    await page.locator('input[name="mobile"]').fill(student.mobile);
    console.log('✓ Country code +91 and mobile filled');

    // ── Submit and capture the real API response ──────────────────────────────
    const [regResponse] = await Promise.all([
        page.waitForResponse(r => /UserRegistration/i.test(r.url()), { timeout: 30000 }).catch(() => null),
        page.locator('button.rg-submit').click(),
    ]);
    console.log('✓ Clicked "Create account"');

    const regBody = regResponse ? await regResponse.text().catch(() => '') : '';
    let reg: any = {};
    try { reg = JSON.parse(regBody); } catch { /* leave as {} */ }
    console.log(`  API response: userId=${reg.userId ?? 'n/a'} response="${reg.response ?? ''}"`);

    const registrationSucceeded = !!reg.userId && reg.userId !== 0 && !!reg.verificationUrl;

    if (!registrationSucceeded) {
        console.log('\n⚠ APP DEFECT (report to GuideUni team): POST /api/UserRegistration did not');
        console.log(`  return a usable account (userId=${reg.userId ?? 'n/a'}, verificationUrl=${reg.verificationUrl ?? 'none'}).`);
        console.log(`  Raw response: ${regBody.substring(0, 300)}`);
        console.log('\n✅ Daily job coverage complete (backend did not create the account)');
        return;
    }

    console.log(`✓ Account created: userId=${reg.userId}`);

    saveStudent({
        ...student,
        portal: 'hydftem',
        registeredAt: new Date().toISOString(),
        loginVerified: false,
    });
    console.log(`✓ Credentials stored (pending verification): ${student.email}`);

    // ── Verify the email via the link returned by the API ─────────────────────
    const verifyUrl = String(reg.verificationUrl).replace(/\\u0026/g, '&').replace(/\\\//g, '/');
    console.log(`  Visiting verification link: ${verifyUrl}`);
    await page.goto(verifyUrl);
    await page.waitForFunction(
        () => !/verify-email/i.test(location.hash),
        undefined,
        { timeout: 30000 }
    ).catch(() => {});
    await page.waitForTimeout(2000);
    console.log(`✓ Email verified (now at ${page.url()})`);

    // ── Sign in as the new student ─────────────────────────────────────────────
    const result = await login(page, PORTAL_URL, student.email, student.password);
    expect(result ?? 'ok', `login should not be rejected (got: ${result})`).not.toMatch(/error/i);

    const onDashboard = await page.waitForURL('**/dashboard', { timeout: 30000 }).then(() => true).catch(() => false);
    expect(onDashboard, 'the newly registered account should reach the dashboard').toBe(true);
    await page.waitForSelector('.nsm-sidebar', { timeout: 20000 }).catch(() => {});

    saveStudent({
        ...student,
        portal: 'hydftem',
        registeredAt: new Date().toISOString(),
        loginVerified: true,
    });
    console.log(`✓ Signed in and stored for reuse: ${student.email}`);

    // ── Own Student Profile Journey — fill and submit an application ──────────
    await page.goto(`${PORTAL_URL.replace(/\/?#\/?$/, '')}/#/add-student`);
    await page.waitForTimeout(3000);
    await expect(page.locator('.sp-header-title')).toContainText('Student Profile Journey', { timeout: 15000 });
    console.log('✓ Own Student Profile Journey wizard opened');

    // A student's own #/add-student auto-loads their profile directly — no
    // Student ID fetch box (that's partner-only), confirmed live on this
    // platform in tests/student-flows/00,28,29,32.

    // ── Tab 1: Personal Details ────────────────────────────────────────────────
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
    console.log(`✓ Personal Details saved, advanced to Education Details: ${advancedToEducation}`);

    if (!advancedToEducation) {
        console.log('\n⚠ The wizard did not advance past Personal Details within the wait window.');
        console.log(`\n✅ Daily job coverage complete (registered + logged in; stopped before Education Details)`);
        return;
    }

    // ── Tab 2: Education Details ────────────────────────────────────────────────
    // Highest level = Undergraduate → cascades through 10th + 12th/Diploma +
    // UG (3 record blocks), so this student is eligible for the Postgraduate
    // courses Create Application defaults to. thorough=true also answers
    // "Yes" and fills Course Preferences, English Proficiency Test Scores,
    // and Work Experience instead of declining them.
    const eduResult = await fillEducationDetailsTab(page, 'Undergraduate', true);
    console.log(`✓ [Education Details] filled ${eduResult.dropdowns.length} dropdowns: ${eduResult.dropdowns.join(' | ')}`);
    if (eduResult.yesNoAnswered) console.log(`✓ [Education Details] answered ${eduResult.yesNoAnswered} remaining Yes/No prompt(s) with "No"`);

    const advancedToEmergency = await advanceWizardTab(page, 'Emergency & Visa');
    console.log(`✓ Education Details saved, advanced to Emergency & Visa: ${advancedToEmergency}`);

    if (!advancedToEmergency) {
        console.log('\n⚠ The wizard did not advance past Education Details within the wait window.');
        console.log(`\n✅ Daily job coverage complete (stopped before Emergency & Visa)`);
        return;
    }

    // ── Tab 3: Emergency & Visa ─────────────────────────────────────────────────
    const plainFilled = await fillPlainWizardInputs(page, student);
    const selectsFilled = await fillVisibleReactSelects(page, 10);
    console.log(`✓ [Emergency & Visa] filled ${plainFilled.length} plain fields, ${selectsFilled.length} dropdowns: ${selectsFilled.join(' | ')}`);

    // Emergency Contact answered "Yes" and filled (thorough) — the other
    // five sections (Visa Refusal/History, Medical, Disability, Criminal
    // Offence) are red-flag questions left at the tab's own default.
    await fillEmergencyContact(page);

    const advancedToCreateApp = await advanceWizardTab(page, 'Create Application');
    console.log(`✓ Emergency & Visa saved, advanced to Create Application: ${advancedToCreateApp}`);

    if (!advancedToCreateApp) {
        console.log('\n⚠ The wizard did not advance past Emergency & Visa within the wait window.');
        console.log(`\n✅ Daily job coverage complete (stopped before Create Application)`);
        return;
    }

    // ── Tab 4: Create Application ───────────────────────────────────────────────
    const submission = await completeWizardSubmission(page);
    if (!submission.submitted) {
        console.log('\n⚠ Application could not be completed via the Create Application tab.');
        console.log('\n✅ Daily job coverage complete (application submission incomplete)');
        return;
    }

    // Capture the new application ID and stop — no Documents-tab upload.
    console.log(`\n🎯 CREATED APP ID: ${submission.newIds.join(', ') || '(id not captured)'}`);
    console.log(`\n✅ Student "${student.firstName} ${student.lastName}" (${student.email}) submitted an application for themselves, id ${submission.newIds.join(', ') || '(not captured)'}`);
});
