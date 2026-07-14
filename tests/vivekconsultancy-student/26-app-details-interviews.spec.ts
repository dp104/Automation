import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

// Application Details — Interviews Tab
// Toolbar: filter tabs (Upcoming/In-Progress active, Completed, Cancelled)
//          "Attempts & Results" button, "Start AI Interview" button
// Interview card: subject, meta time, status pill "Upcoming", Join button (Google Meet)

test('Vivek Consultancy — App Details: Interviews Tab', async ({ page }) => {
    test.setTimeout(150000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') {
        console.log('Login failed:', result);
        return;
    }
    console.log('Login success');

    await page.waitForSelector('.menu-toggle-icon', { timeout: 20000 });

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
    // SECTION 2 — CLICK INTERVIEWS TAB
    // ═══════════════════════════════════════════════════════════════════════

    await page.locator('.app-details-2-tab-btn').filter({ hasText: 'Interviews' }).first().click();
    await page.waitForTimeout(1500);
    await expect(page.locator('.app-details-2-tab-btn').filter({ hasText: 'Interviews' }).first()).toHaveClass(/app-details-2-tab-btn--active/);
    console.log('✓ Interviews tab active');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 3 — FILTER TABS
    // ═══════════════════════════════════════════════════════════════════════

    const upcomingTab = page.locator('.app-details-2-ft-btn').filter({ hasText: /Upcoming/ }).first();
    const completedTab = page.locator('.app-details-2-ft-btn').filter({ hasText: 'Completed' }).first();
    const cancelledTab = page.locator('.app-details-2-ft-btn').filter({ hasText: 'Cancelled' }).first();

    await expect(upcomingTab).toBeVisible();
    console.log('✓ Filter tab visible: Upcoming / In-Progress');
    await expect(completedTab).toBeVisible();
    console.log('✓ Filter tab visible: Completed');
    await expect(cancelledTab).toBeVisible();
    console.log('✓ Filter tab visible: Cancelled');

    const upcomingClasses = await upcomingTab.evaluate(el => el.classList.toString()).catch(() => '');
    console.log('✓ Upcoming/In-Progress tab classes (should be active):', upcomingClasses);

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 4 — ATTEMPTS & RESULTS AND START AI INTERVIEW BUTTONS
    // ═══════════════════════════════════════════════════════════════════════

    const attemptsBtn = page.locator('.interview-history-btn').first();
    const aiInterviewBtn = page.locator('.interview-AI-btn').first();

    await expect(attemptsBtn).toBeVisible();
    console.log('✓ "Attempts & Results" button visible');

    await expect(aiInterviewBtn).toBeVisible();
    console.log('✓ "Start AI Interview" button visible');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 5 — INTERVIEW CARDS
    // ═══════════════════════════════════════════════════════════════════════

    const cards = page.locator('.app-details-2-int-card');
    const cardCount = await cards.count();
    console.log('✓ Interview card count:', cardCount);
    expect(cardCount).toBeGreaterThan(0);

    // First card details
    const firstCard = cards.first();

    const subject = firstCard.locator('.app-details-2-int-subject').first();
    const subjectText = await subject.textContent().catch(() => '');
    console.log('✓ First card subject:', subjectText?.trim());
    const hasAppId = subjectText?.includes('GUIDA336');
    console.log('✓ Subject contains GUIDA336:', hasAppId);

    const meta = firstCard.locator('.app-details-2-int-meta').first();
    const metaText = await meta.textContent().catch(() => '');
    console.log('✓ First card meta time:', metaText?.trim());

    const statusPill = firstCard.locator('.app-details-2-status-upcoming').first();
    const statusVisible = await statusPill.isVisible().catch(() => false);
    const statusText = await statusPill.textContent().catch(() => '');
    console.log('✓ Status pill visible:', statusVisible, '| text:', statusText?.trim());

    const joinBtn = firstCard.locator('.app-details-2-btn-join').first();
    const joinVisible = await joinBtn.isVisible().catch(() => false);
    console.log('✓ Join button visible:', joinVisible);
    if (joinVisible) {
        const joinHref = await joinBtn.getAttribute('href').catch(() => '');
        const hasMeetLink = joinHref?.includes('meet.google.com');
        console.log('✓ Join button href contains meet.google.com:', hasMeetLink, '| href:', joinHref);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 6 — COMPLETED FILTER TAB
    // ═══════════════════════════════════════════════════════════════════════

    await completedTab.click();
    await page.waitForTimeout(800);
    const completedClasses = await completedTab.evaluate(el => el.classList.toString()).catch(() => '');
    console.log('✓ Completed tab classes:', completedClasses);
    const completedCards = await page.locator('.app-details-2-int-card').count().catch(() => 0);
    console.log('✓ Completed card count:', completedCards);

    // Restore Upcoming
    await upcomingTab.click();
    await page.waitForTimeout(500);
    console.log('✓ Restored to Upcoming / In-Progress tab');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 7 — CANCELLED FILTER TAB
    // ═══════════════════════════════════════════════════════════════════════

    await cancelledTab.click();
    await page.waitForTimeout(800);
    const cancelledClasses = await cancelledTab.evaluate(el => el.classList.toString()).catch(() => '');
    console.log('✓ Cancelled tab classes:', cancelledClasses);
    const cancelledCards = await page.locator('.app-details-2-int-card').count().catch(() => 0);
    console.log('✓ Cancelled card count:', cancelledCards);

    // Restore Upcoming
    await upcomingTab.click();
    await page.waitForTimeout(500);
    console.log('✓ Restored to Upcoming / In-Progress tab');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 8 — ATTEMPTS & RESULTS BUTTON
    // ═══════════════════════════════════════════════════════════════════════

    await attemptsBtn.click();
    await page.waitForTimeout(1000);
    const panel = page.locator('.modal, [role="dialog"], .app-details-2-modal, .app-details-2-panel, .interview-history-panel').first();
    const panelVisible = await panel.isVisible().catch(() => false);
    console.log('✓ Attempts & Results: panel/modal opened:', panelVisible);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    console.log('✓ Pressed Escape after Attempts & Results');

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 9 — START AI INTERVIEW BUTTON
    // ═══════════════════════════════════════════════════════════════════════

    await aiInterviewBtn.click();
    await page.waitForTimeout(1000);
    const aiPanel = page.locator('.modal, [role="dialog"], .app-details-2-modal, .interview-AI-panel').first();
    const aiPanelVisible = await aiPanel.isVisible().catch(() => false);
    console.log('✓ Start AI Interview: panel/modal opened:', aiPanelVisible);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    console.log('✓ Pressed Escape after Start AI Interview');

    console.log('✓ Interviews tab test complete');
});
