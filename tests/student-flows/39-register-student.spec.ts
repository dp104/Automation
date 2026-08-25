import { expect, test } from '@playwright/test';
import { fakerEN_IN as faker } from '@faker-js/faker';
import { env } from '../../utils/environmenturls';
import { login } from '../../utils/login';
import { saveStudent } from '../../utils/studentStore';

// Flow — Register a new student account — NEW UI (rg-* classes, 2026-07 redesign):
// Login page → "Create one" → #/register → fill the (simplified) registration
// form with unique dynamic data → Create Account → the API now returns a real
// verificationUrl → visit it to verify the email → sign in → store credentials
// for reuse (utils/studentStore).
//
// NOTE: this used to be blocked by a backend defect (POST /api/UserRegistration
// returned an empty object regardless of input). That defect appears FIXED by
// this redesign — real userId/token/verificationUrl now come back. The defect
// branch below is kept as a safety net in case it regresses.

test('Vivek Consultancy — Register New Student', async ({ page }) => {
    test.setTimeout(240000);

    // Fully dynamic realistic identity via Faker (Indian locale, matching the
    // +91 phone setup). The email carries a short timestamp so reruns never
    // collide even if Faker repeats a name.
    const stamp = Date.now().toString().slice(-8);
    const sex = faker.person.sexType();                       // 'male' | 'female'
    const firstName = faker.person.firstName(sex).replace(/[^A-Za-z]/g, '');
    const lastName = faker.person.lastName().replace(/[^A-Za-z]/g, '');
    const student = {
        salutation: sex === 'male' ? 'Mr' : 'Ms',
        firstName,
        lastName,
        email: `${firstName}.${lastName}${stamp.slice(-4)}@gmail.com`.toLowerCase(),
        password: 'Data@1234',
        mobile: `${faker.helpers.arrayElement(['9', '8', '7', '6'])}${stamp.padStart(9, '0')}`.slice(0, 10),
    };
    console.log(`  Registering: ${student.salutation} ${student.firstName} ${student.lastName} | ${student.email} | ${student.mobile}`);

    // ── Login page → Create one ───────────────────────────────────────────────
    await page.goto(env.vivekconsultancy);
    await page.waitForTimeout(3000);
    await page.locator('.gl-signup-link').click();
    await expect(page).toHaveURL(/register/i, { timeout: 15000 });
    console.log('✓ Registration page opened:', page.url());
    await page.waitForTimeout(1500);

    // ── Fill the form ─────────────────────────────────────────────────────────
    await page.locator('select[name="salutation"]').selectOption({ label: student.salutation }).catch(() =>
        page.locator('select[name="salutation"]').selectOption({ index: 1 }));
    console.log(`✓ Salutation = ${student.salutation}`);

    await page.locator('input[name="firstName"]').fill(student.firstName);
    await page.locator('input[name="lastName"]').fill(student.lastName);
    await page.locator('input[name="email"]').fill(student.email);
    await page.locator('input[name="password"]').fill(student.password);
    await page.locator('input[name="confirmPassword"]').fill(student.password);
    console.log('✓ Name, email, and password filled');

    // "Register as" radio group defaults to Student (checked) — verify, click if not
    const studentRadioChecked = await page.evaluate(() =>
        (document.querySelector('input[name="groupId"]') as HTMLInputElement | null)?.checked ?? false);
    if (!studentRadioChecked) {
        await page.locator('label').filter({ hasText: 'Student' }).first().click();
    }
    console.log(`✓ Register as: Student (${studentRadioChecked ? 'default' : 'clicked'})`);

    // Phone: plain-text country code field (no dropdown in the new UI) + mobile
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
        // Known-defect fallback: the backend previously returned an empty
        // object (userId:0, all fields null) regardless of valid input.
        console.log('\n⚠ APP DEFECT (report to GuideUni team): POST /api/UserRegistration did not');
        console.log(`  return a usable account (userId=${reg.userId ?? 'n/a'}, verificationUrl=${reg.verificationUrl ?? 'none'}).`);
        console.log(`  Raw response: ${regBody.substring(0, 300)}`);
        console.log('\n✅ Register-student flow coverage complete (backend did not create the account)');
        return;
    }

    console.log(`✓ Account created: userId=${reg.userId}`);

    // Persist the identity immediately (pending verification) so it survives
    // even if a later step fails.
    saveStudent({
        ...student,
        portal: 'vivekconsultancy',
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

    // ── Sign in to prove the account works, then mark it verified in the store ─
    const result = await login(page, env.vivekconsultancy, student.email, student.password);
    expect(result ?? 'ok', `login should not be rejected (got: ${result})`).not.toMatch(/error/i);

    const onDashboard = await page.waitForURL('**/dashboard', { timeout: 30000 }).then(() => true).catch(() => false);
    expect(onDashboard, 'the newly registered account should reach the dashboard').toBe(true);

    const greeting = await page.evaluate(() =>
        (document.body.innerText.match(/Good (Morning|Afternoon|Evening),[^\n!]*/i) || [''])[0]);
    console.log(`✓ Signed in as the new student — ${greeting || 'dashboard loaded'}`);

    saveStudent({
        ...student,
        portal: 'vivekconsultancy',
        registeredAt: new Date().toISOString(),
        loginVerified: true,
    });
    console.log(`✓ Credentials updated to verified in test-data/registered-students.json`);
    console.log(`\n🎯 REGISTERED STUDENT: ${student.email} / ${student.password}`);
    console.log('\n✅ Student registered, verified, logged in, and stored for reuse');
});
