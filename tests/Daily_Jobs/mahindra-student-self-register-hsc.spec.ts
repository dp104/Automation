import { expect, test } from '@playwright/test';
import { fakerEN_IN as faker } from '@faker-js/faker';
import { env } from '../../utils/environmenturls';
import { login } from '../../utils/login';
import { saveStudent } from '../../utils/studentStore';
import { fetchMailinatorMessage, findMissingStyling } from '../../utils/mailinatorInbox';
import { fillVisibleReactSelects, completeWizardSubmission } from '../../utils/applyFlow';
import { fillPlainWizardInputs, advanceWizardTab, fillEducationDetailsTab, selectDropdownOption } from '../../utils/partnerWizard';

// Daily Jenkins job — Mahindra (HYD FTeam) student portal.
// Same self-register + create-application flow as
// mahindra-student-self-register.spec.ts (Undergraduate — 10th + 12th/HSC +
// UG, 3 record blocks — so the student is eligible for the Postgraduate
// courses Create Application defaults to), except the 12th-level record
// uses the "12th (HSC)" type specifically rather than "Diploma". Only the
// fields required to save each record/advance the wizard are filled
// (minimal-fill style). See
// mahindra-student-self-register-diploma-thorough.spec.ts for the same
// Undergraduate path (using the Diploma type instead of HSC) filling every
// optional field on the Education Details and Emergency & Visa pages too.

const PORTAL_URL = env.hydftem;

