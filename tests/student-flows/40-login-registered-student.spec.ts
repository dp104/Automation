import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';
import { latestVerifiedStudent, loadStudents } from '../../utils/studentStore';

// Flow — Login with STORED credentials:
// Reads the newest verified student from test-data/registered-students.json
// (written by 39-register-student on every successful registration) and signs
// in with it, proving the stored credentials are reusable across tests.

test('Vivek Consultancy — Login with Stored Registered Student', async ({ page }) => {
    test.setTimeout(180000);

    const all = loadStudents();
    console.log(`  Stored students: ${all.length} (${all.filter(s => s.loginVerified).length} login-verified)`);

    const student = latestVerifiedStudent('vivekconsultancy');
    expect(student, 'a verified student should exist in test-data/registered-students.json').toBeTruthy();
    console.log(`  Using: ${student!.salutation} ${student!.firstName} ${student!.lastName} <${student!.email}> (registered ${student!.registeredAt.slice(0, 10)})`);

    // ── Sign in with the stored credentials ───────────────────────────────────
    // login() returns 'email error' / 'password error' on failure, undefined on success
    const result = await login(page, env.vivekconsultancy, student!.email, student!.password);
    expect(result ?? 'ok', `login should not be rejected (got: ${result})`).not.toMatch(/error/i);

    const onDashboard = await page.waitForURL('**/dashboard', { timeout: 30000 }).then(() => true).catch(() => false);
    expect(onDashboard, 'stored credentials should reach the dashboard').toBe(true);

    const greeting = await page.evaluate(() =>
        (document.body.innerText.match(/Good (Morning|Afternoon|Evening),[^\n!]*/i) || [''])[0]);
    console.log(`✓ Signed in — ${greeting || 'dashboard loaded'}`);

    console.log('\n✅ Stored student credentials verified — reusable by any test via utils/studentStore');
});
