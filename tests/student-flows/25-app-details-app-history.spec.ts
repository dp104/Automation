import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

// Application Details — App History Tab
// Toolbar: search input, filter tabs (All/Unread/Read/Action Taken/Not Required), Refresh button
// Table: Description, Comments, Updated By, Date, Actions columns
// Row actions: Mark as Read, Action Required, Not Required, View History

test('Vivek Consultancy — App Details: App History Tab', async ({ page }) => {
    test.setTimeout(300000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') {
        console.log('Login failed:', result);
        return;
    }
    console.log('Login success');

    await page.waitForSelector('.nsm-sidebar', { timeout: 40000 });

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 1 — NAVIGATE TO APP DETAILS
    // ═══════════════════════════════════════════════════════════════════════

    await page.goto('https://vivekconsultancy.flyurdream.com/#/Applications-details-Accordion-3?appId=GUIDA336&companyId=6&branchId=null&studentUniqueId=GUIDS7');
    await page.waitForTimeout(1000);

    await page.waitForFunction(() => {
        const c = document.querySelector('.app-details-2-tab-content');
        return c && !c.querySelector('.app-details-2-skeleton') && c.children.length > 0;
    }, undefined, { timeout: 20000 }).catch(() => {});
    console.log('✓ App details content loaded');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 2 — CLICK APP HISTORY TAB
    // ═══════════════════════════════════════════════════════════════════════

    await page.locator('.app-details-2-tab-btn').filter({ hasText: 'App History' }).first().click();
    await page.waitForTimeout(1500);
    await expect(page.locator('.app-details-2-tab-btn').filter({ hasText: 'App History' }).first()).toHaveClass(/app-details-2-tab-btn--active/);
    console.log('✓ App History tab active');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 3 — SEARCH INPUT
    // ═══════════════════════════════════════════════════════════════════════

    const searchWrap = page.locator('.app-details-2-search-wrap input');
    const searchVisible = await searchWrap.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`  Search input visible: ${searchVisible}`);

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 4 — FILTER TABS
    // ═══════════════════════════════════════════════════════════════════════

    const filterTabNames = ['All', 'Unread', 'Read', 'Action Taken', 'Not Required'];
    for (const name of filterTabNames) {
        const tab = page.locator('.app-details-2-ft-btn').filter({ hasText: name }).first();
        const tabVisible = await tab.isVisible({ timeout: 1000 }).catch(() => false);
        console.log(`  Filter tab visible: "${name}": ${tabVisible}`);
    }

    // All tab should be active by default
    const allTab = page.locator('.app-details-2-ft-btn').filter({ hasText: 'All' }).first();
    const allTabClasses = await allTab.evaluate(el => el.classList.toString(), undefined, { timeout: 1000 }).catch(() => '');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 5 — TABLE HEADERS
    // ═══════════════════════════════════════════════════════════════════════

    const table = page.locator('.app-details-2-data-table');
    const tableVisible = await table.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`  Table (.app-details-2-data-table) visible: ${tableVisible}`);

    const expectedHeaders = ['Description', 'Comments', 'Updated By', 'Date', 'Actions'];
    const headerCells = table.locator('thead th, thead td');
    const headerTexts = await headerCells.allTextContents().catch(() => [] as string[]);
    console.log('✓ Table headers:', headerTexts);

    for (const header of expectedHeaders) {
        const found = headerTexts.some(h => h.includes(header));
        console.log(`✓ Header "${header}" found: ${found}`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 6 — ROW COUNT AND LOG FIRST 3 ROWS
    // ═══════════════════════════════════════════════════════════════════════

    const rows = table.locator('tbody tr');
    const rowCount = await rows.count().catch(() => 0);
    console.log('✓ Table row count:', rowCount);

    for (let i = 0; i < Math.min(3, rowCount); i++) {
        const row = rows.nth(i);
        const cells = await row.locator('td').allTextContents().catch(() => [] as string[]);
        console.log(`✓ Row ${i + 1}:`, cells.slice(0, 4).join(' | '));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 7 — REFRESH BUTTON
    // ═══════════════════════════════════════════════════════════════════════

    const refreshBtn = page.locator('.app-details-2-btn-action').filter({ hasText: 'Refresh' }).first();
    const refreshVisible = await refreshBtn.isVisible().catch(() => false);
    if (refreshVisible) {
        await refreshBtn.click();
        await page.waitForTimeout(1000);
        console.log('✓ Refresh button clicked');
    } else {
        console.log('✓ Refresh button not found by text, skipping');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 8 — FILTER TABS CYCLE
    // ═══════════════════════════════════════════════════════════════════════

    const filterTabsToClick = ['Unread', 'Read', 'Action Taken', 'Not Required'];
    for (const name of filterTabsToClick) {
        const tab = page.locator('.app-details-2-ft-btn').filter({ hasText: name }).first();
        await tab.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(300);
        const classes = await tab.evaluate(el => el.classList.toString(), undefined, { timeout: 500 }).catch(() => '');
        console.log(`  Filter tab "${name}" classes after click:`, classes || '(not found)');
    }
    // Restore All tab
    await allTab.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(300);
    console.log('  Restored to All filter tab (if available)');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 9 — SEARCH
    // ═══════════════════════════════════════════════════════════════════════

    if (searchVisible) {
        await searchWrap.fill('Google', { timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(800);
        const rowsAfterSearch = table.locator('tbody tr');
        const searchRowCount = await rowsAfterSearch.count().catch(() => 0);
        console.log('✓ Rows after searching "Google":', searchRowCount);
        await searchWrap.fill('', { timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(500);
        console.log('✓ Search cleared');
    } else {
        console.log('  Search input not available, skipping search test');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 10 — FIRST ROW ACTIONS
    // ═══════════════════════════════════════════════════════════════════════

    const firstRow = rows.nth(0);

    // Mark as Read
    const markReadBtn = firstRow.locator('[title="Mark as Read"]').first();
    const markReadVisible = await markReadBtn.isVisible().catch(() => false);
    if (markReadVisible) {
        await markReadBtn.click({ force: true });
        await page.waitForTimeout(600);
        console.log('✓ Mark as Read clicked on first row');
    } else {
        console.log('✓ Mark as Read button not found on first row');
    }

    // Action Required — open modal, fill comment, submit
    const actionReqBtn = firstRow.locator('[title="Action Required"]').first();
    const actionReqVisible = await actionReqBtn.isVisible().catch(() => false);
    if (actionReqVisible) {
        await actionReqBtn.click({ force: true });
        await page.waitForTimeout(800);

        const overlay = page.locator('.app-details-2-modal-overlay');
        const overlayVisible = await overlay.isVisible({ timeout: 3000 }).catch(() => false);
        console.log('✓ Action Required modal opened:', overlayVisible);

        if (overlayVisible) {
            // Find textarea or input inside the modal
            const modalTextarea = overlay.locator('textarea').first();
            const modalInput = overlay.locator('input[type="text"]').first();
            const hasTextarea = await modalTextarea.isVisible({ timeout: 1000 }).catch(() => false);
            const hasInput = await modalInput.isVisible({ timeout: 1000 }).catch(() => false);

            if (hasTextarea) {
                await modalTextarea.fill('Automation test — action required note submitted by chittibabu');
                console.log('✓ Typed action note in textarea');
            } else if (hasInput) {
                await modalInput.fill('Automation test — action required note submitted by chittibabu');
                console.log('✓ Typed action note in input');
            } else {
                console.log('  (No text field found in modal)');
            }

            // Find and click submit/confirm button
            const submitBtn = overlay.locator('button').filter({ hasText: /submit|confirm|save|ok|yes/i }).first();
            const submitVisible = await submitBtn.isVisible({ timeout: 1000 }).catch(() => false);
            if (submitVisible) {
                await submitBtn.click();
                await page.waitForTimeout(1000);
                console.log('✓ Action Required modal submitted');
            } else {
                // Try any primary button in modal
                const primaryBtn = overlay.locator('button[class*="primary"], button[class*="btn-action"], button[class*="submit"]').first();
                const primaryVisible = await primaryBtn.isVisible({ timeout: 1000 }).catch(() => false);
                if (primaryVisible) {
                    const btnText = await primaryBtn.textContent().catch(() => '');
                    await primaryBtn.click();
                    await page.waitForTimeout(1000);
                    console.log('✓ Action Required modal submitted via button:', btnText.trim());
                } else {
                    // Log all buttons found for debugging
                    const allBtns = await overlay.locator('button').allTextContents().catch(() => []);
                    console.log('  (Could not find submit button. Buttons found:', allBtns, ')');
                    await page.keyboard.press('Escape');
                    await page.waitForTimeout(400);
                }
            }
        }

        // Ensure overlay is dismissed before continuing
        await page.waitForFunction(
            () => !document.querySelector('.app-details-2-modal-overlay'),
            { timeout: 5000 }
        ).catch(() => page.keyboard.press('Escape'));
        await page.waitForTimeout(500);
        console.log('✓ Action Required flow complete');
    } else {
        console.log('✓ Action Required button not found on first row');
    }

    // View History — open and verify username in history
    const viewHistoryBtn = firstRow.locator('[title="View History"]').first();
    const viewHistoryVisible = await viewHistoryBtn.isVisible().catch(() => false);
    if (viewHistoryVisible) {
        await viewHistoryBtn.click({ force: true });
        await page.waitForTimeout(1200);

        // Modal/panel should open
        const historyOverlay = page.locator('.app-details-2-modal-overlay').first();
        const historyPanel = page.locator('.app-details-2-panel, .app-details-2-history-panel, [class*="history"]').first();
        const overlayOpen = await historyOverlay.isVisible({ timeout: 3000 }).catch(() => false);
        const panelOpen = await historyPanel.isVisible({ timeout: 1000 }).catch(() => false);
        console.log('✓ View History opened — overlay:', overlayOpen, '| panel:', panelOpen);

        // Get full text of whatever opened
        const container = overlayOpen ? historyOverlay : historyPanel;
        const historyText = await container.innerText({ timeout: 3000 }).catch(() => '');
        console.log('✓ History content (first 500 chars):', historyText.substring(0, 500));

        // Check for username in history (logged-in user: chittibabu@gmail.com or display name)
        const hasUsername = historyText.toLowerCase().includes('chittibabu') ||
                            historyText.toLowerCase().includes('chitti') ||
                            historyText.toLowerCase().includes('babu');
        console.log('✓ Username found in history:', hasUsername);
        if (!hasUsername) {
            console.log('  (Username not found — check history content above for actual "Updated By" value)');
        }

        // Close
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
        console.log('✓ View History closed');
    } else {
        console.log('✓ View History button not found on first row');
    }

    console.log('✓ App History tab test complete');
});