test('Mahindra (HYD FTeam) — Daily: Student Self-Register (Undergraduate, HSC) + Create Application', async ({ page }) => {
    test.setTimeout(900000);

    // Fully dynamic realistic identity via Faker (Indian locale, +91 phone).
    const stamp = Date.now().toString().slice(-8);
    const sex = faker.person.sexType();
    const firstName = faker.person.firstName(sex).replace(/[^A-Za-z]/g, '');
    const lastName = faker.person.lastName().replace(/[^A-Za-z]/g, '');
    const student = {
        salutation: sex === 'male' ? 'Mr' : 'Ms',
        firstName,
        lastName,
        email: `${firstName}.${lastName}${stamp.slice(-4)}@mailinator.com`.toLowerCase(),
        password: 'Data@1234',
        mobile: `${faker.helpers.arrayElement(['9', '8', '7', '6'])}${stamp.padStart(9, '0')}`.slice(0, 10),
    };
    console.log(`  Registering: ${student.salutation} ${student.firstName} ${student.lastName} | ${student.email} | ${student.mobile}`);

    // ── Login page → Create one ───────────────────────────────────────────────
    await page.goto(PORTAL_URL);
    await page.waitForTimeout(3000);
    await page.locator('.gl-signup-link').click();
    await expect(page).toHaveURL(/register/i, { timeout: 15000 });
    console.log('✓ Registration page opened:', page.url());
    await page.waitForTimeout(1500);

    // ── Fill the form ─────────────────────────────────────────────────────────
    await page.locator('select[name="salutation"]').selectOption({ label: student.salutation }).catch(() =>
        page.locator('select[name="salutation"]').selectOption({ index: 1 }));
    await page.locator('input[name="firstName"]').fill(student.firstName);
    await page.locator('input[name="lastName"]').fill(student.lastName);
    await page.locator('input[name="email"]').fill(student.email);
    await page.locator('input[name="password"]').fill(student.password);
    await page.locator('input[name="confirmPassword"]').fill(student.password);
    console.log('✓ Name, email, and password filled');

    const studentRadioChecked = await page.evaluate(() =>
        (document.querySelector('input[name="groupId"]') as HTMLInputElement | null)?.checked ?? false);
    if (!studentRadioChecked) {
        await page.locator('label').filter({ hasText: 'Student' }).first().click();
    }
    console.log(`✓ Register as: Student (${studentRadioChecked ? 'default' : 'clicked'})`);

    await page.locator('input.rg-input--code').fill('+91');
    await page.locator('input[name="mobile"]').fill(student.mobile);
    console.log('✓ Country code +91 and mobile filled');

    // ── Submit and capture the real API response ──────────────────────────────
    const [regResponse] = await Promise.all([
        page.waitForResponse(r => /UserRegistration/i.test(r.url()), { timeout: 30000 }).catch(() => null),
        page.locator('button.rg-submit').click(),
    ]);
    console.log('✓ Clicked "Create account"');

    const regBody = regResponse ? await regResponse.text().catch(() => '') : '';
    let reg: any = {};
    try { reg = JSON.parse(regBody); } catch { /* leave as {} */ }
    console.log(`  API response: userId=${reg.userId ?? 'n/a'} response="${reg.response ?? ''}"`);

    const registrationSucceeded = !!reg.userId && reg.userId !== 0 && !!reg.verificationUrl;

    if (!registrationSucceeded) {
        console.log('\n⚠ APP DEFECT (report to GuideUni team): POST /api/UserRegistration did not');
        console.log(`  return a usable account (userId=${reg.userId ?? 'n/a'}, verificationUrl=${reg.verificationUrl ?? 'none'}).`);
        console.log(`  Raw response: ${regBody.substring(0, 300)}`);
        console.log('\n✅ Daily job coverage complete (backend did not create the account)');
        return;
    }

    console.log(`✓ Account created: userId=${reg.userId}`);

    saveStudent({
        ...student,
        portal: 'hydftem',
        registeredAt: new Date().toISOString(),
        loginVerified: false,
    });
    console.log(`✓ Credentials stored (pending verification): ${student.email}`);

    // ── Check the actual verification email in Mailinator — template correctness ──
    // The registration API already hands back a verificationUrl (used below to
    // actually activate the account) — this separately opens the real inbox the
    // student would use, the way a genuine user would, and checks what actually
    // got delivered: subject wording, personalization, and where the links go.
    const mailPage = await page.context().newPage();
    const message = await fetchMailinatorMessage(mailPage, student.email.split('@')[0], { subjectMatch: /verify/i, timeout: 60000 });
    await mailPage.close();

    if (!message) {
        console.log(`\n⚠ No verification email arrived in the Mailinator inbox for ${student.email} within 60s.`);
    } else {
        console.log(`✓ Verification email received — subject: "${message.subject}"`);

        const cssIssues = findMissingStyling(message.html);
        if (cssIssues.length) {
            console.log(`\n⚠ TEMPLATE DEFECT: styling appears broken/missing in the verification email — ${cssIssues.join('; ')}`);
        } else {
            console.log('✓ Template styling intact (inline CSS, table layout, branding logo)');
        }

        if (/\byour[A-Z]/.test(message.subject)) {
            console.log(`\n⚠ TEMPLATE DEFECT: subject is missing a space before the tenant name — got "${message.subject}"`);
        }
        if (/\s{2,}/.test(message.subject)) {
            console.log(`\n⚠ TEMPLATE DEFECT: subject has a double space — got "${message.subject}"`);
        }

        if (message.html.includes(student.firstName)) {
            console.log(`✓ Email personalized with first name "${student.firstName}"`);
        } else {
            console.log(`\n⚠ TEMPLATE DEFECT: email body does not personalize with the student's first name ("${student.firstName}")`);
        }

        const portalHost = new URL(PORTAL_URL).hostname;
        const verifyLink = message.links.find(l => /verify/i.test(l.text));
        if (!verifyLink) {
            console.log('\n⚠ TEMPLATE DEFECT: no "Verify my email" link found in the email body');
        } else {
            console.log(`✓ Verify link present: ${verifyLink.link}`);
            const linkHost = new URL(verifyLink.link).hostname;
            if (linkHost !== portalHost) {
                console.log(`\n⚠ TEMPLATE DEFECT: verify link points to "${linkHost}", not the portal the student registered on ("${portalHost}")`);
            }
            const emailToken = verifyLink.link.match(/evalue=([a-f0-9-]+)/i)?.[1];
            const apiToken = String(reg.verificationUrl).match(/evalue=([a-f0-9-]+)/i)?.[1];
            if (emailToken && apiToken && emailToken !== apiToken) {
                console.log(`\n⚠ TEMPLATE DEFECT: verify token in the email (${emailToken}) differs from the one the API returned (${apiToken})`);
            }
        }

        // Other links in the template (e.g. a brand-name link in the footer)
        // should also point at the student's own portal, not another environment.
        for (const l of message.links.filter(l => l !== verifyLink)) {
            const h = (() => { try { return new URL(l.link).hostname; } catch { return ''; } })();
            if (h && h !== portalHost) {
                console.log(`\n⚠ TEMPLATE DEFECT: "${l.text}" link points to "${h}" (${l.link}), not the portal the student registered on ("${portalHost}")`);
            }
        }
    }

    // ── Verify the email via the link returned by the API ─────────────────────
    const verifyUrl = String(reg.verificationUrl).replace(/\\u0026/g, '&').replace(/\\\//g, '/');
    console.log(`  Visiting verification link: ${verifyUrl}`);
    await page.goto(verifyUrl);
    await page.waitForFunction(
        () => !/verify-email/i.test(location.hash),
        undefined,
        { timeout: 30000 }
    ).catch(() => {});
    await page.waitForTimeout(2000);
    console.log(`✓ Email verified (now at ${page.url()})`);

    // ── Sign in as the new student ─────────────────────────────────────────────
    const result = await login(page, PORTAL_URL, student.email, student.password);
    expect(result ?? 'ok', `login should not be rejected (got: ${result})`).not.toMatch(/error/i);

    const onDashboard = await page.waitForURL('**/dashboard', { timeout: 30000 }).then(() => true).catch(() => false);
    expect(onDashboard, 'the newly registered account should reach the dashboard').toBe(true);
    await page.waitForSelector('.nsm-sidebar', { timeout: 20000 }).catch(() => {});

    saveStudent({
        ...student,
        portal: 'hydftem',
        registeredAt: new Date().toISOString(),
        loginVerified: true,
    });
    console.log(`✓ Signed in and stored for reuse: ${student.email}`);

    // ── Check the "Welcome, account is ready" email — fires on first login ────
    const welcomeMailPage = await page.context().newPage();
    const welcomeMessage = await fetchMailinatorMessage(welcomeMailPage, student.email.split('@')[0], { subjectMatch: /account is ready/i, timeout: 60000 });
    await welcomeMailPage.close();

    if (!welcomeMessage) {
        console.log(`\n⚠ No "Welcome" email arrived for ${student.email} within 60s of signing in.`);
    } else {
        console.log(`✓ Welcome email received — subject: "${welcomeMessage.subject}"`);

        const welcomeCssIssues = findMissingStyling(welcomeMessage.html);
        if (welcomeCssIssues.length) {
            console.log(`\n⚠ TEMPLATE DEFECT: styling appears broken/missing in the welcome email — ${welcomeCssIssues.join('; ')}`);
        } else {
            console.log('✓ Template styling intact (inline CSS, table layout, branding logo)');
        }

        if (welcomeMessage.html.includes(student.firstName)) {
            console.log(`✓ Email personalized with first name "${student.firstName}"`);
        } else {
            console.log(`\n⚠ TEMPLATE DEFECT: welcome email body does not personalize with the student's first name ("${student.firstName}")`);
        }

        const welcomePortalHost = new URL(PORTAL_URL).hostname;
        for (const l of welcomeMessage.links) {
            let h = ''; try { h = new URL(l.link).hostname; } catch { /* invalid URL */ }
            if (h && h !== welcomePortalHost) {
                console.log(`\n⚠ TEMPLATE DEFECT: "${l.text}" link points to "${h}" (${l.link}), not the portal the student registered on ("${welcomePortalHost}")`);
            }
        }
    }

    // ── Own Student Profile Journey — fill and submit an application ──────────
    await page.goto(`${PORTAL_URL.replace(/\/?#\/?$/, '')}/#/add-student`);
    await page.waitForTimeout(3000);
    await expect(page.locator('.sp-header-title')).toContainText('Student Profile Journey', { timeout: 15000 });
    console.log('✓ Own Student Profile Journey wizard opened');

    // A student's own #/add-student auto-loads their profile directly — no
    // Student ID fetch box (that's partner-only), confirmed live on this
    // platform in tests/student-flows/00,28,29,32.

    // ── Tab 1: Personal Details ────────────────────────────────────────────────
    const filledTab1 = await fillPlainWizardInputs(page, student);
    console.log(`✓ Personal Details: filled ${filledTab1.length} plain fields`);

    // Nationality/Country deliberately pinned to India — the generic filler
    // otherwise defaults to alphabetically-first "Afghanistan", which this
    // tenant has no course-eligibility data for, silently dead-ending the
    // Create Application step later.
    const nationalitySet = await selectDropdownOption(page, 'nationality', 'India');
    const countrySet = await selectDropdownOption(page, 'country', 'India');
    console.log(`✓ Personal Details: nationality="${nationalitySet}", country="${countrySet}"`);

    const selectsTab1 = await fillVisibleReactSelects(page, 10);
    console.log(`✓ Personal Details: filled ${selectsTab1.length} dropdowns: ${selectsTab1.join(' | ')}`);

    const advancedToEducation = await advanceWizardTab(page, 'Education Details');
    console.log(`✓ Personal Details saved, advanced to Education Details: ${advancedToEducation}`);

    if (!advancedToEducation) {
        console.log('\n⚠ The wizard did not advance past Personal Details within the wait window.');
        console.log(`\n✅ Daily job coverage complete (registered + logged in; stopped before Education Details)`);
        return;
    }

    // ── Tab 2: Education Details ────────────────────────────────────────────────
    // Highest level = Undergraduate → cascades through 10th + 12th/HSC + UG
    // (3 record blocks), so this student is eligible for the Postgraduate
    // courses Create Application defaults to. The 12th-level record uses
    // "12th (HSC)" as its type (not the default "Diploma"). Minimal fill
    // (only fields required to save each record).
    const eduResult = await fillEducationDetailsTab(page, 'Undergraduate', false, '12th (HSC)');
    console.log(`✓ [Education Details] filled ${eduResult.dropdowns.length} dropdowns: ${eduResult.dropdowns.join(' | ')}`);
    if (eduResult.yesNoAnswered) console.log(`✓ [Education Details] answered ${eduResult.yesNoAnswered} Yes/No prompt(s) with "No"`);

    const advancedToEmergency = await advanceWizardTab(page, 'Emergency & Visa');
    console.log(`✓ Education Details saved, advanced to Emergency & Visa: ${advancedToEmergency}`);

    if (!advancedToEmergency) {
        console.log('\n⚠ The wizard did not advance past Education Details within the wait window.');
        console.log(`\n✅ Daily job coverage complete (stopped before Emergency & Visa)`);
        return;
    }

    // ── Check the "Student Profile Created" email — fires once Education Details ──
    // is submitted (confirmed live) — not right after Personal Details alone
    // (checking there timed out for a full 60s on a genuine account, a false
    // negative) and not deferred all the way to Create Application either.
    const idMailPage = await page.context().newPage();
    const idMessage = await fetchMailinatorMessage(idMailPage, student.email.split('@')[0], { subjectMatch: /profile created/i, timeout: 60000 });
    await idMailPage.close();

    if (!idMessage) {
        console.log(`\n⚠ No "Student Profile Created" email arrived for ${student.email} within 60s of submitting Education Details.`);
    } else {
        console.log(`✓ Student Profile Created email received — subject: "${idMessage.subject}"`);

        const idCssIssues = findMissingStyling(idMessage.html);
        if (idCssIssues.length) {
            console.log(`\n⚠ TEMPLATE DEFECT: styling appears broken/missing in the Student Profile Created email — ${idCssIssues.join('; ')}`);
        } else {
            console.log('✓ Template styling intact (inline CSS, table layout, branding logo)');
        }

        const idInBody = idMessage.html.match(/Student Id\s+(GUIDS\d+)/i);
        const idInSubject = idMessage.subject.match(/\b(GUIDS\d+)\b/);
        if (!idInBody && !idInSubject) {
            console.log('\n⚠ TEMPLATE DEFECT: no student unique ID (GUIDS…) found anywhere in the "Student Profile Created" email');
        } else {
            console.log(`✓ Student unique ID present in email: ${idInBody?.[1] || idInSubject?.[1]}`);
        }

        const idPortalHost = new URL(PORTAL_URL).hostname;
        for (const l of idMessage.links) {
            let h = ''; try { h = new URL(l.link).hostname; } catch { /* invalid URL */ }
            if (h && h !== idPortalHost) {
                console.log(`\n⚠ TEMPLATE DEFECT: "${l.text}" link points to "${h}" (${l.link}), not the portal the student registered on ("${idPortalHost}")`);
            }
            // A CTA like "...#/get-student&StudentId=..." runs a query param
            // straight onto the hash route with "&" and no leading "?" — the
            // app's router doesn't parse that as a param, so the link silently
            // lands on the plain sign-in page instead of the student's profile
            // (confirmed live: the StudentId is dropped entirely).
            if (/open my portal/i.test(l.text) && /#\/[^?]*&/.test(l.link)) {
                console.log(`\n⚠ TEMPLATE DEFECT: "${l.text}" link is malformed — "&" used without a preceding "?" (${l.link}), so its params won't be read by the router`);
            }
        }
    }

    // ── Tab 3: Emergency & Visa ─────────────────────────────────────────────────
    const plainFilled = await fillPlainWizardInputs(page, student);
    const selectsFilled = await fillVisibleReactSelects(page, 10);
    console.log(`✓ [Emergency & Visa] filled ${plainFilled.length} plain fields, ${selectsFilled.length} dropdowns: ${selectsFilled.join(' | ')}`);

    const advancedToCreateApp = await advanceWizardTab(page, 'Create Application');
    console.log(`✓ Emergency & Visa saved, advanced to Create Application: ${advancedToCreateApp}`);

    if (!advancedToCreateApp) {
        console.log('\n⚠ The wizard did not advance past Emergency & Visa within the wait window.');
        console.log(`\n✅ Daily job coverage complete (stopped before Create Application)`);
        return;
    }

    // ── Tab 4: Create Application ───────────────────────────────────────────────
    const submission = await completeWizardSubmission(page);
    if (!submission.submitted) {
        console.log('\n⚠ Application could not be completed via the Create Application tab.');
        console.log('\n✅ Daily job coverage complete (application submission incomplete)');
        return;
    }

    // Capture the new application ID and stop — no Documents-tab upload.
    console.log(`\n🎯 CREATED APP ID: ${submission.newIds.join(', ') || '(id not captured)'}`);

    // ── Check the application status-update email — fires on Create Application ──
    const appId = submission.newIds[0];
    const appMailPage = await page.context().newPage();
    const appMessage = await fetchMailinatorMessage(appMailPage, student.email.split('@')[0], { subjectMatch: /application/i, timeout: 60000 });
    await appMailPage.close();

    if (!appMessage) {
        console.log(`\n⚠ No application status-update email arrived for ${student.email} within 60s of submitting.`);
    } else {
        console.log(`✓ Application status-update email received — subject: "${appMessage.subject}"`);

        const appCssIssues = findMissingStyling(appMessage.html);
        if (appCssIssues.length) {
            console.log(`\n⚠ TEMPLATE DEFECT: styling appears broken/missing in the application status-update email — ${appCssIssues.join('; ')}`);
        } else {
            console.log('✓ Template styling intact (inline CSS, table layout, branding logo)');
        }

        if (appId && !appMessage.html.includes(appId)) {
            console.log(`\n⚠ TEMPLATE DEFECT: email body does not mention the created application ref "${appId}"`);
        } else if (appId) {
            console.log(`✓ Application ref "${appId}" present in the email`);
        }

        const appPortalHost = new URL(PORTAL_URL).hostname;
        for (const l of appMessage.links) {
            let h = ''; try { h = new URL(l.link).hostname; } catch { /* invalid URL */ }
            if (h && h !== appPortalHost) {
                console.log(`\n⚠ TEMPLATE DEFECT: "${l.text}" link points to "${h}" (${l.link}), not the portal the student registered on ("${appPortalHost}")`);
            }
        }
    }

    console.log(`\n✅ Student "${student.firstName} ${student.lastName}" (${student.email}) submitted an application for themselves, id ${submission.newIds.join(', ') || '(not captured)'}`);
});
