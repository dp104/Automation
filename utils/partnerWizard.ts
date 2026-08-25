import { Page } from '@playwright/test';
import { fakerEN_IN as faker } from '@faker-js/faker';
import { fillVisibleReactSelects } from './applyFlow';

// Shared helpers for driving the sp-wizard ("Student Profile Journey") when a
// PARTNER is filling it out for a brand-new student (no Student ID fetched).
// Extracted from tests/vivekconsultancy-partner/03-add-student-new.spec.ts so
// other partner scripts (e.g. 16-add-student-new-with-documents) can reuse
// the exact same, already-verified logic instead of re-deriving it.

export type NewStudentIdentity = {
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
};

// Build a fresh, realistic identity (Indian locale Faker, matching the +91
// phone setup used across this suite). Unique per call via a short timestamp.
export function generateNewStudentIdentity(): NewStudentIdentity {
    const stamp = Date.now().toString().slice(-8);
    const sex = faker.person.sexType();
    const firstName = faker.person.firstName(sex).replace(/[^A-Za-z]/g, '');
    const lastName = faker.person.lastName().replace(/[^A-Za-z]/g, '');
    return {
        firstName,
        lastName,
        email: `${firstName}.${lastName}${stamp.slice(-4)}@gmail.com`.toLowerCase(),
        mobile: `${faker.helpers.arrayElement(['9', '8', '7', '6'])}${stamp.padStart(9, '0')}`.slice(0, 10),
    };
}

// Fill the plain (non-react-select) inputs on whichever sp-wizard tab is
// currently showing, matched by placeholder text — generic across tabs
// (Personal Details / Education Details / Emergency & Visa all use the same
// sp-input/sp-date components with different placeholders).
export async function fillPlainWizardInputs(page: Page, student: NewStudentIdentity): Promise<string[]> {
    const filled: string[] = [];
    const inputs = page.locator('input.sp-input, input.sp-date, input.sp-phone-num');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        if (!(await input.isVisible().catch(() => false))) continue;
        if (await input.isDisabled().catch(() => false)) continue;
        const current = await input.inputValue().catch(() => '');
        if (current) continue; // already filled (e.g. by a prior tab / fetch)

        const ph = (await input.getAttribute('placeholder')) || '';
        const type = (await input.getAttribute('type')) || 'text';
        let value = '';

        if (/first name/i.test(ph)) value = student.firstName;
        else if (/last name/i.test(ph)) value = student.lastName;
        else if (/email|name@example/i.test(ph)) value = student.email;
        else if (/phone/i.test(ph) || type === 'tel') value = student.mobile;
        else if (/^e\.g\. [A-Z]\d+/i.test(ph)) value = `N${faker.string.numeric(7)}`; // passport no.
        else if (/address line 1/i.test(ph)) value = faker.location.streetAddress();
        else if (/address line 2/i.test(ph)) value = faker.location.secondaryAddress();
        else if (/zip|postal|500081/i.test(ph)) value = faker.location.zipCode('######');
        else if (type === 'date') {
            // Heuristic by field order isn't reliable across tabs, so pick a
            // safe generic date: comfortably in the past and adult-plausible.
            // (DOB, passport issue/expiry all accept a date in this general
            // range without tripping "must be 18+"/"not future" validation
            // for a rough smoke pass; tune per-field if validation complains.)
            value = '2000-01-15';
        } else if (type === 'text' && !ph) {
            continue; // unlabeled helper input (e.g. inside a react-select) — skip
        } else {
            continue;
        }

        await input.fill(value).catch(() => {});
        filled.push(`${ph || type}="${value}"`);
    }
    return filled;
}

