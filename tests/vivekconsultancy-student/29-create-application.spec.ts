import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

test('Vivek Consultancy — Create Application via Add Student (Old)', async ({ page }) => {
    test.setTimeout(420000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') { console.log('Login failed:', result); return; }
    console.log('✓ Login');
    await page.waitForSelector('.menu-toggle-icon', { timeout: 20000 });

    // Baseline from the View Applications page BEFORE creating:
    // total application count ("N applications") and any GUIDA ids in the HTML.
    // The new application is detected as the diff after submission.
    await page.goto('https://vivekconsultancy.flyurdream.com/#/Get-Applications');
    await page.waitForFunction(
        () => /\d+\s+applications?/i.test(document.body.innerText),
        undefined,
        { timeout: 20000 }
    ).catch(() => {});
    await page.waitForTimeout(2000);
    const readAppsPage = () => page.evaluate(() => {
        const m = document.body.innerText.match(/(\d+)\s+applications?/i);
        return {
            count: m ? parseInt(m[1], 10) : -1,
            ids: [...new Set(document.documentElement.innerHTML.match(/GUIDA\d+/g) || [])],
        };
    });
    const baseline = await readAppsPage();
    console.log(`  Baseline: ${baseline.count} applications | ids: ${baseline.ids.join(', ') || '(none)'}`);

    await page.goto('https://vivekconsultancy.flyurdream.com/#/add-application');
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/#\/add-application/, { timeout: 10000 });
    await expect(page.locator('.sp-header-title')).toContainText('Student Profile Journey', { timeout: 8000 });

    await page.locator('input.sp-student-input').fill('GUIDS7');
    await page.locator('.sp-fetch-btn').click();
    await page.waitForFunction(
        () => Array.from(document.querySelectorAll('input'))
            .some(el => el.placeholder?.toLowerCase().includes('first') && el.value.trim().length > 0),
        undefined,
        { timeout: 30000 }
    ).catch(() => page.waitForTimeout(8000));
    await page.waitForTimeout(1500);
    console.log('✓ GUIDS7 loaded');

    await page.locator('.sp-tab').filter({ hasText: 'Create Application' }).first().click();
    await page.waitForTimeout(2500);

    // Existing application IDs on the page BEFORE creating a new one —
    // used later to detect the newly created ID.
    const preIds: string[] = await page.evaluate(() =>
        [...new Set(document.body.innerText.match(/GUIDA\d+/g) || [])]
    );
    console.log('  Existing app IDs on page:', preIds.join(', ') || '(none)');

    // ── ensureCreateTab ───────────────────────────────────────────────────────
    // The wizard sometimes jumps back to "Personal Details" on its own after the
    // application form opens (aria-selected moves to tab 1 while tab 4 keeps a
    // stale "active" class). aria-selected is the reliable signal — re-click the
    // Create Application tab whenever it is not the selected one.
    const ensureCreateTab = async () => {
        const onCreateTab = await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('.sp-tab'));
            const selected = tabs.find(t => t.getAttribute('aria-selected') === 'true')
                          || tabs.find(t => t.className.includes('active'));
            return selected?.textContent?.includes('Create Application') || false;
        });
        if (!onCreateTab) {
            console.log('  → wizard left Create Application tab, re-clicking');
            await page.locator('.sp-tab').filter({ hasText: 'Create Application' }).first().click().catch(() => {});
            await page.waitForTimeout(2000);
        }
    };

    // ── ensureFormOpen ────────────────────────────────────────────────────────
    // The Create Application tab shows one of two openers depending on state:
    //   - "Add Another Application" button (class edu-add-btn) when apps exist
    //   - "Create Application" button (class sp-btn, NOT sp-tab) otherwise
    // The react-select form only exists after clicking it. Returns true when
    // at least one visible react-select control is present.
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

    // ── formStats ─────────────────────────────────────────────────────────────
    // Progress is derived from the DOM, not a fixed field order:
    //   filled       = controls showing a selected value
    //   emptyEnabled = empty controls whose placeholder has no " first" (cascade dependency met)
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

    // ── openAndSelect ─────────────────────────────────────────────────────────
    // Opens the first empty enabled react-select and picks an option.
    // Options are identified by role="option" (standard react-select ARIA).
    // pickRandom selects a random option instead of the first — used for the course
    // so each run creates a unique application (GuideUni rejects exact duplicates).
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

        // Focus the internal input (keeps the menu open) and dispatch mousedown to open it
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

    // ════════════════════════════════════════════════════════════════════════
    // FILL CASCADE — self-correcting loop.
    // Each iteration re-checks the DOM: reopens the form if it closed, waits when
    // the cascade is loading, retries a wedged dropdown by re-clicking the tab.
    // Runs until every visible react-select shows a value.
    // ════════════════════════════════════════════════════════════════════════
    const picked: string[] = [];
    let stall = 0;

    for (let iter = 0; iter < 30 && stall < 8; iter++) {
        await ensureCreateTab();
        if (!(await ensureFormOpen())) {
            console.log('  form not open yet — retrying');
            stall++;
            await page.locator('.sp-tab').filter({ hasText: 'Create Application' }).first().click().catch(() => {});
            await page.waitForTimeout(2000);
            continue;
        }

        const st = await formStats();
        console.log(`  form: total=${st.total} filled=${st.filled} emptyEnabled=${st.emptyEnabled}`);

        if (st.total > 0 && st.filled >= st.total) {
            console.log(`✓ All ${st.total} dropdowns filled`);
            break;
        }

        if (st.emptyEnabled === 0) {
            // Next field's options/enable state still loading from API
            stall++;
            await page.waitForTimeout(4000);
            continue;
        }

        // Field order: country, state, city, level, month, year, university, course.
        // The 8th field (course) is randomized so every run creates a unique application.
        const val = await openAndSelect(`#${st.filled + 1}`, 20000, st.filled === 7);
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
    console.log(`  Final form state: total=${finalSt.total} filled=${finalSt.filled}`);

    expect(finalSt.total, 'react-select controls should be present in the form').toBeGreaterThan(0);
    expect(finalSt.filled, `all ${finalSt.total} dropdowns should be filled`).toBe(finalSt.total);

    // ── Save (with duplicate retry) ───────────────────────────────────────────
    // "Save Application" queues the application in a pending list. GuideUni rejects
    // an exact duplicate of an already-submitted application — in that case pick a
    // different random course and save again.
    const changeCourse = async (): Promise<string> => {
        // The course select is the last react-select in the form (it already has a value)
        const newCourse = await page.evaluate(() => {
            const ctrls = Array.from(document.querySelectorAll('[class*="-control"]'))
                .filter(el => (el as HTMLElement).offsetParent !== null);
            const ctrl = ctrls[ctrls.length - 1] as HTMLElement | undefined;
            if (!ctrl) return '';
            const inp = ctrl.querySelector('input') as HTMLInputElement | null;
            if (inp) inp.focus();
            ctrl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
            return 'opened';
        });
        if (!newCourse) return '';
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
        await ensureCreateTab();
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
            // Wizard may have jumped tabs after save — recover and re-check once
            await ensureCreateTab();
            queued = await submitBtn.waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);
        }
    }
    expect(queued, '"Submit N Application" button should appear after saving').toBe(true);

    // ── Final submit ──────────────────────────────────────────────────────────
    const submitLabel = (await submitBtn.textContent().catch(() => '') || '').trim();
    await submitBtn.click();
    console.log(`✓ Clicked "${submitLabel}"`);
    await page.waitForTimeout(1500);

    // Handle a possible confirmation dialog ("This action cannot be undone")
    await page.evaluate(() => {
        const dlg = document.querySelector('[class*="modal"], [role="dialog"], [class*="overlay"]');
        if (dlg && (dlg as HTMLElement).offsetParent !== null) {
            const btn = Array.from(dlg.querySelectorAll('button'))
                .find(b => /confirm|yes|submit|ok|proceed/i.test(b.textContent || '') && !/cancel|no/i.test(b.textContent || ''));
            (btn as HTMLElement | undefined)?.click();
        }
    });

    // Success = the pending Submit button disappears OR a success toast shows
    const submitted = await page.waitForFunction(
        () => {
            const toast = document.querySelector('.Toastify__toast-body')?.textContent?.trim() || '';
            if (/success|submitted|created/i.test(toast)) return `toast: ${toast}`;
            const stillPending = Array.from(document.querySelectorAll('button'))
                .some(b => (b as HTMLElement).offsetParent !== null && /Submit \d+ Application/.test(b.textContent || ''));
            return stillPending ? false : 'submit button cleared';
        },
        undefined,
        { timeout: 30000 }
    ).then(h => h.jsonValue() as Promise<string>).catch(() => '');
    console.log(`✓ Submission signal: ${submitted || '(none — verifying via applications list)'}`);

    // ── Verify on View Applications: the application count must increase ──────
    await page.goto('https://vivekconsultancy.flyurdream.com/#/Get-Applications');
    await page.waitForFunction(
        () => /\d+\s+applications?/i.test(document.body.innerText),
        undefined,
        { timeout: 20000 }
    ).catch(() => {});
    await page.waitForTimeout(3000);

    const after = await readAppsPage();
    console.log(`  After submit: ${after.count} applications | ids: ${after.ids.join(', ') || '(none)'}`);

    const newIds = after.ids.filter(id => !baseline.ids.includes(id));
    expect(after.count, `application count should increase from ${baseline.count}`).toBeGreaterThan(baseline.count);

    if (newIds.length) console.log(`\n🎯 CREATED APP ID: ${newIds.join(', ')}`);
    console.log(`\n✅ Application created and submitted successfully (${baseline.count} → ${after.count})`);
});
