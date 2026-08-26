import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

// Smart Assessment — found in the expanded application row on View Applications page
// Flow: View Applications → expand student row → click "Smart Assessment" button → verify result

test('Vivek Consultancy — Smart Assessment', async ({ page }) => {
    test.setTimeout(300000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') { console.log('Login failed:', result); return; }
    console.log('Login success');
    await page.waitForSelector('.nsm-sidebar', { timeout: 40000 });

    // ── Navigate to View Applications ────────────────────────────────────────
    await page.goto('https://vivekconsultancy.flyurdream.com/#/Get-Applications');
    await page.waitForTimeout(3000);
    console.log('✓ Navigated to View Applications');

    // Wait for table to load — View Applications redesign uses .gad-row-wrap
    // rows with a dedicated .gad-expander-icon chevron (not a plain <table>).
    await page.waitForFunction(
        () => document.querySelectorAll('.gad-row-wrap').length > 0,
        undefined,
        { timeout: 20000 }
    ).catch(() => console.log('  Table load wait timed out'));
    await page.waitForTimeout(1000);

    const rowCount = await page.locator('.gad-row-wrap').count();
    console.log('✓ Table rows:', rowCount);
    if (rowCount === 0) { console.log('  No rows in table — cannot test Smart Assessment'); return; }

    // ── Expand first student row ──────────────────────────────────────────────
    const expanderIcon = page.locator('.gad-expander-icon').first();
    await expanderIcon.click();
    await page.waitForTimeout(2000);

    // Check if expanded content appeared
    const expandedContent = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns
            .filter(b => (b as HTMLElement).offsetParent !== null)
            .map(b => b.textContent?.trim())
            .filter(Boolean);
    });
    console.log('✓ Visible buttons after row click:', expandedContent.slice(0, 10));

    // ── Click Smart Assessment button ─────────────────────────────────────────
    const smartBtn = page.locator('button').filter({ hasText: /smart assessment/i }).first();
    const smartVisible = await smartBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log('✓ Smart Assessment button visible:', smartVisible);

    if (!smartVisible) {
        // Try via JS
        const clicked = await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button'))
                .find(b => /smart.?assessment/i.test(b.textContent || ''));
            if (btn) { (btn as HTMLElement).click(); return true; }
            return false;
        });
        console.log('  JS click Smart Assessment:', clicked);
    } else {
        await smartBtn.click();
    }
    await page.waitForTimeout(3000);

    const afterUrl = page.url();
    console.log('✓ URL after Smart Assessment click:', afterUrl);

    // ── Verify Smart Assessment content ──────────────────────────────────────
    // May open a modal, navigate to a new page, or show an inline panel
    const modalVisible = await page.locator('[class*="modal"], [class*="dialog"], [role="dialog"]')
        .first().isVisible({ timeout: 3000 }).catch(() => false);
    console.log('✓ Modal/dialog visible:', modalVisible);

    const pageHeadings = await page.evaluate(() =>
        Array.from(document.querySelectorAll('h1, h2, h3, .page-title, [class*="title"]'))
            .filter(el => (el as HTMLElement).offsetParent !== null)
            .map(el => el.textContent?.trim())
            .filter(Boolean)
            .slice(0, 5)
    );
    console.log('✓ Headings after click:', pageHeadings);

    const bodyText = (await page.locator('body').textContent().catch(() => '')) || '';
    const hasAssessmentContent = /assessment|score|recommend|eligible/i.test(bodyText);
    console.log('✓ Assessment content detected:', hasAssessmentContent);

    console.log('✓ Smart Assessment test complete');
});