// Deterministically select ONE named react-select option by matching the
// control's own placeholder/label text, instead of leaving it to
// fillVisibleReactSelects' generic first-option/random-pick behaviour —
// needed whenever the default pick would be wrong (e.g. the alphabetically-
// first "Afghanistan" for Nationality, which this tenant has no course-
// eligibility data for).
export async function selectDropdownOption(page: Page, labelMatch: string, optionMatch: string | RegExp, timeoutMs = 8000): Promise<string> {
    const opened = await page.evaluate((label: string) => {
        const ctrl = Array.from(document.querySelectorAll('[class*="-control"]')).find(el =>
            (el as HTMLElement).offsetParent !== null
            && !el.querySelector('[class*="-singleValue"], [class*="-multiValue"]')
            && (el.querySelector('[class*="-placeholder"]')?.textContent || '').toLowerCase().includes(label.toLowerCase()));
        if (!ctrl) return false;
        (ctrl as HTMLElement).scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
        (ctrl as HTMLElement).dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
        return true;
    }, labelMatch);
    if (!opened) return '';

    await page.waitForFunction(
        () => Array.from(document.querySelectorAll('[role="option"]')).some(o => (o as HTMLElement).textContent?.trim()),
        undefined,
        { timeout: timeoutMs }
    ).catch(() => {});

    // A plain substring match on a short name like "India" can wrongly hit
    // an unrelated option that merely contains it, e.g. "British Indian
    // Ocean Territory" — and since it's alphabetically earlier, .find()
    // would grab it first. Prefer an exact (whole-text) match; only fall
    // back to substring matching for genuinely partial patterns (regexes).
    const exactPattern = typeof optionMatch === 'string'
        ? optionMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        : optionMatch.source;
    const substringPattern = exactPattern;
    const pickedText = await page.evaluate(({ exact, substring }: { exact: string; substring: string }) => {
        const opts = Array.from(document.querySelectorAll('[role="option"]'));
        const exactRe = new RegExp(`^${exact}$`, 'i');
        const subRe = new RegExp(substring, 'i');
        const el = opts.find(o => exactRe.test((o.textContent || '').trim())) || opts.find(o => subRe.test(o.textContent || ''));
        (el as HTMLElement | undefined)?.click();
        return el?.textContent?.trim() || '';
    }, { exact: exactPattern, substring: substringPattern });
    if (!pickedText) await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(1200);
    return pickedText;
}

// Click Next/Save & Next and POLL for the tab to actually change — do not
// blindly retry-click. This tenant's server can take 30-45+ seconds to save
// a step and advance (known slow-server behavior), and the button stays
// disabled ("Saving…") the whole time; naive re-clicking just hammers a
// disabled button for the full test timeout without ever progressing.
export async function advanceWizardTab(page: Page, targetTab: string, timeoutMs = 150000): Promise<boolean> {
    const t0 = Date.now();
    // Every tab's own "Next"/"Save & Next" button stays in the DOM (hidden
    // via CSS, not removed) even when its tab isn't active — matching by
    // text alone with .first() can silently grab a stale, invisible button
    // from a DIFFERENT tab instead of the current one's actual button.
    const btn = page.locator('.sp-btn-primary:visible').filter({ hasText: /save & next|next/i }).first();
    // isVisible() is an instant, non-retrying DOM check despite accepting a
    // `timeout` option — it does NOT poll. waitFor() is the real "give it up
    // to N ms to render" primitive, which matters right after a tab's last
    // input action (e.g. the Yes/No clicks in fillEducationDetailsTab) with
    // no trailing settle-wait before this is called.
    const buttonAppeared = await btn.waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false);
    if (!buttonAppeared) {
        console.log(`  [advanceWizardTab→${targetTab}] "Save & Next" button never appeared (+${Date.now() - t0}ms)`);
        return false;
    }
    await btn.click({ timeout: 10000 }).catch(() => {});
    const advanced = await page.waitForFunction(
        (name: string) => {
            const active = Array.from(document.querySelectorAll('.sp-tab'))
                .find(t => t.className.includes('active') || t.getAttribute('aria-selected') === 'true');
            return active?.textContent?.includes(name) || false;
        },
        targetTab,
        { timeout: timeoutMs }
    ).then(() => true).catch(() => false);
    console.log(`  [advanceWizardTab→${targetTab}] ${advanced ? 'advanced' : 'gave up'} after ${Date.now() - t0}ms`);
    return advanced;
}

// A higher "highest level achieved" cascades into a taller stack of school-
// level record cards, each needing its own Country/Board/School Name/dates:
// e.g. Undergraduate reveals 10th + 12th-or-Diploma + UG (3 cards). Used to
// size how many dropdowns/records the rest of this function should expect.
const EDUCATION_LEVEL_RECORD_COUNTS: Record<string, number> = {
    'Secondary Education (10th)': 1,
    'Higher Secondary Certificate / Diploma': 2,
    'Undergraduate': 3,
    'Postgraduate': 4,
};

