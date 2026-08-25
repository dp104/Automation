import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';
import { uploadAllRequiredDocuments } from '../../utils/applyFlow';

// Create Application + Upload Documents
// Same flow as 29-create-application, then continues to the wizard "Documents" tab
// and uploads all required documents. The Documents tab uses "smart upload" —
// each document is attached to every selected application that is missing it,
// which includes the newly created application.

const DUMMY_PDF = '/Users/flyurdream/Automation Testing/First/files/Dummy_Pdf.pdf';

test('Vivek Consultancy — Create Application + Upload Documents', async ({ page }) => {
    test.setTimeout(540000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') { console.log('Login failed:', result); return; }
    console.log('✓ Login');
    await page.waitForSelector('.nsm-sidebar', { timeout: 20000 });

    // Baseline application count from View Applications
    await page.goto('https://vivekconsultancy.flyurdream.com/#/Get-Applications');
    await page.waitForFunction(
        () => /\d+\s+applications?/i.test(document.body.innerText),
        undefined,
        { timeout: 20000 }
    ).catch(() => {});
    await page.waitForTimeout(2000);
    const readAppsPage = () => page.evaluate(() => {
        const m = document.body.innerText.match(/(\d+)\s+applications?/i);
        return { count: m ? parseInt(m[1], 10) : -1 };
    });
    const baseline = await readAppsPage();
    console.log(`  Baseline: ${baseline.count} applications`);

    // ── Open Student Profile Journey and load GUIDS7 ──────────────────────────
    const loadStudent = async () => {
        await page.goto('https://vivekconsultancy.flyurdream.com/#/add-student');
        await page.waitForTimeout(3000);
        await expect(page.locator('.sp-header-title')).toContainText('Student Profile Journey', { timeout: 8000 });

        // New wizard auto-loads the logged-in student's own profile directly —
        // the fetch-by-ID box only appears on the partner-side add-student
        // flow now, not the student's own self-service one.
        const studentInput = page.locator('input.sp-student-input');
        if (await studentInput.isVisible({ timeout: 5000 }).catch(() => false)) {
            await studentInput.fill('GUIDS7');
            await page.locator('.sp-fetch-btn').click();
        }
        await page.waitForFunction(
            () => Array.from(document.querySelectorAll('input'))
                .some(el => el.placeholder?.toLowerCase().includes('first') && el.value.trim().length > 0),
            undefined,
            { timeout: 30000 }
        ).catch(() => page.waitForTimeout(8000));
        await page.waitForTimeout(1500);
        console.log('✓ GUIDS7 loaded');
    };
    await loadStudent();

    // ── ensureTab ─────────────────────────────────────────────────────────────
    // The wizard sometimes jumps back to "Personal Details" on its own —
    // aria-selected is the reliable signal for the currently displayed tab.
    const ensureTab = async (name: string) => {
        const onTab = await page.evaluate((tabName: string) => {
            const tabs = Array.from(document.querySelectorAll('.sp-tab'));
            const selected = tabs.find(t => t.getAttribute('aria-selected') === 'true')
                          || tabs.find(t => t.className.includes('active'));
            return selected?.textContent?.includes(tabName) || false;
        }, name);
        if (!onTab) {
            await page.locator('.sp-tab').filter({ hasText: name }).first().click().catch(() => {});
            await page.waitForTimeout(2000);
        }
    };

    // ── Capture GUIDA ids visible on the Documents tab (before creation) ──────
    // The Documents tab lists app ids in its "Will be uploaded to" chips —
    // the diff after creation identifies the new application's id.
    const readDocTabIds = async (): Promise<string[]> => {
        for (let i = 0; i < 5; i++) {
            await ensureTab('Documents');
            const loaded = await page.evaluate(() =>
                /required documents/i.test(document.body.innerText));
            if (loaded) break;
            await page.waitForTimeout(3000);
        }
        return await page.evaluate(() =>
            [...new Set(document.documentElement.innerHTML.match(/GUIDA\d+/g) || [])]
        );
    };
    const preDocIds = await readDocTabIds();
    console.log(`  App ids on Documents tab before creation (${preDocIds.length}):`, preDocIds.join(', ') || '(none)');

    await ensureTab('Create Application');

    // ════════════════════════════════════════════════════════════════════════
    // PHASE 1 — CREATE APPLICATION (same approach as 29-create-application)
    // ════════════════════════════════════════════════════════════════════════

    const ensureFormOpen = async (): Promise<boolean> => {
        const hasControls = () => page.evaluate(() =>
            Array.from(document.querySelectorAll('[class*="-control"]'))
                .some(el => (el as HTMLElement).offsetParent !== null)
        );
        if (await hasControls()) return true;

        const clicked = await page.evaluate(() => {
            const edu = document.querySelector('[class*="edu-add-btn"]') as HTMLElement | null;
            if (edu) { edu.click(); return 'Add Another Application (edu-add-btn)'; }
            const btn = Array.from(document.querySelectorAll('button')).find(b =>
                (b as HTMLElement).offsetParent !== null
                && b.className.includes('sp-btn')
                && !b.className.includes('sp-tab')
                && b.textContent?.trim() === 'Create Application') as HTMLElement | undefined;
            if (btn) { btn.click(); return 'Create Application (sp-btn)'; }
            return '';
        });
        if (clicked) console.log(`  form opener clicked: ${clicked}`);
        await page.waitForTimeout(2500);
        return await hasControls();
    };

    const formStats = () => page.evaluate(() => {
        const ctrls = Array.from(document.querySelectorAll('[class*="-control"]'))
            .filter(el => (el as HTMLElement).offsetParent !== null);
        const filled = ctrls.filter(c => c.querySelector('[class*="-singleValue"], [class*="-multiValue"]')).length;
        const emptyEnabled = ctrls.filter(c => {
            if (c.querySelector('[class*="-singleValue"], [class*="-multiValue"]')) return false;
            const ph = c.querySelector('[class*="-placeholder"]')?.textContent?.trim() || '';
            return ph.length > 0 && !ph.toLowerCase().includes(' first') && !/^loading/i.test(ph);
        }).length;
        return { total: ctrls.length, filled, emptyEnabled };
    });

    const openAndSelect = async (label: string, optTimeout = 20000, pickRandom = false): Promise<string> => {
        const ctrlHandle = await page.evaluateHandle(() => {
            return Array.from(document.querySelectorAll('[class*="-control"]')).find(el => {
                if (!(el as HTMLElement).offsetParent) return false;
                if (el.querySelector('[class*="-singleValue"], [class*="-multiValue"]')) return false;
                const ph = el.querySelector('[class*="-placeholder"]')?.textContent?.trim() || '';
                return ph.length > 0 && !ph.toLowerCase().includes(' first') && !/^loading/i.test(ph);
            }) as HTMLElement | undefined;
        });

        const ctrl = ctrlHandle.asElement();
        if (!ctrl) {
            console.log(`  [${label}] no ready control`);
            await ctrlHandle.dispose();
            return '';
        }

        const ph = await ctrl.evaluate(el =>
            el.querySelector('[class*="-placeholder"]')?.textContent?.trim() || '(no ph)'
        );
        console.log(`  [${label}] opening "${ph}"`);

        await ctrl.evaluate(el => (el as HTMLElement).scrollIntoView({ block: 'center', behavior: 'instant' }));
        await page.waitForTimeout(300);
        await ctrl.evaluate(el => {
            const inp = el.querySelector('input') as HTMLInputElement | null;
            if (inp) inp.focus();
            el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
        });
        await ctrlHandle.dispose();
        await page.waitForTimeout(800);

        await page.waitForFunction(
            () => Array.from(document.querySelectorAll('[role="option"]')).some(o => {
                const t = (o as HTMLElement).textContent?.trim() || '';
                return t.length > 0 && t !== 'Loading…' && t !== 'Loading...';
            }),
            undefined,
            { timeout: optTimeout }
        ).catch(() => {});

        const optText = await page.evaluate((random: boolean) => {
            const opts = Array.from(document.querySelectorAll('[role="option"]')).filter(o => {
                const t = (o as HTMLElement).textContent?.trim() || '';
                return t.length > 0 && t !== 'Loading…' && t !== 'Loading...';
            });
            const idx = random ? Math.floor(Math.random() * opts.length) : 0;
            return (opts[idx] as HTMLElement | undefined)?.textContent?.trim() || '';
        }, pickRandom);

        if (!optText) {
            console.log(`  [${label}] no options appeared for "${ph}"`);
            await page.keyboard.press('Escape').catch(() => {});
            return '';
        }

        await page.evaluate((text: string) => {
            (Array.from(document.querySelectorAll('[role="option"]'))
                .find(o => (o as HTMLElement).textContent?.trim() === text) as HTMLElement | undefined)?.click();
        }, optText);

        await page.waitForTimeout(2500);
        console.log(`✓ [${label}] "${ph}" = "${optText}"`);
        return optText;
    };

    const picked: string[] = [];
    let stall = 0;

    for (let iter = 0; iter < 30 && stall < 8; iter++) {
        await ensureTab('Create Application');
        if (!(await ensureFormOpen())) {
            console.log('  form not open yet — retrying');
            stall++;
            continue;
        }

        const st = await formStats();
        console.log(`  form: total=${st.total} filled=${st.filled} emptyEnabled=${st.emptyEnabled}`);

        if (st.total > 0 && st.filled >= st.total) {
            console.log(`✓ All ${st.total} dropdowns filled`);
            break;
        }
        if (st.emptyEnabled === 0) {
            stall++;
            await page.waitForTimeout(4000);
            continue;
        }

        // Field order: country, state, city, level, month, year, university, course.
        // The course (8th) is randomized so every run creates a unique application.
        // 8s option wait: the first open attempt of each field consistently fails
        // (recovered by the tab re-click below) — a short wait keeps the loop fast.
        const val = await openAndSelect(`#${st.filled + 1}`, 8000, st.filled === 7);
        if (val) {
            picked.push(val);
            stall = 0;
        } else {
            stall++;
            console.log(`  retry ${stall} — re-clicking Create Application tab to recover`);
            await page.keyboard.press('Escape').catch(() => {});
            await page.locator('.sp-tab').filter({ hasText: 'Create Application' }).first().click().catch(() => {});
            await page.waitForTimeout(2500);
        }
    }

    const finalSt = await formStats();
    console.log(`\n✓ Selections: ${picked.join(' | ')}`);
    expect(finalSt.total, 'react-select controls should be present in the form').toBeGreaterThan(0);
    expect(finalSt.filled, `all ${finalSt.total} dropdowns should be filled`).toBe(finalSt.total);

    // ── Save (with duplicate retry) then final Submit ─────────────────────────
    const changeCourse = async (): Promise<string> => {
        const opened = await page.evaluate(() => {
            const ctrls = Array.from(document.querySelectorAll('[class*="-control"]'))
                .filter(el => (el as HTMLElement).offsetParent !== null);
            const ctrl = ctrls[ctrls.length - 1] as HTMLElement | undefined;
            if (!ctrl) return '';
            const inp = ctrl.querySelector('input') as HTMLInputElement | null;
            if (inp) inp.focus();
            ctrl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
            return 'opened';
        });
        if (!opened) return '';
        await page.waitForFunction(
            () => document.querySelectorAll('[role="option"]').length > 1,
            undefined,
            { timeout: 20000 }
        ).catch(() => {});
        return await page.evaluate(() => {
            const opts = Array.from(document.querySelectorAll('[role="option"]')).filter(o => {
                const t = (o as HTMLElement).textContent?.trim() || '';
                return t.length > 0 && t !== 'Loading…' && t !== 'Loading...'
                    && o.getAttribute('aria-selected') !== 'true';
            });
            const pick = opts[Math.floor(Math.random() * opts.length)] as HTMLElement | undefined;
            const text = pick?.textContent?.trim() || '';
            pick?.click();
            return text;
        });
    };

    const submitBtn = page.locator('button').filter({ hasText: /Submit \d+ Application/ }).first();
    let queued = false;

    for (let attempt = 1; attempt <= 4 && !queued; attempt++) {
        await ensureTab('Create Application');
        const saveBtn = page.locator('button').filter({ hasText: /save application/i }).first();
        await saveBtn.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
        await saveBtn.click().catch(() => {});
        console.log(`✓ Clicked "Save Application" (attempt ${attempt})`);
        await page.waitForTimeout(3000);

        const duplicate = await page.evaluate(() =>
            document.body.innerText.includes('Duplicate application already submitted'));
        if (duplicate) {
            console.log('  ⚠ Duplicate application detected — picking a different course');
            const c = await changeCourse();
            expect(c, 'an alternative course should be selectable').not.toBe('');
            console.log(`  ↻ Course changed to "${c}"`);
            await page.waitForTimeout(2000);
            continue;
        }

        queued = await submitBtn.waitFor({ state: 'visible', timeout: 20000 }).then(() => true).catch(() => false);
        if (!queued) {
            await ensureTab('Create Application');
            queued = await submitBtn.waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);
        }
    }
    expect(queued, '"Submit N Application" button should appear after saving').toBe(true);

    const submitLabel = (await submitBtn.textContent().catch(() => '') || '').trim();
    await submitBtn.click();
    console.log(`✓ Clicked "${submitLabel}"`);
    await page.waitForTimeout(1500);

    await page.evaluate(() => {
        const dlg = document.querySelector('[class*="modal"], [role="dialog"], [class*="overlay"]');
        if (dlg && (dlg as HTMLElement).offsetParent !== null) {
            const btn = Array.from(dlg.querySelectorAll('button'))
                .find(b => /confirm|yes|submit|ok|proceed/i.test(b.textContent || '') && !/cancel|no/i.test(b.textContent || ''));
            (btn as HTMLElement | undefined)?.click();
        }
    });

    await page.waitForFunction(
        () => {
            const toast = document.querySelector('.Toastify__toast-body')?.textContent?.trim() || '';
            if (/success|submitted|created/i.test(toast)) return true;
            return !Array.from(document.querySelectorAll('button'))
                .some(b => (b as HTMLElement).offsetParent !== null && /Submit \d+ Application/.test(b.textContent || ''));
        },
        undefined,
        { timeout: 30000 }
    ).catch(() => {});
    console.log('✓ Application submitted');

    // ════════════════════════════════════════════════════════════════════════
    // PHASE 2 — IDENTIFY NEW APP ID AND UPLOAD DOCUMENTS
    // ════════════════════════════════════════════════════════════════════════
    await page.waitForTimeout(3000);

    const postDocIds = await readDocTabIds();
    const newAppIds = postDocIds.filter(id => !preDocIds.includes(id));
    console.log(`\n  App ids on Documents tab after creation (${postDocIds.length})`);
    if (newAppIds.length) console.log(`🎯 NEW APP ID: ${newAppIds.join(', ')}`);
    else console.log('  (new app id not distinguishable — documents still upload to it via smart upload)');

    // Documents progress counter, e.g. "0 of 4 required documents done".
    // "Smart upload" attaches each file to every selected application missing
    // that document — including the newly created one.
    const readDocProgress = () => page.evaluate(() => {
        const m = document.body.innerText.match(/(\d+)\s+of\s+(\d+)\s+required documents done/i);
        return m ? { done: parseInt(m[1], 10), total: parseInt(m[2], 10) } : { done: -1, total: -1 };
    });
    const initialProgress = await readDocProgress();
    console.log(`  Documents progress before upload: ${initialProgress.done} of ${initialProgress.total}`);
    expect(initialProgress.total, 'required documents list should be present').toBeGreaterThan(0);

    const uploadResult = await uploadAllRequiredDocuments(page, DUMMY_PDF);
    console.log(`\n  Documents progress after upload: ${uploadResult.done} of ${uploadResult.total} (uploads performed: ${uploadResult.uploads})`);

    expect(uploadResult.complete, `all ${initialProgress.total} required documents should be uploaded (uploads performed: ${uploadResult.uploads})`)
        .toBe(true);

    // ── Verify application count increased ────────────────────────────────────
    await page.goto('https://vivekconsultancy.flyurdream.com/#/Get-Applications');
    await page.waitForFunction(
        () => /\d+\s+applications?/i.test(document.body.innerText),
        undefined,
        { timeout: 20000 }
    ).catch(() => {});
    await page.waitForTimeout(3000);
    const after = await readAppsPage();
    expect(after.count, `application count should increase from ${baseline.count}`).toBeGreaterThan(baseline.count);

    console.log(`\n✅ Application created (${baseline.count} → ${after.count})${newAppIds.length ? ` — ${newAppIds.join(', ')}` : ''} and all ${initialProgress.total} required documents uploaded`);
});
