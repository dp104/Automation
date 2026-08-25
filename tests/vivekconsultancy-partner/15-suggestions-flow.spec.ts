import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { partnerConfig } from '../../utils/partnerConfig';
import { gotoPartnerRoute, PARTNER_ROUTES } from '../../utils/partnerNav';
import { completeWizardSubmission, describeOutcome, fillVisibleReactSelects, clickModalPrimary } from '../../utils/applyFlow';

// Partner Portal — Suggestions Flow (#/Get-Applications).
// Get-Applications page → expand the student row → "Suggestions" button →
// review the suggested courses; if suggestions carry an Apply action, use it.
// 05-view-applications.spec.ts already confirmed LIVE that "Suggestions"
// (button.gad-btn-suggestions) appears in the partner's expanded row too —
// same shared component the student portal uses on its own row. Mechanically
// nothing differs here: the only difference is WHO the suggestion/application
// gets created for — the partner, acting on behalf of whichever student row
// is in context, rather than the logged-in student acting for themselves.

test('Partner Portal — Suggestions Flow', async ({ page }) => {
    test.setTimeout(480000);

    const result = await login(page, partnerConfig.portalUrl, partnerConfig.email, partnerConfig.password);
    expect(result ?? 'ok', `login should not be rejected (got: ${result})`).not.toMatch(/error/i);
    await page.waitForTimeout(2000);
    await page.waitForSelector('.nsm-sidebar', { timeout: 20000 });

    // ── Open View Applications and expand the student row ─────────────────────
    await gotoPartnerRoute(page, partnerConfig.portalUrl, PARTNER_ROUTES.viewApplications);
    await page.waitForFunction(
        () => /\d+\s+applications?/i.test(document.body.innerText),
        undefined,
        { timeout: 40000 }
    );
    await page.waitForTimeout(3000);

    await page.locator('.gad-expander-icon').first().click();
    await page.waitForTimeout(3000);
    console.log('✓ Student row expanded');

    const suggBtn = page.locator('button.gad-btn-suggestions').first();
    await expect(suggBtn, '"Suggestions" button should appear in the expanded row').toBeVisible({ timeout: 15000 });

    // ── Open Suggestions ──────────────────────────────────────────────────────
    await suggBtn.click();
    console.log('✓ Clicked "Suggestions"');

    let outcome = await describeOutcome(page);
    console.log('  URL:', outcome.url);
    if (outcome.modalText) console.log('  Panel:', outcome.modalText.substring(0, 600).replace(/\n/g, ' | '));
    if (outcome.toast) console.log('  Toast:', outcome.toast);

    // Give suggestion content time to load, then inspect it
    await page.waitForTimeout(4000);
    const suggestions = await page.evaluate(() => {
        const containers = Array.from(document.querySelectorAll('[class*="modal"], [role="dialog"], [class*="popup"], [class*="suggest"], [class*="drawer"], [class*="panel"]'))
            .filter(m => (m as HTMLElement).offsetParent !== null && ((m as HTMLElement).innerText || '').length > 30);
        const scope = containers.length ? containers[containers.length - 1] as HTMLElement : null;
        if (!scope) return { text: '', applyButtons: 0, items: 0 };
        const applyButtons = Array.from(scope.querySelectorAll('button, a'))
            .filter(b => (b as HTMLElement).offsetParent !== null && /apply/i.test(b.textContent || '')).length;
        const items = scope.querySelectorAll('[class*="card"], [class*="item"], [class*="tile"], [class*="row"]').length;
        return { text: scope.innerText.substring(0, 800).replace(/\n/g, ' | '), applyButtons, items };
    });
    console.log(`  Suggestions panel: ${suggestions.items} items, ${suggestions.applyButtons} apply buttons`);
    if (suggestions.text) console.log('  Content:', suggestions.text.substring(0, 400));

    // ── Apply from a suggestion when available ────────────────────────────────
    if (suggestions.applyButtons > 0) {
        // Application ids visible before applying (the expanded row lists them) —
        // used afterwards to detect the newly created one.
        const idsBefore: string[] = await page.evaluate(() =>
            [...new Set(document.body.innerText.match(/GUIDA\d+/g) || [])]
        );

        // Try each suggestion's "Apply Now" IN ORDER. When one reports
        // "duplicate application" (already applied earlier), dismiss the
        // warning and move to the NEXT Apply Now button, until a new
        // application is created or every suggestion is exhausted.
        let verdict = '';
        let duplicates = 0;

        for (let btnIndex = 0; btnIndex < suggestions.applyButtons; btnIndex++) {
            const applied = await page.evaluate((idx: number) => {
                const containers = Array.from(document.querySelectorAll('[class*="modal"], [role="dialog"], [class*="popup"], [class*="suggest"], [class*="drawer"], [class*="panel"]'))
                    .filter(m => (m as HTMLElement).offsetParent !== null);
                const scope = containers.length ? containers[containers.length - 1] : document;
                const btns = Array.from(scope.querySelectorAll('button, a'))
                    .filter(b => (b as HTMLElement).offsetParent !== null && /apply/i.test(b.textContent || ''));
                const btn = btns[idx] as HTMLElement | undefined;
                if (btn) {
                    btn.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
                    btn.click();
                    return btn.textContent?.trim() || '';
                }
                return '';
            }, btnIndex);
            if (!applied) {
                console.log(`  (apply button ${btnIndex + 1} no longer present — stopping)`);
                break;
            }
            console.log(`✓ Clicked suggestion apply ${btnIndex + 1}/${suggestions.applyButtons}: "${applied}"`);
            await page.waitForTimeout(5000);

            // Route A: redirected to the application wizard — complete the submission there
            if (/add-student/i.test(page.url())) {
                console.log('✓ Suggestion apply opened the Student Profile Journey wizard');
                const submission = await completeWizardSubmission(page);
                expect(submission.submitted, 'application should be submitted from the Create Application tab').toBe(true);
                if (submission.newIds.length) console.log(`\n🎯 CREATED APP ID: ${submission.newIds.join(', ')}`);
                console.log('\n✅ Suggestions flow complete — application submitted');
                return;
            }

            // Route B: a dialog/popup opened — fill it if needed and confirm
            const selects = await fillVisibleReactSelects(page, 10);
            if (selects.length) console.log(`✓ Filled ${selects.length} dropdowns in apply dialog`);

            const primary = await clickModalPrimary(page);
            if (primary) console.log(`✓ Clicked dialog action: "${primary}"`);

            // The server takes time to create the application after the confirm —
            // wait for a success signal (success toast / duplicate warning / new
            // GUIDA id) instead of moving on immediately. Race-guarded: this app
            // can freeze the page after a submit.
            console.log('  Waiting for the application to be created...');
            verdict = await Promise.race([
                page.waitForFunction(
                    (pre: string[]) => {
                        const toast = document.querySelector('.Toastify__toast-body')?.textContent || '';
                        if (/success|created|submitted|applied/i.test(toast)) return 'toast';
                        if (/(duplicate application|application already exists)/i.test(document.body.innerText)) return 'duplicate';
                        const ids = [...new Set(document.body.innerText.match(/GUIDA\d+/g) || [])];
                        if (ids.some(id => !pre.includes(id))) return 'new-id';
                        return false;
                    },
                    idsBefore,
                    { timeout: 90000 }
                ).then(h => h.jsonValue() as Promise<string>).catch(() => ''),
                new Promise<string>(resolve => setTimeout(() => resolve('frozen'), 100000)),
            ]);
            console.log(`  creation signal: ${verdict || '(none within 90s)'}`);
            await page.waitForTimeout(5000);

            if (verdict !== 'duplicate') break;   // created (or needs the fallback check below)

            // Duplicate — dismiss the warning/dialog and move to the NEXT suggestion
            duplicates++;
            console.log(`  ⚠ Suggestion ${btnIndex + 1} already has an application — trying the next Apply Now`);
            await page.evaluate(() => {
                const dialogs = Array.from(document.querySelectorAll('[class*="modal"], [role="dialog"], [class*="popup"]'))
                    .filter(d => (d as HTMLElement).offsetParent !== null);
                const top = dialogs[dialogs.length - 1];
                const btn = Array.from(top?.querySelectorAll('button') || [])
                    .find(b => /ok|okay|close|cancel|got it/i.test(b.textContent || ''));
                (btn as HTMLElement | undefined)?.click();
            });
            await page.keyboard.press('Escape').catch(() => {});
            await page.waitForTimeout(2500);
        }

        if (verdict === 'duplicate') {
            console.log(`  ⚠ All ${duplicates} attempted suggestions already have applications — apply verified against the server each time`);
            console.log('\n✅ Suggestions flow complete — every suggested course is already applied');
            return;
        }

        // The 'new-id' signal already proves the application was created —
        // capture it from the current page before any navigation.
        let newIds: string[] = await page.evaluate((pre: string[]) => {
            const ids = [...new Set(document.body.innerText.match(/GUIDA\d+/g) || [])];
            return ids.filter(id => !pre.includes(id));
        }, idsBefore).catch(() => [] as string[]);

        if (!newIds.length && verdict !== 'toast') {
            // No direct signal — double-check on a fresh View Applications load
            await gotoPartnerRoute(page, partnerConfig.portalUrl, PARTNER_ROUTES.viewApplications);
            await page.waitForFunction(
                () => /\d+\s+applications?/i.test(document.body.innerText),
                undefined,
                { timeout: 30000 }
            ).catch(() => {});
            await page.waitForTimeout(3000);
            await page.locator('.gad-expander-icon').first().click().catch(() => {});
            await page.waitForTimeout(3500);
            newIds = await page.evaluate((pre: string[]) => {
                const ids = [...new Set(document.body.innerText.match(/GUIDA\d+/g) || [])];
                return ids.filter(id => !pre.includes(id));
            }, idsBefore);
        }

        expect(newIds.length > 0 || verdict === 'toast' || verdict === 'new-id',
            'a new application should exist after applying from a suggestion').toBe(true);
        if (newIds.length) console.log(`\n🎯 CREATED APP ID: ${newIds.join(', ')}`);
        console.log('\n✅ Suggestions flow complete — application created from suggestion');
        return;
    }

    console.log('  (no apply action inside suggestions — review-only panel)');

    const navigated = !/Get-Applications/i.test(page.url());
    const responded = outcome.responded || navigated || suggestions.text.length > 0;
    expect(responded, 'Suggestions should open a panel or navigate').toBe(true);

    const errorToast = /error|fail/i.test(outcome.toast) && !outcome.duplicate;
    expect(errorToast, `suggestions flow should not error (toast: "${outcome.toast}")`).toBe(false);

    console.log('\n✅ Suggestions flow complete');
});