// Handle the Education Details tab specifically: fields are hidden behind an
// "Add Education" button; clicking it reveals a "highest level achieved"
// dropdown, which in turn reveals one school-level record card per level up
// to and including the chosen one, plus a few Yes/No prompts (e.g. gaps in
// education, disciplinary action) with no further text fields. "No" is a
// safe default for a smoke/coverage pass. Pass thorough=true to instead
// answer "Yes" to the three optional sections (Course Preferences, English
// Proficiency Test Scores, Work Experience) and fill everything they reveal.
// preferredType picks which chip to select whenever a record's "Type" step
// offers more than one option (e.g. "12th (HSC)" vs "Diploma") — defaults
// to "Diploma" when not given, since that's this suite's most-used path.
export async function fillEducationDetailsTab(
    page: Page,
    highestLevel: string = 'Secondary Education (10th)',
    thorough: boolean = false,
    preferredType: string = 'Diploma'
): Promise<{ dropdowns: string[]; yesNoAnswered: number }> {
    const t0 = Date.now();
    const addEducationBtn = page.locator('button').filter({ hasText: 'Add Education' }).first();
    if (await addEducationBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addEducationBtn.click();
        await page.waitForTimeout(1500);
    }
    console.log(`  [fillEducationDetailsTab] Add Education step done (+${Date.now() - t0}ms)`);

    // Deterministic pick — fillVisibleReactSelects' generic random-pick would
    // otherwise land unpredictably anywhere from 10th to Postgraduate.
    const levelPicked = await selectDropdownOption(page, 'highest level', highestLevel);
    console.log(`  [fillEducationDetailsTab] highest-level selection (${highestLevel}) done: "${levelPicked}" (+${Date.now() - t0}ms)`);

    const recordCount = EDUCATION_LEVEL_RECORD_COUNTS[highestLevel] ?? 1;

    // Records are revealed and unlocked ONE AT A TIME — a level below the
    // top of the stack starts "Pending — complete previous step" and only
    // becomes editable once the one before it is individually saved. So
    // each record must be filled AND saved before moving to the next,
    // rather than filling every visible field across all records upfront.
    const dropdowns: string[] = [];
    let savedCount = 0;
    for (let record = 0; record < recordCount; record++) {
        // Records above 10th (12th/Diploma, UG, ...) show an extra "Type"
        // chip group first (e.g. "12th (HSC)" vs "Diploma") that gates the
        // rest of the record's fields — distinct from the later Percentage/
        // Grade/GPA/Other score-type chips, which always use those 4 exact
        // labels. Deterministically pick preferredType when it's one of the
        // offered chips (rather than whichever happens to render first);
        // fall back to the first non-score option otherwise.
        const typeChipGroup = page.locator('.edu-chip').filter({ hasNotText: /^(Percentage|Grade|GPA|Other)$/ });
        const typeChipGroupVisible = await typeChipGroup.first().waitFor({ state: 'visible', timeout: 2000 }).then(() => true).catch(() => false);
        if (typeChipGroupVisible) {
            const preferredChip = typeChipGroup.filter({ hasText: new RegExp(`^${preferredType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).first();
            const hasPreferredOption = await preferredChip.isVisible({ timeout: 500 }).catch(() => false);
            const typeChip = hasPreferredOption ? preferredChip : typeChipGroup.first();
            const alreadySet = (await typeChip.getAttribute('class').catch(() => '') || '').includes(' on');
            if (!alreadySet) {
                const pickedType = (await typeChip.textContent().catch(() => '') || '').trim();
                await typeChip.click({ timeout: 5000 }).catch(() => {});
                console.log(`  [fillEducationDetailsTab] record ${record + 1}/${recordCount}: type = "${pickedType}" (+${Date.now() - t0}ms)`);
                await page.waitForTimeout(800);
            }
        }

        // Studied Country pinned to India — same reasoning as Personal
        // Details' Nationality/Country: leaving it to the generic filler
        // defaults to alphabetically-first "Afghanistan", which turned out
        // to have incomplete/no Board data for some education levels here.
        const studiedCountry = await selectDropdownOption(page, 'country', 'India');
        // Board for whichever record is currently unlocked — 3 gives
        // headroom over the 1 remaining field actually needed per record.
        const picked = await fillVisibleReactSelects(page, 3);
        if (studiedCountry) dropdowns.push(studiedCountry);
        dropdowns.push(...picked);

        // Plain fields fillVisibleReactSelects never touches: an institution-
        // name field (placeholder varies by level — "Name of the school" for
        // 10th, "Name of the college" for 12th/Diploma, etc.) and a Start/End
        // date pair (neither date carries a distinguishing placeholder, so
        // pair by DOM order — even index = earlier date, odd = later). Only
        // the just-unlocked record's inputs will be empty; previously-saved
        // records collapse into a read-only summary.
        const institutionInputs = page.getByPlaceholder(/name of the (school|college|university|institut)/i);
        const institutionCount = await institutionInputs.count();
        for (let i = 0; i < institutionCount; i++) {
            const inp = institutionInputs.nth(i);
            if ((await inp.inputValue().catch(() => '')) === '') {
                await inp.fill(`${faker.location.city()} Public School`).catch(() => {});
            }
        }
        const dateInputs = page.locator('input.sp-date');
        const dateCount = await dateInputs.count();
        for (let i = 0; i < dateCount; i++) {
            const inp = dateInputs.nth(i);
            if ((await inp.inputValue().catch(() => '')) === '') {
                await inp.fill(i % 2 === 0 ? '2014-06-01' : '2018-06-01').catch(() => {});
            }
        }

        // Score type (a "Percentage/Grade/GPA/Other" chip, which only then
        // reveals its value input) for this record.
        const scoreChip = page.locator('.edu-chip').filter({ hasText: 'Percentage' }).first();
        const alreadyOn = (await scoreChip.getAttribute('class').catch(() => '') || '').includes(' on');
        if (!alreadyOn) await scoreChip.click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(500);

        // Some levels (e.g. 12th) show a SECOND numeric field too ("English
        // Marks — Out of 100") alongside the score value, both sharing the
        // same "e.g. <digit>" example-placeholder style ("e.g. 85.5 or
        // 7.33%" / "e.g. 88") — fill EVERY match, not just the first, or
        // whichever one isn't first stays empty and blocks the record save.
        const scoreLikeInputs = page.getByPlaceholder(/^e\.g\.\s*\d/i);
        const scoreLikeCount = await scoreLikeInputs.count();
        for (let i = 0; i < scoreLikeCount; i++) {
            const inp = scoreLikeInputs.nth(i);
            if ((await inp.inputValue().catch(() => '')) === '') {
                await inp.fill('78').catch(() => {});
            }
        }

        console.log(`  [fillEducationDetailsTab] record ${record + 1}/${recordCount}: filled ${picked.length} dropdown(s), ${institutionCount} institution field(s), ${dateCount} date field(s) (+${Date.now() - t0}ms)`);

        // Save THIS record — its own "Save ... Record" button (text varies
        // by level, e.g. "Save SSC Record" for Secondary Education). Only
        // once saved does the next record (if any) unlock.
        const saveRecordBtn = page.locator('button').filter({ hasText: /save .* record/i }).first();
        const saveRecordVisible = await saveRecordBtn.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
        if (!saveRecordVisible) {
            console.log(`  [fillEducationDetailsTab] record ${record + 1}/${recordCount}: no Save button found, stopping here (+${Date.now() - t0}ms)`);
            break;
        }
        await saveRecordBtn.click({ timeout: 5000 }).catch(() => {});
        await page.waitForFunction(
            () => /uploaded|saved/i.test(document.body.innerText),
            undefined,
            { timeout: 10000 }
        ).catch(() => {});
        savedCount++;
        console.log(`  [fillEducationDetailsTab] record ${record + 1}/${recordCount} saved (+${Date.now() - t0}ms)`);
        await page.waitForTimeout(1000);
    }
    console.log(`  [fillEducationDetailsTab] all records saved: ${savedCount}/${recordCount} (+${Date.now() - t0}ms)`);

    const submitAllBtn = page.locator('button').filter({ hasText: /submit all levels/i }).first();
    const submitAllVisible = await submitAllBtn.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
    if (submitAllVisible) {
        const enabled = await submitAllBtn.isEnabled().catch(() => false);
        if (enabled) {
            await submitAllBtn.click({ timeout: 5000 }).catch(() => {});
            await page.waitForFunction(
                () => /all education levels submitted|all levels uploaded|all .* uploaded/i.test(document.body.innerText),
                undefined,
                { timeout: 15000 }
            ).catch(() => {});
        }
    }
    console.log(`  [fillEducationDetailsTab] all levels submitted: ${submitAllVisible} (+${Date.now() - t0}ms)`);

    // Hoisted so the final "click all No" pass below can skip whichever of
    // these sections thorough mode already successfully answered "Yes" to.
    let clickedCoursePref = false;
    let clickedEnglish = false;
    let clickedWorkExp = false;
    if (thorough) {
        // Course Preferences → Yes reveals a "type a course, press Add" tag
        // input plus its own Submit button. Each optional section is
        // wrapped in its own .edu-sec container — scope by that (not by
        // exact label text, which fails since the "Optional" badge sits
        // directly adjacent with no separating whitespace, e.g. "Work
        // ExperienceOptional", so no element's own text is ever exactly
        // "Work Experience" alone).
        const coursePrefYes = page.locator('.edu-sec').filter({ hasText: 'Course Preferences' })
            .getByRole('button', { name: 'Yes', exact: true });
        clickedCoursePref = await coursePrefYes.click({ timeout: 3000 }).then(() => true).catch(() => false);
        if (clickedCoursePref) {
            const courseInput = page.getByPlaceholder('Type a course and press Add…');
            if (await courseInput.waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false)) {
                await courseInput.fill('MBA').catch(() => {});
                await courseInput.press('Enter').catch(() => {});
                const submitCourse = page.locator('button').filter({ hasText: /^Submit$/ }).first();
                await submitCourse.click({ timeout: 3000 }).catch(() => {});
                await page.waitForTimeout(500);
            }
        }
        console.log(`  [fillEducationDetailsTab] Course Preferences (thorough): ${clickedCoursePref} (+${Date.now() - t0}ms)`);

        // English Proficiency Test Scores → Yes reveals an exam chip list;
        // picking one (IELTS Academic) reveals Overall + 4 sub-band scores.
        const englishYes = page.locator('.edu-sec').filter({ hasText: 'English Proficiency Test Scores' })
            .getByRole('button', { name: 'Yes', exact: true });
        clickedEnglish = await englishYes.click({ timeout: 3000 }).then(() => true).catch(() => false);
        if (clickedEnglish) {
            const ieltsChip = page.locator('button').filter({ hasText: 'IELTS Academic' }).first();
            if (await ieltsChip.waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false)) {
                await ieltsChip.click({ timeout: 3000 }).catch(() => {});
                const scoreInputs = page.getByPlaceholder('Score');
                const scoreCount = await scoreInputs.count();
                for (let i = 0; i < scoreCount; i++) {
                    const inp = scoreInputs.nth(i);
                    if ((await inp.inputValue().catch(() => '')) === '') {
                        await inp.fill('7.5').catch(() => {});
                    }
                }
                const submitScores = page.locator('button').filter({ hasText: /submit scores/i }).first();
                await submitScores.click({ timeout: 3000 }).catch(() => {});
                await page.waitForTimeout(500);
            }
        }
        console.log(`  [fillEducationDetailsTab] English Proficiency (thorough): ${clickedEnglish} (+${Date.now() - t0}ms)`);

        // Work Experience → Yes reveals a full "New Experience" card.
        const workExpYes = page.locator('.edu-sec').filter({ hasText: 'Work Experience' })
            .getByRole('button', { name: 'Yes', exact: true });
        clickedWorkExp = await workExpYes.click({ timeout: 3000 }).then(() => true).catch(() => false);
        if (clickedWorkExp) {
            const companyInput = page.getByPlaceholder('e.g. Infosys Ltd.');
            const roleInput = page.getByPlaceholder('e.g. Software Engineer');
            const projectInput = page.getByPlaceholder('e.g. Payment Gateway Migration');
            const descriptionInput = page.getByPlaceholder('Brief description of role and responsibilities…');
            if (await companyInput.waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false)) {
                await companyInput.fill(faker.company.name()).catch(() => {});
                await roleInput.fill(faker.person.jobTitle()).catch(() => {});
                await projectInput.fill(faker.commerce.productName()).catch(() => {});
                await descriptionInput.fill(faker.lorem.sentence()).catch(() => {});
                const allDateInputs = page.locator('input.sp-date');
                const dateCount2 = await allDateInputs.count();
                for (let i = 0; i < dateCount2; i++) {
                    const inp = allDateInputs.nth(i);
                    if ((await inp.inputValue().catch(() => '')) === '') {
                        await inp.fill(i % 2 === 0 ? '2019-01-15' : '2022-01-15').catch(() => {});
                    }
                }
                const saveExpBtn = page.locator('button').filter({ hasText: /save experience/i }).first();
                await saveExpBtn.click({ timeout: 3000 }).catch(() => {});
                await page.waitForTimeout(800);
            }
        }
        console.log(`  [fillEducationDetailsTab] Work Experience (thorough): ${clickedWorkExp} (+${Date.now() - t0}ms)`);
    }

    // Both the "Yes" and "No" toggle buttons stay in the DOM regardless of
    // which is currently selected — a blanket click on every "No" button
    // would silently REVERT the three sections thorough mode just answered
    // "Yes" to (confirmed live: it wiped Course Preferences/English
    // Proficiency/Work Experience data). Skip "No" buttons whose containing
    // row belongs to a section thorough mode successfully handled.
    const thoroughSkipLabels = thorough
        ? [
            clickedCoursePref ? 'Course Preferences' : '',
            clickedEnglish ? 'English Proficiency Test Scores' : '',
            clickedWorkExp ? 'Work Experience' : '',
        ].filter(Boolean)
        : [];
    const yesNoCount = await page.evaluate((skipLabels: string[]) => {
        const noButtons = Array.from(document.querySelectorAll('button'))
            .filter(b => (b as HTMLElement).offsetParent !== null && b.textContent?.trim() === 'No');
        let clicked = 0;
        for (const btn of noButtons) {
            let container: Element | null = btn.parentElement;
            let skip = false;
            for (let i = 0; i < 4 && container; i++) {
                const text = container.textContent || '';
                if (skipLabels.some(label => text.includes(label))) { skip = true; break; }
                container = container.parentElement;
            }
            if (!skip) { (btn as HTMLElement).click(); clicked++; }
        }
        return clicked;
    }, thoroughSkipLabels);
    console.log(`  [fillEducationDetailsTab] ${yesNoCount} Yes/No prompts clicked${thoroughSkipLabels.length ? ` (skipped: ${thoroughSkipLabels.join(', ')})` : ''} (+${Date.now() - t0}ms)`);
    // Let the tab settle before a caller immediately checks for the
    // "Save & Next" button (advanceWizardTab) — see the isVisible() note there.
    if (yesNoCount) await page.waitForTimeout(1000);
    return { dropdowns, yesNoAnswered: yesNoCount };
}

// Emergency & Visa tab: six optional sections (Emergency Contact, Visa
// Refusal, Visa History, Serious Medical Condition, Disability, Criminal
// Offence), each its own .ev-sec wrapper (parallel to Education Details'
// .edu-sec) — and the whole tab is skippable without answering any of them
// (there's a "Skip →" button alongside "Next →"). Fills in Emergency
// Contact specifically (a normal, expected-to-be-present detail on any
// real application) with a realistic name/email/phone and submits it. The
// other five are red-flag/negative-circumstance questions (visa refusals,
// criminal record, medical conditions...) where leaving them unanswered —
// the default — is the realistic choice for a synthetic test student, so
// this does not touch them.
export async function fillEmergencyContact(page: Page): Promise<boolean> {
    const t0 = Date.now();
    const emergencyContactYes = page.locator('.ev-sec').filter({ hasText: 'Emergency Contact' })
        .getByRole('button', { name: 'Yes', exact: true });
    const clicked = await emergencyContactYes.click({ timeout: 3000 }).then(() => true).catch(() => false);
    if (clicked) {
        const firstNameInput = page.getByPlaceholder("Contact person's first name");
        const lastNameInput = page.getByPlaceholder('Last name');
        const emailInput = page.getByPlaceholder('contact@example.com');
        const phoneInput = page.getByPlaceholder('Phone number');
        if (await firstNameInput.waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false)) {
            await firstNameInput.fill(faker.person.firstName()).catch(() => {});
            await lastNameInput.fill(faker.person.lastName()).catch(() => {});
            await emailInput.fill(faker.internet.email().toLowerCase()).catch(() => {});
            await phoneInput.fill(`9${faker.string.numeric(9)}`).catch(() => {});
            const submitContactBtn = page.locator('button').filter({ hasText: /submit contact/i }).first();
            await submitContactBtn.click({ timeout: 3000 }).catch(() => {});
            await page.waitForTimeout(800);
        }
    }
    console.log(`  [fillEmergencyContact] Emergency Contact (thorough): ${clicked} (+${Date.now() - t0}ms)`);
    return clicked;
}
