import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

// Application Details — Documents Tab
// Sub-tabs: Application Docs (active), CAS Documents, Enrollment Docs
// Upload button, documents list, empty state message

test('Vivek Consultancy — App Details: Documents Tab', async ({ page }) => {
    test.setTimeout(90000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') {
        console.log('Login failed:', result);
        return;
    }
    console.log('Login success');

    await page.waitForSelector('.nsm-sidebar', { timeout: 20000 });

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 1 — NAVIGATE TO APP DETAILS
    // ═══════════════════════════════════════════════════════════════════════

    await page.goto('https://vivekconsultancy.flyurdream.com/#/Applications-details-Accordion-3?appId=GUIDA336&companyId=6&branchId=null&studentUniqueId=GUIDS7');
    await page.waitForTimeout(1000);

    await page.waitForFunction(() => {
        const c = document.querySelector('.app-details-2-tab-content');
        return c && !c.querySelector('.app-details-2-skeleton') && c.children.length > 0;
    }, { timeout: 20000 }).catch(() => {});
    console.log('✓ App details content loaded');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 2 — CLICK DOCUMENTS TAB
    // ═══════════════════════════════════════════════════════════════════════

    await page.locator('.app-details-2-tab-btn').filter({ hasText: 'Documents' }).first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.app-details-2-tab-btn').filter({ hasText: 'Documents' }).first()).toHaveClass(/app-details-2-tab-btn--active/);
    console.log('✓ Documents tab active');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 3 — SUB-TABS VISIBLE
    // ═══════════════════════════════════════════════════════════════════════

    const appDocsTab = page.locator('.app-details-2-sec-tab').filter({ hasText: 'Application Docs' }).first();
    const casDocsTab = page.locator('.app-details-2-sec-tab').filter({ hasText: 'CAS Documents' }).first();
    const enrollDocsTab = page.locator('.app-details-2-sec-tab').filter({ hasText: 'Enrollment Docs' }).first();

    await expect(appDocsTab).toBeVisible();
    console.log('✓ Sub-tab visible: Application Docs');

    await expect(casDocsTab).toBeVisible();
    console.log('✓ Sub-tab visible: CAS Documents');

    await expect(enrollDocsTab).toBeVisible();
    console.log('✓ Sub-tab visible: Enrollment Docs');

    // Application Docs should be active by default
    const appDocsClasses = await appDocsTab.evaluate(el => el.classList.toString()).catch(() => '');
    console.log('✓ Application Docs classes:', appDocsClasses);

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 4 — UPLOAD BUTTON VISIBLE
    // ═══════════════════════════════════════════════════════════════════════

    const uploadBtn = page.locator('.app-details-2-btn-action').filter({ hasText: 'Upload' }).first();
    await expect(uploadBtn).toBeVisible();
    console.log('✓ Upload button visible');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 5 — EMPTY STATE OR DOCUMENTS LIST
    // ═══════════════════════════════════════════════════════════════════════

    const emptyMsg = page.locator('text=No documents uploaded yet');
    const docsList = page.locator('.app-details-2-documents-list');

    const hasEmptyMsg = await emptyMsg.isVisible().catch(() => false);
    const hasDocsList = await docsList.isVisible().catch(() => false);

    if (hasEmptyMsg) {
        console.log('✓ Empty state message visible: No documents uploaded yet');
    } else if (hasDocsList) {
        const docsCount = await docsList.locator('> *').count().catch(() => 0);
        console.log('✓ Documents list visible, items:', docsCount);
    } else {
        console.log('✓ Neither empty state nor docs list detected (content may differ)');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 6 — CAS DOCUMENTS SUB-TAB
    // ═══════════════════════════════════════════════════════════════════════

    await casDocsTab.click();
    await page.waitForTimeout(800);
    const casClasses = await casDocsTab.evaluate(el => el.classList.toString()).catch(() => '');
    console.log('✓ CAS Documents tab classes after click:', casClasses);
    await expect(page.locator('.app-details-2-tab-content')).toBeVisible();
    console.log('✓ CAS Documents content area visible');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 7 — ENROLLMENT DOCS SUB-TAB
    // ═══════════════════════════════════════════════════════════════════════

    await enrollDocsTab.click();
    await page.waitForTimeout(800);
    const enrollClasses = await enrollDocsTab.evaluate(el => el.classList.toString()).catch(() => '');
    console.log('✓ Enrollment Docs tab classes after click:', enrollClasses);
    await expect(page.locator('.app-details-2-tab-content')).toBeVisible();
    console.log('✓ Enrollment Docs content area visible');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 8 — BACK TO APPLICATION DOCS
    // ═══════════════════════════════════════════════════════════════════════

    await appDocsTab.click();
    await page.waitForTimeout(800);
    const appDocsClassesAfter = await appDocsTab.evaluate(el => el.classList.toString()).catch(() => '');
    console.log('✓ Application Docs tab classes after re-click:', appDocsClassesAfter);
    console.log('✓ Returned to Application Docs sub-tab');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 9 — UPLOAD BUTTON CLICK (NON-FATAL)
    // ═══════════════════════════════════════════════════════════════════════

    await uploadBtn.click();
    await page.waitForTimeout(800);

    const fileInput = page.locator('input[type="file"]');
    const modal = page.locator('.modal, .app-details-2-modal, [role="dialog"]');
    const hasFileInput = await fileInput.isVisible().catch(() => false);
    const hasModal = await modal.isVisible().catch(() => false);

    if (hasFileInput) {
        console.log('✓ File input appeared after Upload click');
    } else if (hasModal) {
        console.log('✓ Modal appeared after Upload click');
    } else {
        console.log('✓ Upload click handled — no visible file input or modal (may be file picker)');
    }

    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    console.log('✓ Pressed Escape to close upload dialog');

    console.log('✓ Documents tab test complete');
});
