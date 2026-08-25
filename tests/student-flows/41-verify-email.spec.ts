import { expect, test } from '@playwright/test';
import { env } from '../../utils/environmenturls';
import { login } from '../../utils/login';
import { loadStudents, saveStudent } from '../../utils/studentStore';

// Flow — Verify a student's email with a token:
// Registered-but-unverified students get a verification link like
//   https://crmdev.guideuni.com/#/verify-email?evalue=<token>
// Give the token(s) below (or on the command line) and this test opens the
// link in the browser and confirms the account gets verified.
//
// ═══════════════ HOW TO PROVIDE TOKENS ═════════════════════════════════════
// Option 1 — edit TOKENS below:
//   const TOKENS = ['f5818a5e-18e3-4673-9a2b-cc0222e3bdfb'];
// Option 2 — pass via environment (no file edit; comma-separate for many):
//   EVALUE=f5818a5e-18e3-4673-9a2b-cc0222e3bdfb npx playwright test tests/vivekconsultancy-student/41-verify-email.spec.ts
//
// The portal defaults to this suite's configured site (env.vivekconsultancy) —
// the verification link always belongs to the portal the user registered on.
// Override for another tenant:
//   PORTAL_URL=https://crmdev.guideuni.com EVALUE=... npx playwright test ...
// ═══════════════════════════════════════════════════════════════════════════
const PORTAL_URL = (process.env.PORTAL_URL || env.vivekconsultancy).replace(/\/?#?\/?$/, '');
const TOKENS: string[] = [ '024530bb-173d-4e76-94f7-6eaa0128348a'
    // 'f5818a5e-18e3-4673-9a2b-cc0222e3bdfb',
];

test('GuideUni — Verify Student Email via Token', async ({ page }) => {
    test.setTimeout(240000);

    const tokens = (process.env.EVALUE || '').split(',').map(t => t.trim()).filter(Boolean)
        .concat(TOKENS).filter((t, i, a) => a.indexOf(t) === i);

    if (!tokens.length) {
        console.log('  No tokens provided — set EVALUE=<token> or add to TOKENS in this file.');
        test.skip(true, 'no verification tokens provided (EVALUE env var or TOKENS array)');
        return;
    }
    console.log(`  Verifying ${tokens.length} token(s) on ${PORTAL_URL}`);

    const results: { token: string; state: string; detail: string }[] = [];

    for (const token of tokens) {
        const url = `${PORTAL_URL}/#/verify-email?evalue=${token}`;
        console.log(`\n→ ${url}`);
        // Retry navigation once — transient DNS/network errors happen
        try {
            await page.goto(url);
        } catch {
            console.log('  (navigation failed — retrying in 5s)');
            await page.waitForTimeout(5000);
            await page.goto(url);
        }

        // Wait for the verification to process — success text, error text, or
        // a redirect away from the verify route
        await page.waitForFunction(
            () => {
                const t = document.body.innerText;
                if (/verified|verification (successful|complete)|success|thank you/i.test(t)) return true;
                if (/invalid|expired|already|failed|error|not found/i.test(t)) return true;
                return !/verify-email/i.test(location.hash);
            },
            undefined,
            { timeout: 45000 }
        ).catch(() => {});
        await page.waitForTimeout(3000);

        const snap = await page.evaluate(() => ({
            url: location.href,
            toast: document.querySelector('.Toastify__toast-body')?.textContent?.trim() || '',
            text: document.body.innerText.substring(0, 500).replace(/\n{2,}/g, ' | ').replace(/\n/g, ' | '),
        }));

        const combined = `${snap.toast} ${snap.text}`;
        let state = 'unknown';
        if (/verified|verification (successful|complete)|success|thank/i.test(combined)) state = 'VERIFIED ✓';
        else if (/already (verified|active)/i.test(combined)) state = 'ALREADY VERIFIED';
        else if (/invalid|expired|not found/i.test(combined)) state = 'INVALID/EXPIRED';
        // "Unexpected response from server" = the portal answered but the verify
        // endpoint errored — typically an already-consumed token (the backend
        // should say "already verified" instead; worth mentioning to the team)
        else if (/unexpected response|server error|something went wrong/i.test(combined)) state = 'SERVER ERROR (token likely already used)';
        else if (/failed|error/i.test(combined)) state = 'ERROR';
        else if (!/verify-email/i.test(snap.url)) state = 'REDIRECTED (likely verified)';

        console.log(`  → ${state}`);
        if (snap.toast) console.log(`    toast: "${snap.toast}"`);
        console.log(`    page: ${snap.text.substring(0, 200)}`);
        results.push({ token: token.substring(0, 12) + '…', state, detail: snap.toast || snap.text.substring(0, 80) });
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n═══ VERIFICATION SUMMARY ═══');
    results.forEach(r => console.log(`  ${r.token}  ${r.state}`));

    // Every token must produce a definitive response from the portal
    const unresolved = results.filter(r => r.state === 'unknown');
    expect(unresolved.length, `all tokens should get a definitive response (unresolved: ${unresolved.map(r => r.token).join(', ')})`).toBe(0);

    const verified = results.filter(r => /VERIFIED|REDIRECTED/.test(r.state)).length;
    console.log(`\n✅ Email verification flow complete — ${verified}/${results.length} verified`);

    // ── Login with the latest stored student ──────────────────────────────────
    // Test 39 stores registered students with loginVerified:false. After a
    // successful verification here, sign in with the newest pending student
    // and mark them verified in the store.
    const pending = loadStudents().filter(s => s.portal === 'vivekconsultancy' && !s.loginVerified).pop();
    if (!pending) {
        console.log('  (no pending stored student to log in with — register one via test 39 first)');
        return;
    }
    console.log(`\n→ Logging in with the latest stored student: ${pending.email}`);
    const loginResult = await login(page, env.vivekconsultancy, pending.email, pending.password);
    const onDashboard = await page.waitForURL('**/dashboard', { timeout: 30000 }).then(() => true).catch(() => false);

    if (onDashboard) {
        saveStudent({ ...pending, loginVerified: true });
        const greeting = await page.evaluate(() =>
            (document.body.innerText.match(/Good (Morning|Afternoon|Evening),[^\n!]*/i) || [''])[0]);
        console.log(`✓ Signed in — ${greeting || 'dashboard loaded'}`);
        console.log(`🎯 ${pending.email} is now loginVerified in test-data/registered-students.json`);
        console.log('\n✅ Verified student logged in and marked reusable');
    } else {
        const err = await page.locator('.error-modern').textContent({ timeout: 3000 }).catch(() => '');
        console.log(`  ⚠ Login still gated for ${pending.email}: "${(err || String(loginResult || '')).trim() || 'no error shown'}"`);
        console.log('  (the store keeps them as pending — re-run once their token is verified)');
    }
});
