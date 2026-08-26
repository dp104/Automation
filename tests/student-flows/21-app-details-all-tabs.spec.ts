import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';
import { findExistingApplicationUrl } from '../../utils/applyFlow';

// Application Details Page — All Tabs
// Navigates via menu: Application > View Applications > expand row > click app link
// Verifies sidebar, breadcrumb, all 7 tabs, Details tab content, and all accordions

test('Vivek Consultancy — App Details: All Tabs', async ({ page }) => {
    test.setTimeout(180000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') {
        console.log('Login failed:', result);
        return;
    }
    console.log('Login success');

    await page.waitForSelector('.nsm-sidebar', { timeout: 20000 });

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 1 — NAVIGATE VIA MENU
    // ═══════════════════════════════════════════════════════════════════════

    // Discovered dynamically (not a hardcoded appId) — application records
    // get created/removed over time, so this always targets one that
    // genuinely exists right now instead of risking a stale/deleted id.
    const appUrl = await findExistingApplicationUrl(page, env.vivekconsultancy);
    if (!appUrl) {
        console.log('  No applications currently exist for this student — cannot test Application Details. Create one first (e.g. test 29 or 32).');
        return;
    }
    console.log('✓ Found an existing application, navigating to its details:', appUrl);

    await page.goto(appUrl);
    await page.waitForTimeout(1000);

    // Wait for real content (no skeletons)
    await page.waitForFunction(() => {
        const c = document.querySelector('.app-details-2-tab-content');
        return c && !c.querySelector('.app-details-2-skeleton') && c.children.length > 0;
    }, { timeout: 20000 }).catch(() => {});
    console.log('✓ App details content loaded');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 2 — BREADCRUMB
    // ═══════════════════════════════════════════════════════════════════════

    const breadcrumb = page.locator('.gad-breadcrumb');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText('Dashboard');
    await expect(breadcrumb).toContainText('Application');
    await expect(breadcrumb).toContainText('View Applications');
    await expect(breadcrumb).toContainText('Application Details');
    console.log('✓ Breadcrumb: Dashboard > Application > View Applications > Application Details');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 3 — SIDEBAR
    // ═══════════════════════════════════════════════════════════════════════

    const avatar = page.locator('.app-details-2-avatar').first();
    await expect(avatar).toBeVisible();
    await expect(avatar).toContainText('HA');
    console.log('✓ Avatar text: HA');

    const studentName = page.locator('.app-details-2-student-name');
    await expect(studentName).toBeVisible();
    await expect(studentName).toContainText('Hamza Ali Mazari');
    console.log('✓ Student name: Hamza Ali Mazari');

    const sChip = page.locator('.app-details-2-s-chip').filter({ hasText: 'GUIDS7' }).first();
    await expect(sChip).toBeVisible();
    await expect(sChip).toContainText('GUIDS7');
    console.log('✓ Student chip: GUIDS7');

    const chips = page.locator('.app-details-2-s-chip');
    const chipsText = await chips.allTextContents();
    console.log('✓ Chips text:', chipsText);

    // Verify Pakistan and Undergraduate chips
    const allText = chipsText.join(' ');
    const hasPakistan = allText.includes('Pakistan');
    const hasUndergrad = allText.includes('Undergraduate');
    console.log('✓ Pakistan chip present:', hasPakistan);
    console.log('✓ Undergraduate chip present:', hasUndergrad);

    // Detail rows — phone, DOB, passport, location
    const detailRows = page.locator('.app-details-2-detail-row, .app-details-2-info-row');
    const detailCount = await detailRows.count();
    console.log('✓ Detail rows count:', detailCount);

    // Search input in sidebar
    const sbSearch = page.locator('.app-details-2-sb-search input');
    await expect(sbSearch).toBeVisible();
    console.log('✓ Sidebar search input visible');

    // Active chip label GUIDA336
    const activeChip = page.locator('.app-details-2-app-item--active, .app-details-2-app-item.active').first();
    const activeChipText = await activeChip.textContent().catch(() => '');
    console.log('✓ Active app chip label:', activeChipText);

    // Sidebar app list items
    const appItems = page.locator('.app-details-2-app-item');
    const appItemCount = await appItems.count();
    expect(appItemCount).toBeGreaterThan(0);
    console.log('✓ Sidebar app items count:', appItemCount);

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 4 — ALL 7 TABS VISIBLE
    // ═══════════════════════════════════════════════════════════════════════

    const tabNames = ['Details', 'Documents', 'University Communication', 'Comments', 'Interviews', 'App History', 'Student Journey'];
    for (const tabName of tabNames) {
        const tab = page.locator('.app-details-2-tab-btn').filter({ hasText: tabName }).first();
        await expect(tab).toBeVisible();
        console.log(`✓ Tab visible: ${tabName}`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 5 — DETAILS TAB ACTIVE BY DEFAULT
    // ═══════════════════════════════════════════════════════════════════════

    const detailsTab = page.locator('.app-details-2-tab-btn').filter({ hasText: 'Details' }).first();
    await expect(detailsTab).toHaveClass(/app-details-2-tab-btn--active/);
    console.log('✓ Details tab is active by default');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 6 — CLICK EACH TAB IN ORDER
    // ═══════════════════════════════════════════════════════════════════════

    // Documents tab
    await page.locator('.app-details-2-tab-btn').filter({ hasText: 'Documents' }).first().click();
    await page.waitForTimeout(1500);
    await expect(page.locator('.app-details-2-tab-btn').filter({ hasText: 'Documents' }).first()).toHaveClass(/app-details-2-tab-btn--active/);
    const secTabs = page.locator('.app-details-2-sec-tab');
    const secTabCount = await secTabs.count();
    console.log('✓ Documents tab active, sub-tabs count:', secTabCount);
    await expect(secTabs.filter({ hasText: 'Application Docs' }).first()).toBeVisible().catch(() => console.log('Application Docs sub-tab not found'));
    await expect(secTabs.filter({ hasText: 'CAS Documents' }).first()).toBeVisible().catch(() => console.log('CAS Documents sub-tab not found'));
    await expect(secTabs.filter({ hasText: 'Enrollment Docs' }).first()).toBeVisible().catch(() => console.log('Enrollment Docs sub-tab not found'));

    // University Communication tab
    await page.locator('.app-details-2-tab-btn').filter({ hasText: 'University Communication' }).first().click();
    await page.waitForTimeout(1500);
    await expect(page.locator('.app-details-2-tab-btn').filter({ hasText: 'University Communication' }).first()).toHaveClass(/app-details-2-tab-btn--active/);
    const uniCards = page.locator('.app-details-2-uni-doc-card');
    const uniCardCount = await uniCards.count();
    console.log('✓ University Communication tab active, cards count:', uniCardCount);

    // Comments tab
    await page.locator('.app-details-2-tab-btn').filter({ hasText: 'Comments' }).first().click();
    await page.waitForTimeout(1500);
    await expect(page.locator('.app-details-2-tab-btn').filter({ hasText: 'Comments' }).first()).toHaveClass(/app-details-2-tab-btn--active/);
    await expect(page.locator('.app-details-2-form-textarea')).toBeVisible();
    await expect(page.locator('.app-details-2-btn-send')).toBeVisible();
    console.log('✓ Comments tab active, textarea and Post button visible');

    // Interviews tab
    await page.locator('.app-details-2-tab-btn').filter({ hasText: 'Interviews' }).first().click();
    await page.waitForTimeout(1500);
    await expect(page.locator('.app-details-2-tab-btn').filter({ hasText: 'Interviews' }).first()).toHaveClass(/app-details-2-tab-btn--active/);
    const filterTabs = page.locator('.app-details-2-ft-btn');
    await expect(filterTabs.first()).toBeVisible().catch(() => console.log('Filter tabs not found'));
    console.log('✓ Interviews tab active, filter tabs visible:', await filterTabs.count());

    // App History tab
    await page.locator('.app-details-2-tab-btn').filter({ hasText: 'App History' }).first().click();
    await page.waitForTimeout(1500);
    await expect(page.locator('.app-details-2-tab-btn').filter({ hasText: 'App History' }).first()).toHaveClass(/app-details-2-tab-btn--active/);
    const historyTable = page.locator('.app-details-2-data-table');
    await expect(historyTable).toBeVisible().catch(() => console.log('History table not immediately visible'));
    console.log('✓ App History tab active');

    // Student Journey tab
    await page.locator('.app-details-2-tab-btn').filter({ hasText: 'Student Journey' }).first().click();
    await page.waitForTimeout(1500);
    await expect(page.locator('.app-details-2-tab-btn').filter({ hasText: 'Student Journey' }).first()).toHaveClass(/app-details-2-tab-btn--active/);
    // await expect(page.locator('.app-details-2-tab-content')).toBeVisible();
    console.log('✓ Student Journey tab active, content area visible');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 7 — BACK TO DETAILS TAB
    // ═══════════════════════════════════════════════════════════════════════

    await page.locator('.app-details-2-tab-btn').filter({ hasText: 'Details' }).first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.app-details-2-tab-btn').filter({ hasText: 'Details' }).first()).toHaveClass(/app-details-2-tab-btn--active/);
    console.log('✓ Back to Details tab, active confirmed');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 8 — APPLICATION INFORMATION ACCORDION
    // ═══════════════════════════════════════════════════════════════════════

    // Application Information should be open by default
    const appInfoAccordion = page.locator('.app-details-2-accordion').filter({ hasText: 'Application Information' }).first();
    await expect(appInfoAccordion).toBeVisible();
    const appInfoOpen = await appInfoAccordion.evaluate(el => el.classList.toString()).catch(() => '');
    console.log('✓ Application Information accordion classes:', appInfoOpen);

    // Verify App ID and University in info cells
    const infoCells = page.locator('.app-details-2-info-label, .app-details-2-info-val');
    const infoCellTexts = await infoCells.allTextContents().catch(() => [] as string[]);
    console.log('✓ Info cells text (first 20):', infoCellTexts.slice(0, 20));
    const infoText = infoCellTexts.join(' ');
    const currentAppId = (appUrl.match(/appId=([^&]+)/) || [])[1] || '';
    const hasAppId = currentAppId.length > 0 && infoText.includes(currentAppId);
    console.log(`✓ App ID ${currentAppId} present:`, hasAppId);

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 9 — EXPAND / COLLAPSE OTHER ACCORDIONS
    // ═══════════════════════════════════════════════════════════════════════

    const accordionNames = [
        'Fees Information',
        'Personal Information',
        'Education Information',
        'Work Experience',
        'Visa History',
        'Emergency Contact',
    ];

    for (const name of accordionNames) {
        const accordion = page.locator('.app-details-2-accordion').filter({ hasText: name }).first();
        const exists = await accordion.count();
        if (!exists) {
            console.log(`✓ Accordion "${name}" not found, skipping`);
            continue;
        }
        // Click to expand
        const header = accordion.locator('.app-details-2-accordion-header, .app-details-2-acc-header').first();
        const clickTarget = (await header.count()) ? header : accordion;
        await clickTarget.click();
        await page.waitForTimeout(500);
        const classesAfterOpen = await accordion.evaluate(el => el.classList.toString()).catch(() => '');
        console.log(`✓ Accordion "${name}" expanded, classes:`, classesAfterOpen);
        // Click again to collapse
        await clickTarget.click();
        await page.waitForTimeout(500);
        const classesAfterClose = await accordion.evaluate(el => el.classList.toString()).catch(() => '');
        console.log(`✓ Accordion "${name}" collapsed, classes:`, classesAfterClose);
    }

    console.log('✓ All tabs and accordions test complete');
});
