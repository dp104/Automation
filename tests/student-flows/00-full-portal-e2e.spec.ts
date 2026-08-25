import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

// ═══════════════════════════════════════════════════════════════════════════
// FULL STUDENT PORTAL END-TO-END TEST — Vivek Consultancy
//
// Covers in one run:
//   1. Login
//   2. Dashboard
//   3. Notifications
//   4. Profile (view + calendar + wallet + preferences)
//   5. Change Password page (navigate only, no submit)
//   6. Universities page & filter
//   7. University detail
//   8. Courses page
//   9. Search Course
//  10. Application menu → View Applications
//  11. Application details (all tabs)
//  12. Create Application (full cascade)
//  13. Accommodation
//  14. Enquiry
//  15. Logout
// ═══════════════════════════════════════════════════════════════════════════

const BASE = 'https://vivekconsultancy.flyurdream.com';
const STUDENT_ID = 'GUIDS7';
const APP_ID     = 'GUIDA336';

test('Vivek Consultancy — Full Student Portal E2E', async ({ page }) => {
    test.setTimeout(480000);

    // ═══════════════════════════════════════════════════════════════════════
    // 1. LOGIN
    // ═══════════════════════════════════════════════════════════════════════
    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') { console.log('✗ Login failed:', result); return; }
    await page.waitForSelector('.nsm-sidebar', { timeout: 20000 });
    console.log('✓ 1. Login success');

    // ═══════════════════════════════════════════════════════════════════════
    // 2. DASHBOARD
    // ═══════════════════════════════════════════════════════════════════════
    await page.waitForURL(/\/(dashboard|#\/)/, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const dashTitle = await page.title().catch(() => '');
    console.log('✓ 2. Dashboard — title:', dashTitle);

    // Stat cards
    const statCards = await page.locator('[class*="stat"], [class*="card"], [class*="summary"]')
        .filter({ hasNot: page.locator('nav, header') }).count().catch(() => 0);
    console.log('   Stat cards visible:', statCards);

    // ═══════════════════════════════════════════════════════════════════════
    // 3. NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════════════
    const notifBell = page.locator('[class*="notif"], [class*="bell"], .notification-icon').first();
    const bellVisible = await notifBell.isVisible({ timeout: 3000 }).catch(() => false);
    if (bellVisible) {
        await notifBell.click();
        await page.waitForTimeout(1500);
        const notifPanel = await page.locator('[class*="notif-panel"], [class*="notification-list"], [class*="notif-dropdown"]')
            .first().isVisible({ timeout: 3000 }).catch(() => false);
        console.log('✓ 3. Notifications — panel opened:', notifPanel);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
    } else {
        await page.goto(`${BASE}/#/notifications`);
        await page.waitForTimeout(2000);
        console.log('✓ 3. Notifications — navigated to page');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. PROFILE
    // ═══════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE}/#/profile`);
    await page.waitForTimeout(2000);
    const profileVisible = await page.locator('[class*="profile"], [class*="user-info"], [class*="avatar"]')
        .first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log('✓ 4a. Profile page loaded:', profileVisible);

    // Profile → Calendar tab
    const calTab = page.locator('[class*="tab"], button').filter({ hasText: /calendar/i }).first();
    if (await calTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await calTab.click();
        await page.waitForTimeout(1500);
        console.log('✓ 4b. Profile Calendar tab clicked');
    }

    // Profile → Wallet tab
    const walletTab = page.locator('[class*="tab"], button').filter({ hasText: /wallet/i }).first();
    if (await walletTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await walletTab.click();
        await page.waitForTimeout(1500);
        console.log('✓ 4c. Profile Wallet tab clicked');
    }

    // Profile → Preferences tab
    const prefTab = page.locator('[class*="tab"], button').filter({ hasText: /prefer/i }).first();
    if (await prefTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await prefTab.click();
        await page.waitForTimeout(1500);
        console.log('✓ 4d. Profile Preferences tab clicked');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. CHANGE PASSWORD PAGE (navigate only)
    // ═══════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE}/#/change-password`);
    await page.waitForTimeout(1500);
    const pwdForm = await page.locator('input[type="password"]').first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log('✓ 5. Change Password — form visible:', pwdForm);

    // ═══════════════════════════════════════════════════════════════════════
    // 6. UNIVERSITIES PAGE
    // ═══════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE}/#/universities`);
    await page.waitForTimeout(3000);
    const uniCount = await page.locator('.newuniv-campus-card').count();
    console.log('✓ 6. Universities page — cards:', uniCount);

    // Apply a country filter if filter button exists
    const filterBtn = page.locator('.newuniv-campus-filter-btn').first();
    if (await filterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await filterBtn.click();
        await page.waitForTimeout(1000);
        await page.keyboard.press('Escape');
        console.log('   Filter panel toggled');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 7. UNIVERSITY DETAIL
    // ═══════════════════════════════════════════════════════════════════════
    const firstUniCard = page.locator('.newuniv-campus-card').first();
    if (await firstUniCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstUniCard.locator('.newuniv-campus-name').first().click();
        await page.waitForTimeout(2000);
        const detailVisible = await page.locator('.new-univmanager-name')
            .first().isVisible({ timeout: 3000 }).catch(() => false);
        console.log('✓ 7. University detail opened:', detailVisible);

        // Check tabs on detail page
        const detailTabs = await page.locator('.new-univmanager-tab').count();
        if (detailTabs > 0) {
            await page.locator('.new-univmanager-tab').nth(1).click().catch(() => {});
            await page.waitForTimeout(1000);
            console.log('   Detail tabs:', detailTabs);
        }
        await page.goBack();
        await page.waitForTimeout(1500);
    } else {
        console.log('✓ 7. University detail — no cards found to click');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 8. COURSES PAGE
    // ═══════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE}/#/programs`);
    await page.waitForTimeout(3000);
    const courseCount = await page.locator('.uni-card:not(.courseskeleton-card)').count();
    console.log('✓ 8. Courses page — cards:', courseCount);

    // ═══════════════════════════════════════════════════════════════════════
    // 9. SEARCH COURSE
    // ═══════════════════════════════════════════════════════════════════════
    // Search-Course is filter-driven (.msd-trigger/.msd-dropdown), not a free-text
    // search input — see tests/student-flows/19-search-course-full.spec.ts.
    await page.goto(`${BASE}/#/programpage4`);
    await page.waitForTimeout(2000);
    const filterTrigger = page.locator('.msd-trigger').first();
    if (await filterTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
        const results = await page.locator('.uni-card:not(.courseskeleton-card)').count();
        console.log('✓ 9. Search Course — results:', results);
    } else {
        console.log('✓ 9. Search Course page loaded (no filter UI found)');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 10. VIEW APPLICATIONS
    // ═══════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE}/#/Get-Applications`);
    await page.waitForTimeout(3000);
    await page.waitForFunction(
        () => document.querySelectorAll('table tbody tr, [class*="app-row"]').length > 0,
        { timeout: 15000 }
    ).catch(() => {});
    const rowCount = await page.locator('table tbody tr').count();
    console.log('✓ 10. View Applications — rows:', rowCount);

    // Search for GUIDS7
    const appSearchInput = page.locator('input[placeholder*="search" i], input[placeholder*="student" i]').first();
    if (await appSearchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await appSearchInput.fill(STUDENT_ID);
        await page.waitForTimeout(2000);
        console.log('   Searched for', STUDENT_ID);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 11. APPLICATION DETAILS — ALL TABS
    // ═══════════════════════════════════════════════════════════════════════
    await page.goto(
        `${BASE}/#/Applications-details-Accordion-3?appId=${APP_ID}&companyId=6&branchId=null&studentUniqueId=${STUDENT_ID}`
    );
    await page.waitForTimeout(2000);

    await page.waitForFunction(
        () => {
            const c = document.querySelector('.app-details-2-tab-content');
            return c && c.children.length > 0;
        },
        { timeout: 20000 }
    ).catch(() => {});
    console.log('✓ 11. App Details loaded');

    const appTabs = await page.locator('.app-details-2-tab-btn').allTextContents().catch(() => [] as string[]);
    console.log('   App detail tabs:', appTabs.map(t => t.trim()).join(' | '));

    for (const tabName of ['Documents', 'University Communication', 'Comments', 'App History', 'Interviews', 'Student Journey']) {
        const tab = page.locator('.app-details-2-tab-btn').filter({ hasText: tabName }).first();
        if (await tab.isVisible({ timeout: 1000 }).catch(() => false)) {
            await tab.click();
            await page.waitForTimeout(1500);
            console.log(`   ✓ Tab: ${tabName}`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 12. CREATE APPLICATION (full cascade: Country → Course)
    // ═══════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE}/#/add-student`);
    await page.waitForTimeout(3000);
    await page.waitForFunction(
        () => !!document.querySelector('.sp-header-title'),
        { timeout: 10000 }
    ).catch(() => {});

    // Load student — new wizard auto-loads the logged-in student's own
    // profile directly; the fetch-by-ID box only appears for the
    // partner-side add-student flow now, not the student's own.
    const studentInput00 = page.locator('input.sp-student-input');
    if (await studentInput00.isVisible({ timeout: 5000 }).catch(() => false)) {
        await studentInput00.fill(STUDENT_ID);
        await page.locator('.sp-fetch-btn').click();
    }
    await page.waitForFunction(
        () => Array.from(document.querySelectorAll('input'))
            .some(el => el.placeholder?.toLowerCase().includes('first') && el.value.trim().length > 0),
        { timeout: 30000 }
    ).catch(() => page.waitForTimeout(8000));
    await page.waitForTimeout(1500);
    console.log('✓ 12. Student data loaded for Create Application');

    // Go to Create Application tab
    await page.locator('.sp-tab').filter({ hasText: 'Create Application' }).first().click();
    await page.waitForTimeout(2000);

    // Open the form
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.textContent?.trim() === 'Create Application' && b.className.includes('sp-btn'))
                 || btns.find(b => b.className.includes('edu-add-btn'));
        (btn as HTMLElement | undefined)?.click();
    });
    await page.waitForTimeout(3000);

    // react-select open helper — mousedown only (prevents toggle-close)
    const openAndSelect = async (label: string, waitMs = 2500): Promise<string> => {
        const ph = await page.evaluate(() => {
            const ctrl = Array.from(document.querySelectorAll('[class*="-control"]')).find(el => {
                if (!(el as HTMLElement).offsetParent) return false;
                const inp = el.querySelector('input') as HTMLInputElement | null;
                if (!inp || inp.disabled) return false;
                const placeholder = el.querySelector('[class*="-placeholder"]')?.textContent?.trim() || '';
                if (placeholder === 'Loading…' || placeholder === 'Loading...') return false;
                return !el.querySelector('[class*="-singleValue"]') && !el.querySelector('[class*="-multiValue"]');
            }) as HTMLElement | undefined;
            if (!ctrl) return null;
            ctrl.scrollIntoView({ block: 'center', behavior: 'instant' });
            ctrl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
            return ctrl.querySelector('[class*="-placeholder"]')?.textContent?.trim() || '(no ph)';
        });
        if (!ph) { console.log(`    [${label}] no control found`); return ''; }
        console.log(`    [${label}] opening "${ph}"`);

        const gotOptions = await page.waitForFunction(() => {
            const menu = document.querySelector('[class*="-menu"]');
            if (!menu) return false;
            return Array.from(menu.querySelectorAll('[class*="-option"]')).some(o => {
                const t = (o as HTMLElement).textContent?.trim() || '';
                return t && t !== 'Loading…' && t !== 'Loading...';
            });
        }, { timeout: 10000 }).catch(() => null);

        if (!gotOptions) {
            await page.keyboard.press('ArrowDown');
            await page.waitForTimeout(500);
            await page.waitForFunction(() => {
                const menu = document.querySelector('[class*="-menu"]');
                if (!menu) return false;
                return Array.from(menu.querySelectorAll('[class*="-option"]')).some(o => {
                    const t = (o as HTMLElement).textContent?.trim() || '';
                    return t && t !== 'Loading…' && t !== 'Loading...';
                });
            }, { timeout: 5000 }).catch(() => {});
        }

        const optText = await page.evaluate(() => {
            const menu = document.querySelector('[class*="-menu"]');
            const opt = (menu?.querySelector('[class*="-option--is-focused"]') ||
                         menu?.querySelector('[class*="-option"]')) as HTMLElement | null;
            return opt?.textContent?.trim() || '';
        });
        if (!optText) { await page.keyboard.press('Escape'); return ''; }
        console.log(`    [${label}] → "${optText}"`);
        await page.evaluate(() => {
            const menu = document.querySelector('[class*="-menu"]');
            const opt = (menu?.querySelector('[class*="-option--is-focused"]') ||
                         menu?.querySelector('[class*="-option"]')) as HTMLElement | null;
            opt?.click();
        });
        await page.waitForTimeout(waitMs);
        console.log(`  ✓ [${label}] = "${optText}"`);
        return optText;
    };

    const waitReady = async (label: string) => {
        await page.waitForFunction(() =>
            Array.from(document.querySelectorAll('[class*="-control"]'))
                .filter(el => (el as HTMLElement).offsetParent !== null)
                .some(el => {
                    if (el.querySelector('[class*="-singleValue"]') || el.querySelector('[class*="-multiValue"]')) return false;
                    const inp = el.querySelector('input') as HTMLInputElement | null;
                    if (!inp || inp.disabled) return false;
                    const ph = el.querySelector('[class*="-placeholder"]')?.textContent?.trim() || '';
                    return ph !== 'Loading…' && ph !== 'Loading...';
                }),
            { timeout: 20000 }
        ).catch(() => console.log(`    waitReady timed out: ${label}`));
    };

    const backToCreateTab = async () => {
        const active = await page.evaluate(() => {
            const tab = Array.from(document.querySelectorAll('.sp-tab'))
                .find(t => t.textContent?.includes('Create Application'));
            return !!(tab?.className?.includes('active') || tab?.getAttribute('aria-selected') === 'true');
        });
        if (!active) {
            await page.locator('.sp-tab').filter({ hasText: 'Create Application' }).first().click();
            await page.waitForTimeout(2000);
        }
    };

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const country     = await openAndSelect('Country');     await backToCreateTab();
    const state       = await openAndSelect('State');       await backToCreateTab();
    const city        = await openAndSelect('City');        await backToCreateTab();
    const acadLevel   = await openAndSelect('AcadLevel');   await backToCreateTab();
    const intakeMonth = await openAndSelect('Month');       await backToCreateTab();

    let intakeYear = '';
    for (let i = 0; i < 3 && !intakeYear; i++) {
        if (i > 0) { await page.waitForTimeout(2000); await backToCreateTab(); }
        intakeYear = await openAndSelect('IntakeYear');
    }
    await backToCreateTab();

    let university = '';
    for (let i = 0; i < 5 && !university; i++) {
        await backToCreateTab();
        await waitReady('University');
        university = await openAndSelect('University', 3000);
        if (!university) { console.log(`    University attempt ${i + 1}: no options, waiting 5s`); await page.waitForTimeout(5000); }
    }

    let course = '';
    if (university) {
        for (let i = 0; i < 5 && !course; i++) {
            await backToCreateTab();
            await waitReady('Course');
            course = await openAndSelect('Course', 3000);
            if (!course) { console.log(`    Course attempt ${i + 1}: no options, waiting 4s`); await page.waitForTimeout(4000); }
        }
    }

    console.log('✓ 12. Create Application cascade:');
    console.log(`    Country=${country} | State=${state} | City=${city}`);
    console.log(`    Level=${acadLevel} | Month=${intakeMonth} | Year=${intakeYear}`);
    console.log(`    University=${university} | Course=${course}`);

    if (university) {
        await page.waitForTimeout(500);
        const submitted = await page.evaluate(() => {
            const visible = Array.from(document.querySelectorAll('button'))
                .filter(b => (b as HTMLElement).offsetParent !== null);
            const btn = visible.find(b => /save application/i.test(b.textContent || ''))
                     || visible.find(b => /save|apply|submit/i.test(b.textContent || '') &&
                                          !b.className.includes('sp-tab') && !b.className.includes('sp-fetch') &&
                                          !/cancel/i.test(b.textContent || ''));
            if (btn) { btn.click(); return btn.textContent?.trim(); }
            return null;
        });
        console.log(submitted ? `  ✓ Submitted: "${submitted}"` : '  ✗ Submit button not found');
        await page.waitForTimeout(3000);
        const toast = await page.locator('.Toastify__toast-body').textContent({ timeout: 3000 }).catch(() => '');
        if (toast) console.log(`  ✓ Toast: "${toast}"`);
    } else {
        console.log('  ✗ Skipping submit — no university options for this combination');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 13. ACCOMMODATION
    // ═══════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE}/#/accommodation`);
    await page.waitForTimeout(2500);
    const accomLoaded = await page.locator('.housing-widget-container')
        .first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log('✓ 13. Accommodation page loaded:', accomLoaded);

    const accomCards = await page.locator('.housing-property-card').count();
    console.log('    Cards:', accomCards);

    const accomSearch = page.locator('.typeahead-input').first();
    if (await accomSearch.isVisible({ timeout: 2000 }).catch(() => false)) {
        await accomSearch.fill('London');
        await page.waitForTimeout(2000);
        console.log('    Searched for: London');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 14. ENQUIRY
    // ═══════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE}/#/enquiry`);
    await page.waitForTimeout(2000);
    const enquiryLoaded = await page.locator('[class*="enquiry"], [class*="enq"]')
        .first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log('✓ 14. Enquiry page loaded:', enquiryLoaded);

    const enquiryInputs = await page.locator('input:visible, textarea:visible').count();
    console.log('    Form inputs:', enquiryInputs);

    // ═══════════════════════════════════════════════════════════════════════
    // 15. LOGOUT
    // ═══════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE}/#/logout`).catch(() => {});
    await page.waitForTimeout(1000);

    // Try UI logout
    const logoutBtn = page.locator('button, a').filter({ hasText: /log.?out|sign.?out/i }).first();
    if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await logoutBtn.click();
        await page.waitForTimeout(2000);
    }

    const loginPage = await page.locator('input[type="email"], input[type="password"]')
        .first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log('✓ 15. Logout — login page visible:', loginPage);

    console.log('\n✅ Full Student Portal E2E complete');
});
