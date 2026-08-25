import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';
import { saveStudent } from '../../utils/studentStore';

// Utility — Store an existing student's credentials for reuse:
// Signs in with the given email/password to PROVE they work, reads the
// student's details from the dashboard, and saves them to
// test-data/registered-students.json (updates the entry if the email is
// already stored). Use this for students you registered/verified manually.
//
// ═══════════════ HOW TO PROVIDE THE CREDENTIALS ════════════════════════════
// Option 1 — edit below:
const STUDENT_EMAIL    = '';   // e.g. 'priya.gupta3983@gmail.com'
const STUDENT_PASSWORD = '';   // e.g. 'Data@1234'
// Option 2 — pass via environment (no file edit):
//   STUDENT_EMAIL=someone@gmail.com STUDENT_PASSWORD=Data@1234 \
//     npx playwright test tests/vivekconsultancy-student/42-store-student.spec.ts
// ═══════════════════════════════════════════════════════════════════════════

test('Vivek Consultancy — Store Verified Student Credentials', async ({ page }) => {
    test.setTimeout(180000);

    const email = process.env.STUDENT_EMAIL || STUDENT_EMAIL;
    // Password defaults to the suite's standard test password when not given
    const password = process.env.STUDENT_PASSWORD || STUDENT_PASSWORD || 'Data@1234';

    if (!email) {
        console.log('  No email provided — set STUDENT_EMAIL (env or file).');
        test.skip(true, 'no email provided (STUDENT_EMAIL)');
        return;
    }
    console.log(`  Verifying and storing: ${email}`);

    // ── Prove the credentials work ────────────────────────────────────────────
    const result = await login(page, env.vivekconsultancy, email, password);
    expect(result ?? 'ok', `login should not be rejected (got: ${result})`).not.toMatch(/error/i);

    const onDashboard = await page.waitForURL('**/dashboard', { timeout: 30000 }).then(() => true).catch(() => false);
    expect(onDashboard, 'the credentials should reach the dashboard').toBe(true);

    // ── Read the student's details from the portal ────────────────────────────
    await page.waitForTimeout(3000);
    const profile = await page.evaluate(() => {
        const t = document.body.innerText;
        const greeting = (t.match(/Good (?:Morning|Afternoon|Evening),\s*([^\n!]+)/i) || [])[1]?.trim() || '';
        const studentId = (t.match(/GUIDS\d+/) || [''])[0];
        const mobile = (t.match(/\b[6-9]\d{9}\b/) || [''])[0];
        return { greeting, studentId, mobile };
    });
    console.log(`✓ Signed in as "${profile.greeting || email}"${profile.studentId ? ` (${profile.studentId})` : ''}`);

    const nameParts = (profile.greeting || email.split('@')[0]).split(/\s+/);
    const firstName = nameParts.slice(0, -1).join(' ') || nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

    // ── Save to the store ─────────────────────────────────────────────────────
    const file = saveStudent({
        salutation: 'Mr',
        firstName,
        lastName,
        email,
        password,
        mobile: profile.mobile || '',
        portal: 'vivekconsultancy',
        registeredAt: new Date().toISOString(),
        loginVerified: true,
    });
    console.log(`✓ Stored in ${file}`);
    console.log(`\n🎯 STORED: ${firstName} ${lastName} <${email}>${profile.studentId ? ` — ${profile.studentId}` : ''}`);
    console.log('\n✅ Student credentials verified and stored — reusable via utils/studentStore');
});
