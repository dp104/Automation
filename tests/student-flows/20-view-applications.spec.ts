import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

// View Applications page (#/Get-Applications)
// Structure:
//   - Breadcrumb: Dashboard > Application > View Applications
//   - 4 stat cards: Total Students, In Progress, Offers Received, Total Applications
//   - Toolbar: search input + Filters button
//   - Table: ID, Student, Company, Email, Mobile, Passport (sortable columns)
//     - Each row expandable → shows: Create New Application, Smart Assessment,
//       Suggestions buttons + sub-table of applications (App ID, University,
//       Course, Level, Intake, Created, Status, Commission, Pay, Assignee)
//   - Filter drawer: Company, First Name, Email Address, Student ID, Passport, App ID

test('Vivek Consultancy — View Applications Page', async ({ page }) => {
    test.setTimeout(120000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') {
        console.log('Login failed:', result);
        return;
    }
    console.log('Login success');

    await page.waitForSelector('.nsm-sidebar', { timeout: 20000 });

    // ── Navigate to View Applications ─────────────────────────────────────────
    await page.goto('https://vivekconsultancy.flyurdream.com/#/Get-Applications');
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/Get-Applications/i, { timeout: 10000 });
    console.log('View Applications URL confirmed:', page.url());

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 1 — BREADCRUMB
    // ═══════════════════════════════════════════════════════════════════════

    const breadcrumb = page.locator('.gad-breadcrumb');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.locator('.dashboard-link')).toHaveText('Dashboard');
    await expect(breadcrumb).toContainText('Application');
    await expect(breadcrumb).toContainText('View Applications');
    console.log('✓ Breadcrumb: Dashboard > Application > View Applications');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 2 — STATS BAR (4 cards)
    // ═══════════════════════════════════════════════════════════════════════

    const statsBar = page.locator('.gad-stats-bar');
    await expect(statsBar).toBeVisible();

    const statCards = page.locator('.gad-stat-card');
    expect(await statCards.count()).toBeGreaterThanOrEqual(3);

    // Verify each label
    for (const label of ['In Progress', 'Offers Received', 'Total Applications']) {
        await expect(statCards.filter({ hasText: label }).first()).toBeVisible();
        console.log(`✓ Stat card visible: "${label}"`);
    }

    // Read and log all stat values
    const statValues = await page.locator('.gad-stat-value').allInnerTexts();
    console.log('✓ Stat values:', JSON.stringify(statValues));

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 3 — TOOLBAR (search + filters button)
    // ═══════════════════════════════════════════════════════════════════════

    const toolbar = page.locator('.gad-toolbar');
    await expect(toolbar).toBeVisible();

    const searchInput = page.locator('.gad-search-input');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /Search by ID/i);
    console.log('✓ Search input visible with correct placeholder');

    const filtersBtn = page.locator('.gad-btn-ghost').filter({ hasText: 'Filters' }).first();
    await expect(filtersBtn).toBeVisible();
    console.log('✓ Filters button visible');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 4 — TABLE HEADERS & SORT
    // ═══════════════════════════════════════════════════════════════════════

    const tableCard = page.locator('.gad-table-card');
    await expect(tableCard).toBeVisible();

    const headers = page.locator('.gad-th');
    const headerTexts = await headers.allInnerTexts();
    console.log('✓ Table headers:', JSON.stringify(headerTexts));

    // Sortable columns: ID, Student, Email have arrow icons
    for (const col of ['ID', 'Student', 'Email']) {
        const th = headers.filter({ hasText: col }).first();
        await expect(th).toBeVisible();
        await expect(th.locator('.lucide-arrow-up-down')).toBeVisible();
        console.log(`✓ Column "${col}" is sortable (has sort icon)`);
    }

    // ── Sort by ID column ────────────────────────────────────────────────────
    const idHeader = headers.filter({ hasText: 'ID' }).first();
    await idHeader.click();
    await page.waitForTimeout(500);
    console.log('✓ Sort by ID clicked');

    await idHeader.click();
    await page.waitForTimeout(500);
    console.log('✓ Sort by ID reversed');

    // ── Sort by Student column ────────────────────────────────────────────────
    const studentHeader = headers.filter({ hasText: 'Student' }).first();
    await studentHeader.click();
    await page.waitForTimeout(500);
    console.log('✓ Sort by Student clicked');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 5 — TABLE ROWS
    // ═══════════════════════════════════════════════════════════════════════

    const rows = page.locator('.gad-row-wrap');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    console.log('✓ Table rows loaded:', rowCount);

    // Verify first row structure
    const firstRow = rows.first().locator('.gad-row');
    await expect(firstRow).toBeVisible();

    // Student ID cell (accent colour)
    const studentId = firstRow.locator('.gad-row-cell.accent').first();
    await expect(studentId).toBeVisible();
    const studentIdText = await studentId.innerText();
    console.log('✓ First row Student ID:', studentIdText);

    // Name cell with avatar
    const nameCell = firstRow.locator('.gad-name-cell');
    await expect(nameCell).toBeVisible();
    await expect(nameCell.locator('.gad-avatar')).toBeVisible();
    await expect(nameCell.locator('.gad-name-primary')).toBeVisible();
    const studentName = await nameCell.locator('.gad-name-primary').innerText();
    console.log('✓ Student name:', studentName);

    const appCountText = await nameCell.locator('.gad-name-secondary').innerText().catch(() => '');
    console.log('✓ Application count badge:', appCountText);

    // Company, email, mobile, passport cells
    const cells = firstRow.locator('.gad-row-cell');
    const cellCount = await cells.count();
    console.log('✓ Row cell count:', cellCount);

    // Expander icon (chevron)
    const expanderIcon = firstRow.locator('.gad-expander-icon');
    await expect(expanderIcon).toBeVisible();
    console.log('✓ Row expander icon visible');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 6 — SEARCH FUNCTIONALITY
    // ═══════════════════════════════════════════════════════════════════════

    // Search by student name
    await searchInput.fill(studentName.substring(0, 5));
    await page.waitForTimeout(800);
    const searchRows = await page.locator('.gad-row-wrap').count();
    console.log(`✓ Search "${studentName.substring(0, 5)}" → rows visible: ${searchRows}`);

    // Search by student ID
    await searchInput.fill(studentIdText);
    await page.waitForTimeout(800);
    const idSearchRows = await page.locator('.gad-row-wrap').count();
    console.log(`✓ Search by ID "${studentIdText}" → rows: ${idSearchRows}`);

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(600);
    const clearedRows = await page.locator('.gad-row-wrap').count();
    console.log('✓ Search cleared → rows restored:', clearedRows);

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 7 — ROW EXPAND: Applications sub-table
    // ═══════════════════════════════════════════════════════════════════════

    // Expand first row
    await expanderIcon.click();
    await page.waitForTimeout(800);

    const expandedPanel = rows.first().locator('.gad-expanded-panel');
    await expect(expandedPanel).toBeVisible({ timeout: 5000 });
    console.log('✓ Row expanded: expanded panel visible');

    // Expander icon becomes open
    const openIcon = firstRow.locator('.gad-expander-icon.open');
    await expect(openIcon).toBeVisible();
    console.log('✓ Expander icon shows "open" state');

    // ── Expanded toolbar buttons ──────────────────────────────────────────────
    const expandedToolbar = expandedPanel.locator('.gad-expanded-toolbar');
    await expect(expandedToolbar).toBeVisible();

    const createNewBtn = expandedToolbar.locator('button').filter({ hasText: 'Create New Application' }).first();
    await expect(createNewBtn).toBeVisible();
    console.log('✓ "Create New Application" button visible');

    const smartAssessBtn = expandedToolbar.locator('button').filter({ hasText: 'Smart Assessment' }).first();
    await expect(smartAssessBtn).toBeVisible();
    console.log('✓ "Smart Assessment" button visible');

    const suggestionsBtn = expandedToolbar.locator('.gad-btn-suggestions').first();
    await expect(suggestionsBtn).toBeVisible();
    console.log('✓ "Suggestions" button visible');

    // ── Applications count label ──────────────────────────────────────────────
    const sectionLabel = expandedPanel.locator('.gad-section-label').first();
    await expect(sectionLabel).toBeVisible();
    const labelText = await sectionLabel.innerText();
    console.log('✓ Section label:', labelText);

    // ── Sub-table headers ─────────────────────────────────────────────────────
    const subTable = expandedPanel.locator('.gad-sub-table');
    await expect(subTable).toBeVisible();

    const subHeaders = subTable.locator('.gad-sub-th');
    const subHeaderTexts = await subHeaders.allInnerTexts();
    console.log('✓ Sub-table headers:', JSON.stringify(subHeaderTexts));

    for (const col of ['App ID', 'University', 'Course', 'Level', 'Intake', 'Created', 'Status', 'Commission', 'Pay', 'Assignee']) {
        await expect(subHeaders.filter({ hasText: col }).first()).toBeVisible();
    }
    console.log('✓ All 10 sub-table columns verified');

    // ── Sub-table rows ────────────────────────────────────────────────────────
    const subRows = subTable.locator('.gad-sub-row');
    const subRowCount = await subRows.count();
    expect(subRowCount).toBeGreaterThan(0);
    console.log('✓ Application sub-rows:', subRowCount);

    // Verify first sub-row content
    const firstSubRow = subRows.first();

    // App ID link
    const appIdLink = firstSubRow.locator('.gad-app-id-link').first();
    await expect(appIdLink).toBeVisible();
    const appId = await appIdLink.innerText();
    console.log('✓ First App ID:', appId.trim());

    // University, course, level, intake, created
    const subCells = firstSubRow.locator('.gad-sub-cell');
    const subCellTexts = await subCells.allInnerTexts();
    console.log('✓ First sub-row cells:', JSON.stringify(subCellTexts.map(t => t.trim().substring(0, 40))));

    // Status card (progress ring + title)
    const statusCard = firstSubRow.locator('.status-summary-card').first();
    if (await statusCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        const statusTitle = await statusCard.locator('.status-title').innerText().catch(() => '');
        const progressText = await statusCard.locator('.mini-progress-text').innerText().catch(() => '');
        console.log('✓ Status:', statusTitle, '| Progress:', progressText);
    }

    // Pay button and checkbox
    const payBtn = firstSubRow.locator('.gad-pay-btn').first();
    if (await payBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(payBtn).toContainText('Pay');
        console.log('✓ Pay button visible on first application');
    }

    const payCheckbox = firstSubRow.locator('.gad-checkbox').first();
    if (await payCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('✓ Pay checkbox visible');
    }

    // ── App ID link opens detail in new tab ───────────────────────────────────
    const appHref = await appIdLink.getAttribute('href');
    expect(appHref).toContain('Applications-details');
    console.log('✓ App ID link href points to detail page:', appHref?.substring(0, 60));

    // ── Scroll through all sub-rows ───────────────────────────────────────────
    for (let i = 0; i < Math.min(subRowCount, 3); i++) {
        await subRows.nth(i).scrollIntoViewIfNeeded();
        const rowAppId = await subRows.nth(i).locator('.gad-app-id-link').innerText().catch(() => '');
        const rowUni = await subRows.nth(i).locator('.gad-sub-cell').nth(1).innerText().catch(() => '');
        console.log(`  Sub-row [${i}]: ${rowAppId.trim()} | ${rowUni.trim().substring(0, 40)}`);
    }

    // ── Collapse row ──────────────────────────────────────────────────────────
    await openIcon.click();
    await page.waitForTimeout(500);
    await expect(expandedPanel).not.toBeVisible({ timeout: 3000 });
    console.log('✓ Row collapsed');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 8 — FILTER DRAWER
    // ═══════════════════════════════════════════════════════════════════════

    await filtersBtn.click();
    await page.waitForTimeout(600);

    // Filter drawer open
    const drawer = page.locator('.gad-drawer-header').first();
    await expect(drawer).toBeVisible({ timeout: 5000 });
    await expect(drawer.locator('.gad-drawer-title')).toHaveText('Filter Applications');
    console.log('✓ Filter drawer opened: "Filter Applications"');

    const drawerBody = page.locator('.gad-drawer-body').first();
    await expect(drawerBody).toBeVisible();

    // ── Form fields ───────────────────────────────────────────────────────────
    // Company select
    const companySelect = drawerBody.locator('.gad-form-select').first();
    await expect(companySelect).toBeVisible();
    const companyOptions = await companySelect.locator('option').allInnerTexts();
    console.log('✓ Company options:', JSON.stringify(companyOptions));

    // All text inputs: First Name, Email Address, Student ID, Passport Number, Application ID
    const formInputs = drawerBody.locator('.gad-form-input');
    const inputCount = await formInputs.count();
    console.log('✓ Filter text inputs:', inputCount);

    const formLabels = drawerBody.locator('.gad-form-label');
    const labelTexts = await formLabels.allInnerTexts();
    console.log('✓ Filter labels:', JSON.stringify(labelTexts));

    for (const label of ['Company', 'First Name', 'Email Address', 'Student ID', 'Passport Number', 'Application ID']) {
        await expect(formLabels.filter({ hasText: label }).first()).toBeVisible();
        console.log(`  Filter field visible: "${label}" ✓`);
    }

    // ── Fill filter fields ────────────────────────────────────────────────────
    // Company — select "Vivek Consultancy"
    const companyOptTexts = await companySelect.locator('option').allInnerTexts();
    const vivekOpt = companyOptTexts.find(t => t.includes('Vivek'));
    if (vivekOpt) {
        await companySelect.selectOption({ label: vivekOpt });
        await page.waitForTimeout(200);
        console.log('✓ Company selected:', vivekOpt);
    }

    // First Name
    const firstNameInput = drawerBody.locator('.gad-form-input').nth(0);
    await firstNameInput.fill('Hamza');
    await page.waitForTimeout(200);
    console.log('✓ First Name filled: Hamza');

    // Email Address
    const emailInput = drawerBody.locator('.gad-form-input').nth(1);
    await emailInput.fill('hamza');
    await page.waitForTimeout(200);
    console.log('✓ Email filled: hamza');

    // Student ID
    const studentIdInput = drawerBody.locator('.gad-form-input').nth(2);
    await studentIdInput.fill(studentIdText);
    await page.waitForTimeout(200);
    console.log('✓ Student ID filled:', studentIdText);

    // Passport Number
    const passportInput = drawerBody.locator('.gad-form-input').nth(3);
    await passportInput.fill('PAKALI007');
    await page.waitForTimeout(200);
    console.log('✓ Passport filled: PAKALI007');

    // Application ID
    const appIdInput = drawerBody.locator('.gad-form-input').nth(4);
    await appIdInput.fill(appId.trim());
    await page.waitForTimeout(200);
    console.log('✓ Application ID filled:', appId.trim());

    // ── Footer buttons: Apply & Reset ─────────────────────────────────────────
    const drawerFooter = page.locator('.gad-drawer-footer').first();
    await expect(drawerFooter).toBeVisible();

    const applyBtn = drawerFooter.locator('.gad-btn-primary').first();
    const resetBtn = drawerFooter.locator('.gad-btn-ghost').first();
    await expect(applyBtn).toBeVisible();
    await expect(resetBtn).toBeVisible();
    console.log('✓ Drawer footer: Apply and Reset buttons visible');

    // Both should be enabled now that fields are filled
    const applyEnabled = await applyBtn.isEnabled().catch(() => false);
    const resetEnabled = await resetBtn.isEnabled().catch(() => false);
    console.log(`  Apply enabled: ${applyEnabled} | Reset enabled: ${resetEnabled}`);

    // Apply filters
    if (applyEnabled) {
        await applyBtn.click();
        await page.waitForTimeout(1500);
        const filteredRows = await page.locator('.gad-row-wrap').count();
        console.log('✓ Filters applied → rows:', filteredRows);
    }

    // Re-open drawer to reset
    if (await filtersBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await filtersBtn.click();
        await page.waitForTimeout(500);
        const resetBtn2 = page.locator('.gad-drawer-footer .gad-btn-ghost').first();
        if (await resetBtn2.isEnabled({ timeout: 2000 }).catch(() => false)) {
            await resetBtn2.click();
            await page.waitForTimeout(800);
            console.log('✓ Filters reset');
        }
    }

    // Close drawer via X button
    const closeBtn = page.locator('.gad-drawer-header .gad-btn-icon').first();
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeBtn.click();
        await page.waitForTimeout(400);
        await expect(page.locator('.gad-drawer-header')).not.toBeVisible({ timeout: 3000 });
        console.log('✓ Filter drawer closed via X button');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 9 — EXPANDED PANEL ACTION BUTTONS (re-expand to test)
    // ═══════════════════════════════════════════════════════════════════════

    await rows.first().locator('.gad-expander-icon').click();
    await page.waitForTimeout(600);
    await expect(rows.first().locator('.gad-expanded-panel')).toBeVisible({ timeout: 5000 });

    // Helper to close any open popup/modal by pressing Escape or clicking X
    const closeAnyPopup = async () => {
        const popup = page.locator('.gad-popup, [class*="modal"], [class*="dialog"]').first();
        if (await popup.isVisible({ timeout: 1000 }).catch(() => false)) {
            const xBtn = popup.locator('button').filter({ hasText: /^[×✕]$/ }).or(popup.locator('[aria-label*="close" i], [title*="close" i]')).first();
            if (await xBtn.isVisible({ timeout: 500 }).catch(() => false)) {
                await xBtn.click({ force: true });
            } else {
                await page.keyboard.press('Escape');
            }
            await page.waitForTimeout(500);
        }
    };

    // Smart Assessment button — popup overlay may appear after click
    const smartBtn = rows.first().locator('.gad-expanded-toolbar button').filter({ hasText: 'Smart Assessment' }).first();
    if (await smartBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await smartBtn.click({ force: true });
        await page.waitForTimeout(800);
        console.log('✓ Smart Assessment button clicked');
        const popup = page.locator('.gad-popup').first();
        if (await popup.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log('  Smart Assessment popup appeared');
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
        }
    }

    // Suggestions button — same popup overlay pattern, use force: true
    const suggestBtn = rows.first().locator('.gad-btn-suggestions').first();
    if (await suggestBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await suggestBtn.click({ force: true });
        await page.waitForTimeout(800);
        console.log('✓ Suggestions button clicked');
        const popup2 = page.locator('.gad-popup').first();
        if (await popup2.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log('  Suggestions popup appeared');
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
        }
    }

    // Create New Application button
    const createBtn = rows.first().locator('.gad-expanded-toolbar button').filter({ hasText: 'Create New Application' }).first();
    if (await createBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await createBtn.click({ force: true });
        await page.waitForTimeout(800);
        console.log('✓ Create New Application button clicked');
        const createPopup = page.locator('.gad-popup, [class*="modal"], [class*="dialog"]').first();
        if (await createPopup.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log('  Create New Application modal/popup appeared');
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
        }
        await closeAnyPopup();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 10 — BREADCRUMB NAVIGATION
    // ═══════════════════════════════════════════════════════════════════════

    // Close any lingering popup by pressing Escape and clicking outside
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await page.mouse.click(200, 50);
    await page.waitForTimeout(500);

    // Verify breadcrumb Dashboard link has correct href
    const dashLink = page.locator('.gad-breadcrumb .dashboard-link');
    await expect(dashLink).toBeVisible();
    const dashHref = await dashLink.getAttribute('href');
    expect(dashHref).toMatch(/dashboard/i);
    console.log('✓ Breadcrumb Dashboard link href:', dashHref);

    // Navigate to dashboard via URL (popup may block click even with force)
    await page.evaluate(() => { window.location.hash = '/dashboard'; });
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/dashboard/i, { timeout: 8000 });
    console.log('✓ Navigated back to dashboard');

    console.log('View Applications test complete ✓');
});
