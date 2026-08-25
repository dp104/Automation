import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { partnerConfig } from '../../utils/partnerConfig';

// Partner Portal — Login & Dashboard.
// Same login page/flow as the student portal (utils/login.ts is shared and
// tenant-agnostic) — the ONLY difference is which account signs in. This
// account (a "Partner owner" role) lands on an aggregate dashboard instead of
// a personal one.
//
// KEY DIFFERENCES FROM THE STUDENT PORTAL (tests/vivekconsultancy-student/):
//   - Greeting/role shows the partner OWNER's name + "Partner owner" role,
//     not a student's name + "Student".
//   - Dashboard stats are AGGREGATE across every student the partner manages
//     (e.g. "113+ Total Students", "466+ Applications") instead of one
//     person's own progress.
//   - Sidebar has 9 sections vs the student's ~6: Dashboard,
//     Universities/Courses, Application, **Authentication** (manage partner
//     staff accounts), **Partner** (company profile / user allocation),
//     Enquiry, Accommodation, **Email Settings**, **Help Desk** — the bolded
//     ones don't exist for students at all.
//   - The sidebar itself is a collapsed icon rail (`.nsm-link[title="..."]`)
//     with hover flyout submenus, not the `.menu-item`/`.sub-menu` structure
//     used elsewhere in the student tests.
//
// Reusable for other companies: see utils/partnerConfig.ts to point this
// whole suite at a different tenant/partner account.

test('Partner Portal — Login & Dashboard', async ({ page }) => {
    test.setTimeout(120000);

    const result = await login(page, partnerConfig.portalUrl, partnerConfig.email, partnerConfig.password);
    expect(result ?? 'ok', `login should not be rejected (got: ${result})`).not.toMatch(/error/i);
    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
    console.log(`✓ Logged in to ${partnerConfig.tenantKey} as ${partnerConfig.email}`);

    await page.waitForTimeout(3000);

    // ── Role confirmation ──────────────────────────────────────────────────────
    const identity = await page.evaluate(() => {
        const greeting = (document.body.innerText.match(/Good (Morning|Afternoon|Evening),[^\n!]*/i) || [''])[0];
        const role = (document.body.innerText.match(/Partner owner|Partner staff|Partner admin/i) || [''])[0];
        return { greeting, role };
    });
    console.log(`✓ ${identity.greeting} — role: "${identity.role || '(not shown)'}"`);
    expect(identity.role.length, 'a partner-level role label should be visible').toBeGreaterThan(0);

    // ── Aggregate dashboard stats ──────────────────────────────────────────────
    const stats = await page.evaluate(() => {
        const t = document.body.innerText;
        return {
            totalStudents: (t.match(/(\d+\+?)\s*\n?Total Students/i) || [])[1] || '',
            applications: (t.match(/(\d+\+?)\s*\n?Applications\b/i) || [])[1] || '',
            activePartners: (t.match(/(\d+\+?)\s*\n?Active Partners/i) || [])[1] || '',
            availableCourses: (t.match(/(\d+\+?)\s*\n?Available Courses/i) || [])[1] || '',
        };
    });
    console.log('✓ Dashboard stats:', JSON.stringify(stats));
    expect(stats.totalStudents.length, '"Total Students" aggregate stat should be visible').toBeGreaterThan(0);

    // Charts (non-fatal — just confirm they rendered)
    const trendsVisible = await page.getByText('Application Trends').isVisible({ timeout: 3000 }).catch(() => false);
    const countryChartVisible = await page.getByText('Students by Country').isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`✓ "Application Trends" chart: ${trendsVisible} | "Students by Country" chart: ${countryChartVisible}`);

    // ── Sidebar sections present ───────────────────────────────────────────────
    const expectedSections = ['Dashboard', 'Universities/Courses', 'Application', 'Authentication', 'Partner', 'Enquiry', 'Accommodation', 'Email Settings', 'Help Desk'];
    for (const section of expectedSections) {
        const visible = await page.locator(`.nsm-link[title="${section}"]`).isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`  sidebar section "${section}": ${visible ? '✓' : '✗ MISSING'}`);
        expect(visible, `sidebar should have a "${section}" section`).toBe(true);
    }

    console.log('\n✅ Partner login and dashboard verified');
});
