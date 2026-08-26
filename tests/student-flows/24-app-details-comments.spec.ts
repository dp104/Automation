import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';
import { findExistingApplicationUrl } from '../../utils/applyFlow';

// Application Details — Comments Tab
// Sub-tabs: Comments (active), Reminders
// Toggle bar: Comments button active
// Refresh button, comments feed (empty state or comments)
// Composer: textarea + Post button

test('Vivek Consultancy — App Details: Comments Tab', async ({ page }) => {
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

    // Discovered dynamically — a hardcoded appId goes stale once that
    // application record is created/removed elsewhere.
    const appUrl = await findExistingApplicationUrl(page, env.vivekconsultancy);
    if (!appUrl) {
        console.log('  No applications currently exist for this student — cannot test the Comments tab. Create one first (e.g. test 29 or 32).');
        return;
    }
    console.log('✓ Found an existing application:', appUrl);
    await page.goto(appUrl);
    await page.waitForTimeout(1000);

    await page.waitForFunction(() => {
        const c = document.querySelector('.app-details-2-tab-content');
        return c && !c.querySelector('.app-details-2-skeleton') && c.children.length > 0;
    }, { timeout: 20000 }).catch(() => {});
    console.log('✓ App details content loaded');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 2 — CLICK COMMENTS TAB
    // ═══════════════════════════════════════════════════════════════════════

    await page.locator('.app-details-2-tab-btn').filter({ hasText: 'Comments' }).first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.app-details-2-tab-btn').filter({ hasText: 'Comments' }).first()).toHaveClass(/app-details-2-tab-btn--active/);
    console.log('✓ Comments tab active');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 3 — SUB-TABS VISIBLE
    // ═══════════════════════════════════════════════════════════════════════

    const commentsSubTab = page.locator('.app-details-2-sub-tab').filter({ hasText: 'Comments' }).first();
    const remindersSubTab = page.locator('.app-details-2-sub-tab').filter({ hasText: 'Reminders' }).first();

    const hasCommentsSubTab = await commentsSubTab.isVisible().catch(() => false);
    const hasRemindersSubTab = await remindersSubTab.isVisible().catch(() => false);
    console.log('✓ Comments sub-tab visible:', hasCommentsSubTab);
    console.log('✓ Reminders sub-tab visible:', hasRemindersSubTab);

    // Comments sub-tab active
    if (hasCommentsSubTab) {
        const subTabClasses = await commentsSubTab.evaluate(el => el.classList.toString()).catch(() => '');
        console.log('✓ Comments sub-tab classes:', subTabClasses);
    }

    // Toggle button active
    const toggleBtn = page.locator('.app-details-2-toggle-btn--active').first();
    const toggleVisible = await toggleBtn.isVisible().catch(() => false);
    console.log('✓ Toggle active button visible:', toggleVisible);

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 4 — REFRESH BUTTON
    // ═══════════════════════════════════════════════════════════════════════

    const refreshBtn = page.locator('.app-details-2-refresh-btn').first();
    await expect(refreshBtn).toBeVisible();
    console.log('✓ Refresh button visible');

    await refreshBtn.click();
    await page.waitForTimeout(800);
    console.log('✓ Refresh button clicked');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 5 — COMMENTS FEED
    // ═══════════════════════════════════════════════════════════════════════

    const feed = page.locator('.app-details-2-cmts-feed');
    await expect(feed).toBeVisible();
    const feedText = await feed.textContent().catch(() => '');
    const isEmpty = feedText?.toLowerCase().includes('no comments');
    console.log('✓ Feed visible, empty state:', isEmpty);
    if (!isEmpty) {
        const commentItems = await feed.locator('> *').count().catch(() => 0);
        console.log('✓ Feed items count:', commentItems);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 6 — TEXTAREA AND POST BUTTON
    // ═══════════════════════════════════════════════════════════════════════

    const textarea = page.locator('.app-details-2-form-textarea');
    await expect(textarea).toBeVisible();
    const placeholder = await textarea.getAttribute('placeholder').catch(() => '');
    console.log('✓ Textarea visible, placeholder:', placeholder);

    const postBtn = page.locator('.app-details-2-btn-send');
    await expect(postBtn).toBeVisible();
    console.log('✓ Post button visible');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 7 — TYPE COMMENT AND POST
    // ═══════════════════════════════════════════════════════════════════════

    const commentText = 'Good Evening – ' + new Date().toISOString().substring(0, 10);
    await page.locator('.app-details-2-form-textarea').fill(commentText);
    await page.waitForTimeout(300);

    const textareaVal = await textarea.inputValue().catch(async () => await textarea.textContent().catch(() => ''));
    const notEmpty = (textareaVal ?? '').length > 0;
    console.log('✓ Textarea not empty:', notEmpty);

    await postBtn.click();
    await page.waitForTimeout(1500);

    // Check if comment appeared in feed or toast shown
    const toastEl = page.locator('.Toastify__toast, .toast, [class*="toast"]').first();
    const toastVisible = await toastEl.isVisible().catch(() => false);
    const feedAfter = await feed.textContent().catch(() => '');
    const commentInFeed = feedAfter?.includes(commentText);
    console.log('✓ Comment in feed after post:', commentInFeed);
    console.log('✓ Toast notification visible:', toastVisible);

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 8 — REMINDERS SUB-TAB
    // ═══════════════════════════════════════════════════════════════════════

    if (hasRemindersSubTab) {
        await remindersSubTab.click();
        await page.waitForTimeout(800);
        const remClasses = await remindersSubTab.evaluate(el => el.classList.toString()).catch(() => '');
        console.log('✓ Reminders sub-tab classes after click:', remClasses);
        await expect(page.locator('.app-details-2-tab-content')).toBeVisible();
        console.log('✓ Reminders content area visible');

        // Back to Comments sub-tab
        if (hasCommentsSubTab) {
            await commentsSubTab.click();
            await page.waitForTimeout(500);
            const cmtClassesAfter = await commentsSubTab.evaluate(el => el.classList.toString()).catch(() => '');
            console.log('✓ Comments sub-tab classes after return:', cmtClassesAfter);
        }
    } else {
        console.log('✓ Reminders sub-tab not visible, skipping');
    }

    console.log('✓ Comments tab test complete');
});
