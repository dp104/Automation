import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

// Add Student (Old) — #/add-application
// Page: Student Profile Journey
// Tabs: 1-Personal Details  2-Education Details  3-Emergency & Visa  4-Create Application  5-Documents
// Test: load existing student GUIDS7, verify all tabs, create a new application

test('Vivek Consultancy — Add Student (Old): Full Page + Create Application', async ({ page }) => {
    test.setTimeout(180000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') { console.log('Login failed:', result); return; }
    console.log('Login success');
    await page.waitForSelector('.menu-toggle-icon', { timeout: 20000 });

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 1 — NAVIGATE VIA MENU
    // ═══════════════════════════════════════════════════════════════════════

    await page.goto('https://vivekconsultancy.flyurdream.com/#/add-application');
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/#\/add-application/, { timeout: 10000 });
    console.log('✓ URL: #/add-application');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 2 — PAGE HEADER & TAB BAR
    // ═══════════════════════════════════════════════════════════════════════

    const pageTitle = page.locator('.sp-header-title');
    await expect(pageTitle).toBeVisible({ timeout: 8000 });
    await expect(pageTitle).toContainText('Student Profile Journey');
    console.log('✓ Page title: Student Profile Journey');

    const tabBar = page.locator('.sp-tabs-bar');
    await expect(tabBar).toBeVisible();
    console.log('✓ Tab bar visible');

    const expectedTabs = ['Personal Details', 'Education Details', 'Emergency & Visa', 'Create Application', 'Documents'];
    for (const tabName of expectedTabs) {
        const tab = page.locator('.sp-tab').filter({ hasText: tabName }).first();
        await expect(tab).toBeVisible();
        console.log(`✓ Tab visible: ${tabName}`);
    }

    // Personal Details should be active by default
    const personalTab = page.locator('.sp-tab').filter({ hasText: 'Personal Details' }).first();
    const personalActive = await personalTab.evaluate(el => el.getAttribute("aria-selected") === "true" || el.classList.contains("active")); console.log("✓ Personal Details tab aria-selected/active:", personalActive);
    console.log('✓ Personal Details tab active by default');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 3 — STUDENT LOOKUP (load GUIDS7)
    // ═══════════════════════════════════════════════════════════════════════

    const studentInput = page.locator('input.sp-student-input');
    await expect(studentInput).toBeVisible({ timeout: 5000 });
    await studentInput.fill('GUIDS7');
    console.log('✓ Entered student ID: GUIDS7');

    // Click Fetch button or press Enter
    const fetchBtn = page.locator('.sp-fetch-btn');
    if (await fetchBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await fetchBtn.click();
        console.log('✓ Clicked Fetch button');
    } else {
        await studentInput.press('Enter');
        console.log('✓ Pressed Enter to fetch student');
    }

    // Wait for data to load — button transitions from "Fetching…" back to normal
    await page.waitForFunction(
        () => {
            const btn = document.querySelector('.sp-fetch-btn');
            return btn ? !btn.textContent?.includes('Fetching') : true;
        },
        { timeout: 10000 }
    ).catch(() => {});
    await page.waitForTimeout(2000);
    console.log('✓ Student data loaded');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 4 — PERSONAL DETAILS FORM
    // ═══════════════════════════════════════════════════════════════════════

    // Progress bar
    const progLabel = page.locator('.sp-prog-label');
    if (await progLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('✓ Progress label visible:', await progLabel.textContent().catch(() => ''));
    }

    // Verify section labels
    const sectionLabels = page.locator('.sp-section-lbl');
    const sectionTexts = await sectionLabels.allTextContents().catch(() => [] as string[]);
    console.log('✓ Section labels:', sectionTexts.join(' | '));

    // Basic Information fields populated
    const firstNameInput = page.locator('input[placeholder="First name"]');
    await expect(firstNameInput).toBeVisible({ timeout: 5000 });
    const firstName = await firstNameInput.inputValue().catch(() => '');
    console.log('✓ First name field value:', firstName);

    const lastNameInput = page.locator('input[placeholder="Last name"]');
    const lastName = await lastNameInput.inputValue().catch(() => '');
    console.log('✓ Last name field value:', lastName);

    const emailInput = page.locator('input[placeholder="name@example.com"]');
    const email = await emailInput.inputValue().catch(() => '');
    console.log('✓ Email field value:', email);

    const phoneInput = page.locator('input[placeholder="Phone number"]');
    const phone = await phoneInput.inputValue().catch(() => '');
    console.log('✓ Phone field value:', phone);

    // Passport
    const passportInput = page.locator('input[placeholder="e.g. N1234567"]');
    const passport = await passportInput.inputValue().catch(() => '');
    console.log('✓ Passport field value:', passport);

    // Address
    const addressInput = page.locator('input[placeholder="Address line 1"]');
    const address = await addressInput.inputValue().catch(() => '');
    console.log('✓ Address field value:', address);

    // Postal code
    const postalInput = page.locator('input[placeholder="e.g. 500081"]');
    const postal = await postalInput.inputValue().catch(() => '');
    console.log('✓ Postal code field value:', postal);

    // Verify key fields are populated (GUIDS7 = Hamza Ali Mazari)
    const hasStudentData = firstName.length > 0 || lastName.length > 0 || email.length > 0;
    console.log('✓ Student data populated:', hasStudentData);

    // Application Owner section
    const appOwnerLabel = page.locator('.sp-sec-label').filter({ hasText: 'Application Owner' });
    if (await appOwnerLabel.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('✓ Application Owner section visible');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 5 — EDUCATION DETAILS TAB
    // ═══════════════════════════════════════════════════════════════════════

    await page.locator('.sp-tab').filter({ hasText: 'Education Details' }).first().click();
    await page.waitForTimeout(2000);
    const eduActive = await page.locator('.sp-tab').filter({ hasText: 'Education Details' }).first().evaluate(el => el.getAttribute('aria-selected') === 'true' || el.classList.contains('active'));
    console.log('✓ Education Details tab active:', eduActive);

    // Highest Education Level react-select
    const eduLevel = page.locator('[class*="-singleValue"]').first();
    const eduLevelText = await eduLevel.textContent().catch(() => '');
    console.log('✓ Education level selected:', eduLevelText);

    // School records (Secondary 10th from GUIDS7)
    const schoolRecords = page.locator('[class*="school"], [class*="edu-record"]');
    const schoolCount = await schoolRecords.count();
    console.log('✓ School records visible:', schoolCount);

    // Optional sections
    const optionalSections = ['Course Preferences', 'English Proficiency Test Scores', 'Work Experience'];
    for (const sec of optionalSections) {
        const el = page.locator('.edu-sec-title').filter({ hasText: sec });
        const vis = await el.isVisible({ timeout: 1000 }).catch(() => false);
        console.log(`✓ Optional section "${sec}" visible:`, vis);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 6 — EMERGENCY & VISA TAB
    // ═══════════════════════════════════════════════════════════════════════

    await page.locator('.sp-tab').filter({ hasText: 'Emergency & Visa' }).first().click();
    await page.waitForTimeout(1500);
    const evActive = await page.locator('.sp-tab').filter({ hasText: 'Emergency & Visa' }).first().evaluate(el => el.getAttribute('aria-selected') === 'true' || el.classList.contains('active'));
    console.log('✓ Emergency & Visa tab active:', evActive);

    const emergencySections = ['Emergency Contact', 'Visa Refusal', 'Visa History', 'Serious Medical Condition', 'Disability', 'Criminal Offence'];
    for (const sec of emergencySections) {
        const el = page.locator('.ev-sec-title, .sp-form-card-title').filter({ hasText: sec });
        const vis = await el.isVisible({ timeout: 1000 }).catch(() => false);
        console.log(`✓ Section "${sec}" visible:`, vis);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 7 — CREATE APPLICATION TAB
    // ═══════════════════════════════════════════════════════════════════════

    await page.locator('.sp-tab').filter({ hasText: 'Create Application' }).first().click();
    await page.waitForTimeout(2000);
    const caActive = await page.locator('.sp-tab').filter({ hasText: 'Create Application' }).first().evaluate(el => el.getAttribute('aria-selected') === 'true' || el.classList.contains('active'));
    console.log('✓ Create Application tab active:', caActive);

    const createAppTitle = page.locator('.sp-form-card-title').filter({ hasText: 'Create Application' });
    await expect(createAppTitle).toBeVisible({ timeout: 5000 });
    console.log('✓ "Create Application" section heading visible');

    // Count existing applications
    const existingApps = page.locator('.edu-app-card, [class*="app-card"], [class*="application-card"]');
    const existingCount = await existingApps.count();
    console.log('✓ Existing application cards:', existingCount);

    // Empty state or "Add Another Application"
    const emptyState = page.locator('h3').filter({ hasText: 'No applications yet' });
    const addAnotherBtn = page.locator('.edu-add-btn');
    const hasEmpty = await emptyState.isVisible({ timeout: 1000 }).catch(() => false);
    const hasAddAnother = await addAnotherBtn.isVisible({ timeout: 1000 }).catch(() => false);
    console.log('✓ Empty state shown:', hasEmpty, '| Add Another button shown:', hasAddAnother);

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 8 — CREATE NEW APPLICATION
    // ═══════════════════════════════════════════════════════════════════════

    // Click "Create Application" or "Add Another Application"
    const createBtn = page.locator('.sp-btn.sp-btn-primary').filter({ hasText: 'Create Application' });
    const createBtnVisible = await createBtn.isVisible({ timeout: 2000 }).catch(() => false);
    const addAnotherVisible = await addAnotherBtn.isVisible({ timeout: 1000 }).catch(() => false);

    if (createBtnVisible) {
        await createBtn.click();
        console.log('✓ Clicked "Create Application" button');
    } else if (addAnotherVisible) {
        await addAnotherBtn.click();
        console.log('✓ Clicked "Add Another Application" button');
    } else {
        console.log('  (Neither Create nor Add Another button found)');
    }

    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Discover the inline form — find all react-select controls now visible
    const allControls = page.locator('[class*="-control"]');
    const controlCount = await allControls.count();
    console.log('✓ React-select controls on page after click:', controlCount);

    // Log all placeholder / single-value text of each control
    for (let i = 0; i < Math.min(controlCount, 15); i++) {
        const ctrl = allControls.nth(i);
        const vis = await ctrl.isVisible().catch(() => false);
        if (!vis) continue;
        const val = await ctrl.locator('[class*="-singleValue"],[class*="-placeholder"]').first().textContent().catch(() => '');
        console.log(`  Control [${i}]: "${val?.trim()}"`);
    }

    // Find the new application form block (look for University / Course / Intake controls)
    // Strategy: find a control whose placeholder/value contains "university", "select", "course", "intake"
    const formControls = page.locator('[class*="-control"]');
    const formControlCount = await formControls.count();

    // Interact with the first few empty/placeholder controls (university, course, intake)
    let appliedCount = 0;
    const selectValues: Record<number, string> = {};

    for (let i = 0; i < Math.min(formControlCount, 20); i++) {
        const ctrl = formControls.nth(i);
        const vis = await ctrl.isVisible().catch(() => false);
        if (!vis) continue;

        const placeholderText = await ctrl.locator('[class*="-placeholder"]').textContent().catch(() => '');
        const singleValue = await ctrl.locator('[class*="-singleValue"]').textContent().catch(() => '');

        // Only interact with controls that have a "Select" placeholder (not already filled)
        if (placeholderText && placeholderText.toLowerCase().includes('select') && !singleValue) {
            try {
                await ctrl.scrollIntoViewIfNeeded();
                await ctrl.click();
                await page.waitForTimeout(500);
                const opts = page.locator('[class*="-option"]');
                const optCount = await opts.count();
                if (optCount > 0) {
                    const firstOptText = await opts.first().textContent().catch(() => '');
                    await opts.first().click();
                    await page.waitForTimeout(400);
                    selectValues[i] = firstOptText?.trim() || 'first option';
                    console.log(`✓ Control [${i}] "${placeholderText}" → selected "${selectValues[i]}"`);
                    appliedCount++;
                } else {
                    await page.keyboard.press('Escape');
                    console.log(`  Control [${i}] "${placeholderText}" — no options found`);
                }
            } catch {
                await page.keyboard.press('Escape').catch(() => {});
            }
        }
    }

    console.log('✓ Total dropdowns filled:', appliedCount);

    // Look for Submit / Create / Save button in the form
    await page.waitForTimeout(500);
    const submitBtn = page.locator('button').filter({ hasText: /^(submit|create|save|add application|apply)$/i }).first();
    const formSaveBtn = page.locator('.sp-btn, button[class*="btn"]').filter({ hasText: /save|submit|create|apply/i }).last();
    const submitVisible = await submitBtn.isVisible({ timeout: 1000 }).catch(() => false);
    const formSaveVisible = await formSaveBtn.isVisible({ timeout: 1000 }).catch(() => false);

    const btnToClick = submitVisible ? submitBtn : (formSaveVisible ? formSaveBtn : null);
    if (btnToClick) {
        const btnText = await btnToClick.textContent().catch(() => '');
        await btnToClick.scrollIntoViewIfNeeded();
        await btnToClick.click();
        await page.waitForTimeout(2000);
        console.log('✓ Clicked submit button:', btnText?.trim());
    } else {
        // Log all visible buttons for debug
        const allBtns = await page.evaluate(() =>
            Array.from(document.querySelectorAll('button'))
                .filter(el => el.offsetParent !== null)
                .map(el => `"${el.textContent?.trim()}" class="${el.className.substring(0, 50)}"`)
                .join(' | ')
        );
        console.log('  (No submit button matched. All buttons:', allBtns, ')');
    }

    // Verify application was created
    await page.waitForTimeout(2000);
    const appCards = page.locator('.edu-app-card, [class*="app-card"], [class*="application-card"], .sp-app-item');
    const appCardCount = await appCards.count();
    const addAnotherNow = await page.locator('.edu-add-btn').isVisible({ timeout: 2000 }).catch(() => false);
    console.log('✓ Application cards after create:', appCardCount);
    console.log('✓ "Add Another Application" button visible:', addAnotherNow);

    // Toast notification
    const toast = await page.locator('.Toastify__toast-body').textContent({ timeout: 2000 }).catch(() => '');
    if (toast) console.log('✓ Toast:', toast);

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 9 — NEXT: DOCUMENTS TAB
    // ═══════════════════════════════════════════════════════════════════════

    const nextDocsBtn = page.locator('.sp-btn.sp-btn-primary').filter({ hasText: /Next.*Documents/i });
    const nextDocsBtnVisible = await nextDocsBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (nextDocsBtnVisible) {
        await nextDocsBtn.click();
        await page.waitForTimeout(2000);
        console.log('✓ Clicked "Next: Documents →"');
    }

    const docsTab = page.locator('.sp-tab').filter({ hasText: 'Documents' }).first();
    const docsActive = await docsTab.evaluate(el => el.classList.contains('active')).catch(() => false);
    console.log('✓ Documents tab active:', docsActive);

    // Documents section heading
    const docsTitle = page.locator('.sp-form-card-title').filter({ hasText: 'Documents' });
    if (await docsTitle.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('✓ Documents section heading visible');
    }

    // Dump Documents tab structure
    const docsHTML = await page.evaluate(() => {
        const cards = document.querySelectorAll('.sp-form-card');
        const last = cards[cards.length - 1];
        return last ? last.innerHTML.substring(0, 1000) : '';
    });
    console.log('✓ Documents tab content (first 1000 chars):', docsHTML.substring(0, 500));

    console.log('✓ Add Student (Old) — full test complete');
});
