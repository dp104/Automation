import { Page } from '@playwright/test';

// Shared helpers for the student-portal "apply to a course" flows.
// After clicking an Apply button the portal may open a modal (with react-select
// fields to complete), navigate to the application wizard, or show a toast.

export type ApplyOutcome = {
    url: string;
    modalText: string;
    toast: string;
    duplicate: boolean;
    responded: boolean;
};

// Fill every empty enabled react-select currently visible (modal cascades).
// Same technique as 29-create-application: focus inner input + mousedown,
// options identified by role="option". Returns the selected texts.
export async function fillVisibleReactSelects(page: Page, maxFields = 10, pickRandomLast = true): Promise<string[]> {
    const picked: string[] = [];
    let stall = 0;
    const t0 = Date.now();

    for (let iter = 0; iter < maxFields * 3 && stall < 4; iter++) {
        const iterT0 = Date.now();
        const st = await page.evaluate(() => {
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

        if (st.total === 0 || st.filled >= st.total || picked.length >= maxFields) break;
        if (st.emptyEnabled === 0) { stall++; await page.waitForTimeout(3000); continue; }

        const opened = await page.evaluate(() => {
            const ctrl = Array.from(document.querySelectorAll('[class*="-control"]')).find(el => {
                if (!(el as HTMLElement).offsetParent) return false;
                if (el.querySelector('[class*="-singleValue"], [class*="-multiValue"]')) return false;
                const ph = el.querySelector('[class*="-placeholder"]')?.textContent?.trim() || '';
                return ph.length > 0 && !ph.toLowerCase().includes(' first') && !/^loading/i.test(ph);
            }) as HTMLElement | undefined;
            if (!ctrl) return '';
            ctrl.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
            const inp = ctrl.querySelector('input') as HTMLInputElement | null;
            if (inp) inp.focus();
            ctrl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
            return ctrl.querySelector('[class*="-placeholder"]')?.textContent?.trim() || 'opened';
        });
        if (!opened) { stall++; await page.waitForTimeout(2000); continue; }

        await page.waitForFunction(
            () => Array.from(document.querySelectorAll('[role="option"]')).some(o => {
                const t = (o as HTMLElement).textContent?.trim() || '';
                return t.length > 0 && !/^loading/i.test(t);
            }),
            undefined,
            { timeout: 10000 }
        ).catch(() => {});

        const optText = await page.evaluate((random: boolean) => {
            // "Add New X" is a UI affordance for entering custom data, not a
            // real selectable value — picking it (randomly or as opts[0])
            // opens a different follow-up interaction this generic filler
            // doesn't handle, so exclude it like the loading placeholder.
            const opts = Array.from(document.querySelectorAll('[role="option"]')).filter(o => {
                const t = (o as HTMLElement).textContent?.trim() || '';
                return t.length > 0 && !/^loading/i.test(t) && !/^add new/i.test(t);
            });
            const idx = random ? Math.floor(Math.random() * opts.length) : 0;
            const el = opts[idx] as HTMLElement | undefined;
            const text = el?.textContent?.trim() || '';
            el?.click();
            return text;
        }, pickRandomLast && st.emptyEnabled === 1 && st.filled >= st.total - 1);

        if (optText) {
            picked.push(optText);
            console.log(`  ✓ ["${opened}"] = "${optText}" (iter took ${Date.now() - iterT0}ms, total +${Date.now() - t0}ms)`);
            stall = 0;
            await page.waitForTimeout(2000);
        } else {
            console.log(`  ✗ ["${opened}"] no options resolved (iter took ${Date.now() - iterT0}ms, total +${Date.now() - t0}ms)`);
            await page.keyboard.press('Escape').catch(() => {});
            stall++;
            await page.waitForTimeout(1500);
        }
    }
    console.log(`  [fillVisibleReactSelects] done: ${picked.length} filled, total ${Date.now() - t0}ms`);
    return picked;
}

// Snapshot what the app did in response to an Apply click.
export async function describeOutcome(page: Page): Promise<ApplyOutcome> {
    await page.waitForTimeout(3000);
    const snap = await page.evaluate(() => {
        const modal = Array.from(document.querySelectorAll('[class*="modal"], [role="dialog"], [class*="popup"], [class*="overlay"]'))
            .find(m => (m as HTMLElement).offsetParent !== null && ((m as HTMLElement).innerText || '').trim().length > 10);
        const toast = document.querySelector('.Toastify__toast-body')?.textContent?.trim() || '';
        return {
            modalText: modal ? (modal as HTMLElement).innerText.substring(0, 600) : '',
            toast,
            duplicate: /duplicate application/i.test(document.body.innerText),
        };
    });
    return {
        url: page.url(),
        modalText: snap.modalText,
        toast: snap.toast,
        duplicate: snap.duplicate,
        responded: !!(snap.modalText || snap.toast),
    };
}

// Complete the application submission inside the Student Profile Journey wizard
// after an "Apply Now" redirect. The wizard needs settle time, then the Create
// Application tab must be opened and the application saved + submitted there —
// only then is the application created and a GUIDA id generated.
// Some Apply Now sources (e.g. the university course popup) create the
// application directly: the course then appears in the tab's "Existing
// Applications" list — pass expectedCourse so this counts as success.
export async function completeWizardSubmission(page: Page, expectedCourse?: string): Promise<{ submitted: boolean; newIds: string[] }> {
    // Let the wizard settle after the Apply Now redirect
    await page.waitForTimeout(8000);

    const ensureCreateTab = async () => {
        const onTab = await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('.sp-tab'));
            const selected = tabs.find(t => t.getAttribute('aria-selected') === 'true')
                          || tabs.find(t => t.className.includes('active'));
            return selected?.textContent?.includes('Create Application') || false;
        });
        if (!onTab) {
            await page.locator('.sp-tab').filter({ hasText: 'Create Application' }).first().click().catch(() => {});
            await page.waitForTimeout(2500);
        }
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

    // Fill one empty enabled select. On Apply-Now-prefilled forms the empty
    // month control can have an EMPTY placeholder, so empty-ph controls are
    // included; disabled inputs are excluded instead. The pick strategy is
    // derived from the option contents (month names → January, 4-digit years →
    // first future year) with the placeholder as fallback.
    const fillOneField = async (): Promise<string> => {
        const opened = await page.evaluate(() => {
            const ctrl = Array.from(document.querySelectorAll('[class*="-control"]')).find(el => {
                if (!(el as HTMLElement).offsetParent) return false;
                if (el.querySelector('[class*="-singleValue"], [class*="-multiValue"]')) return false;
                const inp0 = el.querySelector('input') as HTMLInputElement | null;
                if (!inp0 || inp0.disabled) return false;
                const ph = el.querySelector('[class*="-placeholder"]')?.textContent?.trim() || '';
                return !ph.toLowerCase().includes(' first') && !/^loading/i.test(ph);
            }) as HTMLElement | undefined;
            if (!ctrl) return '';
            ctrl.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
            const inp = ctrl.querySelector('input') as HTMLInputElement | null;
            if (inp) inp.focus();
            ctrl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
            return ctrl.querySelector('[class*="-placeholder"]')?.textContent?.trim() || '(empty ph)';
        });
        if (!opened) return '';

        let hasOptions = await page.waitForFunction(
            () => Array.from(document.querySelectorAll('[role="option"]')).some(o => {
                const t = (o as HTMLElement).textContent?.trim() || '';
                return t.length > 0 && !/^loading/i.test(t);
            }),
            undefined,
            { timeout: 12000 }
        ).then(() => true).catch(() => false);

        if (!hasOptions) {
            // The dropdown may show react-select's "No options" message — a dead
            // end (no data for this field on this route), not a timing problem.
            const noOptions = await page.evaluate(() =>
                Array.from(document.querySelectorAll('div'))
                    .some(d => (d as HTMLElement).offsetParent !== null
                        && /^no options$/i.test((d as HTMLElement).textContent?.trim() || '')));
            if (noOptions) {
                console.log(`  ✗ ["${opened}"] shows "No options" — no data available for this field`);
                await page.keyboard.press('Escape').catch(() => {});
                return 'NO_OPTIONS';
            }

            // Synthetic mousedown didn't open the menu — retry with a real click
            await page.locator('[class*="-control"]:not(:has([class*="-singleValue"]))').first()
                .click({ force: true }).catch(() => {});
            hasOptions = await page.waitForFunction(
                () => Array.from(document.querySelectorAll('[role="option"]')).some(o => {
                    const t = (o as HTMLElement).textContent?.trim() || '';
                    return t.length > 0 && !/^loading/i.test(t);
                }),
                undefined,
                { timeout: 12000 }
            ).then(() => true).catch(() => false);
        }

        const optText = await page.evaluate((ph: string) => {
            const opts = Array.from(document.querySelectorAll('[role="option"]')).filter(o => {
                const t = (o as HTMLElement).textContent?.trim() || '';
                return t.length > 0 && !/^loading/i.test(t) && !/^add new/i.test(t);
            });
            if (!opts.length) return '';
            const texts = opts.map(o => (o as HTMLElement).textContent?.trim() || '');
            let el: Element | undefined;
            const monthIdx = texts.findIndex(t => /^january$/i.test(t));
            if (monthIdx >= 0 || /month/i.test(ph)) {
                el = monthIdx >= 0 ? opts[monthIdx] : opts[opts.length - 1];
            } else if (texts.every(t => /^\d{4}$/.test(t)) || /year/i.test(ph)) {
                const y = new Date().getFullYear();
                const futureIdx = texts.findIndex(t => parseInt(t, 10) > y);
                el = futureIdx >= 0 ? opts[futureIdx] : opts[opts.length - 1];
            } else if (/course/i.test(ph)) {
                el = opts[Math.floor(Math.random() * opts.length)];
            } else {
                el = opts[0];
            }
            const text = (el as HTMLElement).textContent?.trim() || '';
            (el as HTMLElement).click();
            return text;
        }, opened);

        if (optText) {
            console.log(`  ✓ ["${opened}"] = "${optText}"`);
            await page.waitForTimeout(2500);
        } else {
            await page.keyboard.press('Escape').catch(() => {});
        }
        return optText;
    };

    const changeCourseRandom = async () => {
        const opened = await page.evaluate(() => {
            const ctrls = Array.from(document.querySelectorAll('[class*="-control"]'))
                .filter(el => (el as HTMLElement).offsetParent !== null);
            const ctrl = ctrls[ctrls.length - 1] as HTMLElement | undefined;
            if (!ctrl) return false;
            const inp = ctrl.querySelector('input') as HTMLInputElement | null;
            if (inp) inp.focus();
            ctrl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
            return true;
        });
        if (!opened) return '';
        await page.waitForFunction(
            () => document.querySelectorAll('[role="option"]').length > 1,
            undefined,
            { timeout: 15000 }
        ).catch(() => {});
        return await page.evaluate(() => {
            const opts = Array.from(document.querySelectorAll('[role="option"]')).filter(o =>
                (o.textContent?.trim().length || 0) > 0 && o.getAttribute('aria-selected') !== 'true');
            const pick = opts[Math.floor(Math.random() * opts.length)] as HTMLElement | undefined;
            const t = pick?.textContent?.trim() || '';
            pick?.click();
            return t;
        });
    };

    const submitBtn = page.locator('button').filter({ hasText: /Submit \d+ Application/ }).first();
    let submitted = false;
    let emptyRounds = 0;
    let wedges = 0;

    // Fallback check: some Apply Now sources create the application directly —
    // the course then appears in the tab's "Existing Applications" list. Only
    // consulted when the form path is stuck, so a normal prefilled form always
    // goes through Save → Submit even if the same course was applied before.
    const courseInExisting = async (): Promise<boolean> => {
        if (!expectedCourse) return false;
        return await page.evaluate((course: string) => {
            const sections = Array.from(document.querySelectorAll('div'))
                .filter(d => /existing applications/i.test(d.textContent || '')
                    && /application (received|in progress)/i.test(d.textContent || ''));
            const section = sections[sections.length - 1];
            return !!section && (section.textContent || '').includes(course);
        }, expectedCourse);
    };

    for (let iter = 0; iter < 25 && !submitted; iter++) {
        await ensureCreateTab();

        // Application already queued? Submit it.
        if (await submitBtn.isVisible().catch(() => false)) {
            const label = (await submitBtn.textContent().catch(() => '') || '').trim();
            await submitBtn.click();
            console.log(`  ✓ Clicked "${label}"`);
            submitted = await page.waitForFunction(
                () => {
                    const toast = document.querySelector('.Toastify__toast-body')?.textContent || '';
                    if (/success|submitted|created/i.test(toast)) return true;
                    return !Array.from(document.querySelectorAll('button'))
                        .some(b => (b as HTMLElement).offsetParent !== null && /Submit \d+ Application/.test(b.textContent || ''));
                },
                undefined,
                { timeout: 30000 }
            ).then(() => true).catch(() => false);
            continue;
        }

        const st = await formStats();
        if (st.total === 0) {
            // No form at all — the application may have been created directly
            if (await courseInExisting()) {
                console.log(`  ✓ "${expectedCourse}" is listed under Existing Applications — created by Apply Now`);
                submitted = true;
                break;
            }
            emptyRounds++;
            if (emptyRounds >= 3) {
                // No prefilled form and nothing queued — open the form ourselves
                await page.evaluate(() => {
                    const edu = document.querySelector('[class*="edu-add-btn"]') as HTMLElement | null;
                    if (edu) { edu.click(); return; }
                    const btn = Array.from(document.querySelectorAll('button')).find(b =>
                        (b as HTMLElement).offsetParent !== null
                        && b.className.includes('sp-btn') && !b.className.includes('sp-tab')
                        && b.textContent?.trim() === 'Create Application') as HTMLElement | undefined;
                    btn?.click();
                });
                emptyRounds = 0;
            }
            await page.waitForTimeout(3000);
            continue;
        }

        if (st.filled >= st.total) {
            // Form complete — save it (this queues the application)
            const saveBtn = page.locator('button').filter({ hasText: /save application/i }).first();
            if (await saveBtn.isVisible().catch(() => false)) {
                await saveBtn.click();
                console.log('  ✓ Clicked "Save Application"');
                await page.waitForTimeout(4000);
                const duplicate = await page.evaluate(() =>
                    /(duplicate application|application already exists)/i.test(document.body.innerText));
                if (duplicate) {
                    console.log('  ⚠ Duplicate combination — picking a different course');
                    const c = await changeCourseRandom();
                    if (c) console.log(`  ↻ Course changed to "${c}"`);
                    await page.waitForTimeout(2000);
                }
            } else {
                await page.waitForTimeout(3000);
            }
            continue;
        }

        if (st.emptyEnabled > 0) {
            const val = await fillOneField();
            if (val && val !== 'NO_OPTIONS') {
                wedges = 0;
                continue;
            }
            // Form path is stuck — was the application created directly by Apply Now?
            if (await courseInExisting()) {
                console.log(`  ✓ "${expectedCourse}" is listed under Existing Applications — created by Apply Now`);
                submitted = true;
                break;
            }
            wedges++;
            if (val === 'NO_OPTIONS') {
                if (wedges >= 3) {
                    console.log('  ✗ Field has no selectable options — cannot complete this form (possible app data gap)');
                    break;
                }
                await page.waitForTimeout(4000);
            } else if (wedges === 2) {
                // On Apply-Now-prefilled forms the programmatic prefill may never
                // trigger the cascade fetch, leaving the next dropdown without
                // options. Re-selecting the previous (filled) field re-fires the
                // cascade — the same thing a user would do to unstick the form.
                console.log('  → re-selecting the previous field to re-trigger the cascade');
                await page.evaluate(() => {
                    const ctrls = Array.from(document.querySelectorAll('[class*="-control"]'))
                        .filter(el => (el as HTMLElement).offsetParent !== null);
                    const firstEmptyIdx = ctrls.findIndex(c =>
                        !c.querySelector('[class*="-singleValue"], [class*="-multiValue"]'));
                    const prev = ctrls[firstEmptyIdx - 1] as HTMLElement | undefined;
                    if (!prev) return;
                    const inp = prev.querySelector('input') as HTMLInputElement | null;
                    if (inp) inp.focus();
                    prev.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
                });
                await page.waitForTimeout(2000);
                await page.evaluate(() => {
                    const opts = Array.from(document.querySelectorAll('[role="option"]'));
                    const sel = opts.find(o => o.getAttribute('aria-selected') === 'true') || opts[0];
                    (sel as HTMLElement | undefined)?.click();
                });
                await page.waitForTimeout(3000);
            } else {
                if (wedges >= 5) {
                    console.log('  ✗ Dropdown never produced options after repeated recoveries — aborting');
                    break;
                }
                // Options failed to load — re-clicking the Create Application tab
                // unwedges the dropdown (same recovery as 29-create-application)
                console.log('  → dropdown wedged, re-clicking Create Application tab to recover');
                await page.keyboard.press('Escape').catch(() => {});
                await page.locator('.sp-tab').filter({ hasText: 'Create Application' }).first().click().catch(() => {});
                await page.waitForTimeout(2500);
            }
        } else {
            await page.waitForTimeout(3500);
        }
    }

    // Best-effort: fetch the newest GUIDA id from the View Applications page.
    // This tenant's server can be slow to reflect a just-created application
    // here — a single fixed wait was leaving newIds empty whenever the
    // expanded row hadn't rendered any GUIDA ids yet by the time it was
    // read. Poll instead: re-click the expander and re-check for up to ~45s
    // rather than gambling on one fixed-length wait.
    const newIds: string[] = [];
    if (submitted) {
        await page.goto(page.url().replace(/#.*/, '') + '#/Get-Applications').catch(() => {});
        await page.waitForFunction(
            () => /\d+\s+applications?/i.test(document.body.innerText),
            undefined,
            { timeout: 30000 }
        ).catch(() => {});
        await page.waitForTimeout(2000);

        let ids: string[] = [];
        for (let attempt = 0; attempt < 8 && ids.length === 0; attempt++) {
            await page.locator('.gad-expander-icon').first().click().catch(() => {});
            const found = await page.waitForFunction(
                () => /GUIDA\d+/.test(document.body.innerText),
                undefined,
                { timeout: 5000 }
            ).then(() => true).catch(() => false);
            if (found) {
                ids = await page.evaluate(() => [...new Set(document.body.innerText.match(/GUIDA\d+/g) || [])]);
            }
            if (ids.length === 0) await page.waitForTimeout(3000);
        }
        if (ids.length) {
            // GUIDA ids are sequential — the highest number is the newest (just created)
            const newest = ids.sort((a, b) => parseInt(a.slice(5), 10) - parseInt(b.slice(5), 10)).pop()!;
            newIds.push(newest);
        }
        console.log(`  [completeWizardSubmission] application ID capture: ${newIds.length ? newIds.join(', ') : 'not found after retries'}`);
    }
    return { submitted, newIds };
}

// Upload the given file into every "required document" dropzone on the
// sp-wizard Documents tab. Extracted from
// tests/student-flows/32-create-application-with-documents.spec.ts so the
// exact same, already-verified mechanics are reusable by any portal/role —
// the Documents tab is the same shared component regardless of who's filling
// it out (student, or partner on behalf of a student).
//
// Mechanics: choosing a file only STAGES it in a document card; a separate
// "Upload File" button then performs the actual upload ("smart upload" —
// each file is attached to every selected application still missing it).
// File inputs re-render after each upload, so cards are re-queried every
// round rather than cached by index.
export async function uploadAllRequiredDocuments(page: Page, filePath: string): Promise<{ done: number; total: number; uploads: number; complete: boolean }> {
    const ensureDocumentsTab = async () => {
        const onTab = await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('.sp-tab'));
            const selected = tabs.find(t => t.getAttribute('aria-selected') === 'true')
                          || tabs.find(t => t.className.includes('active'));
            return selected?.textContent?.includes('Documents') || false;
        });
        if (!onTab) {
            await page.locator('.sp-tab').filter({ hasText: 'Documents' }).first().click().catch(() => {});
            await page.waitForTimeout(2000);
        }
    };

    const readDocProgress = () => page.evaluate(() => {
        const m = document.body.innerText.match(/(\d+)\s+of\s+(\d+)\s+required documents done/i);
        return m ? { done: parseInt(m[1], 10), total: parseInt(m[2], 10) } : { done: -1, total: -1 };
    });

    for (let i = 0; i < 5; i++) {
        await ensureDocumentsTab();
        const loaded = await page.evaluate(() => /required documents/i.test(document.body.innerText));
        if (loaded) break;
        await page.waitForTimeout(3000);
    }

    const initialProgress = await readDocProgress();
    let uploads = 0;

    for (let round = 0; round < initialProgress.total + 4; round++) {
        await ensureDocumentsTab();

        const progress = await readDocProgress();
        if (progress.done >= progress.total && progress.total > 0) break;

        // A file left staged from a previous round? Upload it first.
        const leftoverBtn = page.locator('button').filter({ hasText: /upload file/i }).first();
        const hasLeftover = await leftoverBtn.isVisible().catch(() => false);

        if (!hasLeftover) {
            // Target the file input inside the first document card that still
            // needs a file (card text contains "still need this"). Completed
            // cards may keep their inputs, so plain index-by-order is unsafe.
            const inputHandle = await page.evaluateHandle(() => {
                const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
                for (const inp of inputs) {
                    let node: Element | null = inp.parentElement;
                    for (let d = 0; d < 8 && node; d++) {
                        const t = node.textContent || '';
                        if (/still needs? this/i.test(t)) {
                            // Smallest ancestor naming the need — must be a single card
                            if (node.querySelectorAll('input[type="file"]').length === 1
                                && !/Upload File/i.test(t)) return inp;
                            break;
                        }
                        node = node.parentElement;
                    }
                }
                return null;
            });
            const inputEl = inputHandle.asElement();
            if (!inputEl) {
                await inputHandle.dispose();
                // No card says "still need this" → all required documents are done
                // (the progress counter also disappears from the page in this state)
                const anyNeeding = await page.evaluate(() =>
                    /still needs? this/i.test(document.body.innerText));
                if (!anyNeeding && uploads > 0) break;
                await page.waitForTimeout(3000);
                continue;
            }
            await inputEl.setInputFiles(filePath);
            await inputHandle.dispose();
            console.log('  → staged file in next needing document card');
            await page.waitForTimeout(1500);
        }

        // Selecting a file only STAGES it in the card — an "Upload File" button
        // appears next to the staged file and performs the actual upload.
        const uploadFileBtn = page.locator('button').filter({ hasText: /upload file/i }).first();
        const uploadBtnVisible = await uploadFileBtn.waitFor({ state: 'visible', timeout: 10000 })
            .then(() => true).catch(() => false);
        if (uploadBtnVisible) {
            await uploadFileBtn.click();
            uploads++;
            console.log('  ↑ clicked "Upload File"');
        } else {
            console.log('  ⚠ "Upload File" button not found after staging');
        }

        // Wait for the progress counter to advance (upload to all selected apps + API processing)
        await page.waitForFunction(
            (prevDone: number) => {
                const m = document.body.innerText.match(/(\d+)\s+of\s+(\d+)\s+required documents done/i);
                return m ? parseInt(m[1], 10) > prevDone : false;
            },
            progress.done,
            { timeout: 60000 }
        ).catch(() => console.log('  (progress counter did not advance — will re-check)'));
        await page.waitForTimeout(2000);
    }

    // Success = counter shows done==total, OR the counter and all "still need
    // this" badges are gone (the UI removes both once every required document
    // is uploaded — the counter regex can then return -1/-1, which is why
    // `complete` must be computed here rather than left to `done>=total`).
    await ensureDocumentsTab();
    const finalProgress = await readDocProgress();
    const stillNeeding = await page.evaluate(() => /still needs? this/i.test(document.body.innerText));
    const complete = (finalProgress.total > 0 && finalProgress.done >= finalProgress.total)
        || (!stillNeeding && uploads > 0);
    return { done: finalProgress.done, total: finalProgress.total, uploads, complete };
}

// Click the modal's primary action (Apply / Submit / Confirm / Create / Save) if present.
export async function clickModalPrimary(page: Page): Promise<string> {
    return await page.evaluate(() => {
        const containers = Array.from(document.querySelectorAll('[class*="modal"], [role="dialog"], [class*="popup"]'))
            .filter(m => (m as HTMLElement).offsetParent !== null);
        const scope = containers.length ? containers[containers.length - 1] : document;
        const btn = Array.from(scope.querySelectorAll('button'))
            .filter(b => (b as HTMLElement).offsetParent !== null)
            .find(b => /apply|submit|confirm|create|save|yes|proceed/i.test(b.textContent || '')
                && !/cancel|close|no\b/i.test(b.textContent || ''));
        if (btn) { (btn as HTMLElement).click(); return btn.textContent?.trim() || ''; }
        return '';
    });
}
