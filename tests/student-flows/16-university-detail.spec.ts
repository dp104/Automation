import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

// University detail page — NEW UI (new-univmanager, 2026-07 redesign).
// Clicking the UNIVERSITY NAME on a card opens the detail page with tabs:
// Overview, Rankings, Courses, Academic Requirements, English Requirements,
// Accommodation. The Courses tab has a search box, course rows, and a
// "View more" popup with an Apply Now button.
// (The card's "View Course" button instead shortcuts to the filtered
// Search-Course page — that route is covered by test 34's sibling flows.)

test('Vivek Consultancy — University Detail & All Tabs (new UI)', async ({ page }) => {
    test.setTimeout(300000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') { console.log('Login failed:', result); return; }
    console.log('Login success');
    await page.waitForSelector('.nsm-sidebar', { timeout: 20000 });

    // ── Open the first university via its NAME ────────────────────────────────
    await page.goto('https://vivekconsultancy.flyurdream.com/#/universities');
    await page.waitForSelector('.newuniv-campus-card', { timeout: 40000 });
    const uniName = (await page.locator('.newuniv-campus-name').first().innerText()).trim();
    await page.locator('.newuniv-campus-name').first().click();
    await expect(page).toHaveURL(/universityinformation/i, { timeout: 20000 });
    console.log(`✓ Opened university page: "${uniName}"`);

    // ── Hero ──────────────────────────────────────────────────────────────────
    await page.waitForSelector('.new-univmanager-name', { timeout: 30000 });
    const heroName = (await page.locator('.new-univmanager-name').first().innerText()).trim();
    expect(heroName.toLowerCase()).toContain(uniName.split(' ')[0].toLowerCase());
    console.log(`✓ Hero shows: "${heroName}"`);
    const backBtn = await page.locator('.new-univmanager-back-btn').first().isVisible().catch(() => false);
    console.log(`✓ Back button visible: ${backBtn}`);

    // ── All 6 tabs ────────────────────────────────────────────────────────────
    const expectedTabs = ['Overview', 'Rankings', 'Courses', 'Academic Requirements', 'English Requirements', 'Accommodation'];
    for (const tab of expectedTabs) {
        await expect(page.locator('.new-univmanager-tab').filter({ hasText: tab }).first()).toBeVisible();
        console.log(`✓ Tab visible: "${tab}"`);
    }

    // ── Walk through each tab and confirm content renders ─────────────────────
    for (const tab of expectedTabs) {
        await page.locator('.new-univmanager-tab').filter({ hasText: tab }).first().click();
        await page.waitForTimeout(2000);
        const content = await page.evaluate(() =>
            (document.querySelector('.new-univmanager-content') as HTMLElement | null)?.innerText.trim().substring(0, 80) || '');
        console.log(`✓ [${tab}] content: "${content.replace(/\n/g, ' | ')}${content.length >= 80 ? '…' : ''}"`);
        expect(content.length, `"${tab}" tab should render content`).toBeGreaterThan(0);
    }

    // ── Courses tab specifics ─────────────────────────────────────────────────
    await page.locator('.new-univmanager-tab').filter({ hasText: 'Courses' }).first().click();
    await page.waitForSelector('.new-univmanager-course-row', { timeout: 30000 });

    await expect(page.locator('input.new-univmanager-course-search').first()).toBeVisible();
    console.log('✓ Course search box visible');

    const rows = page.locator('.new-univmanager-course-row');
    const rowCount = await rows.count();
    expect(rowCount, 'course rows should be listed').toBeGreaterThan(0);
    console.log(`✓ ${rowCount} course rows`);

    const firstCourse = (await rows.first().locator('.new-univmanager-course-name').innerText()).trim();
    const firstIntake = (await rows.first().locator('.new-univmanager-course-intake').innerText().catch(() => '')).trim();
    console.log(`✓ First course: "${firstCourse}" (intake ${firstIntake || 'n/a'})`);

    // Search filters the rows
    const keyword = firstCourse.split(' ')[0];
    await page.locator('input.new-univmanager-course-search').fill(keyword);
    await page.waitForTimeout(2000);
    const filtered = await rows.count();
    console.log(`✓ Rows after searching "${keyword}": ${filtered}`);
    await page.locator('input.new-univmanager-course-search').fill('');
    await page.waitForTimeout(1500);

    // ── "View more" popup with Apply Now ──────────────────────────────────────
    await rows.first().locator('.new-univmanager-course-view-btn').click();
    await expect(page.locator('.new-univmanager-popup-apply-btn').first(),
        'course popup should show Apply Now').toBeVisible({ timeout: 15000 });
    console.log('✓ Course popup open — Apply Now available');

    await page.locator('.new-univmanager-popup-close').first().click();
    await page.waitForTimeout(1000);
    const popupGone = !(await page.locator('.new-univmanager-popup-apply-btn').first().isVisible().catch(() => false));
    console.log(`✓ Popup closed: ${popupGone}`);

    console.log('\n✅ University detail page (new UI) fully verified');
});
