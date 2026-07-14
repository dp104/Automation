import { test, expect } from '@playwright/test';

test('Allportalschecking', async ({ page, context }) => {

    test.setTimeout(120000);

    // =========================
    // flyurdream.com
    // =========================

    await page.goto('https://flyurdream.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 120000
    });

    await page.getByRole('link', { name: 'Login' }).click();

    try {

        await expect(page).toHaveURL('https://crm.flyurdream.com/');

        console.log('flyurdream.com CMS is opened');

    } catch {

        console.log('flyurdream.com CMS is failed');
    }

    const login = page.getByRole('button', {
        name: 'Sign In'
    });

    try {

        await expect(login).toBeVisible({
            timeout: 30000
        });

        console.log('crm.flyurdream.com is opened');

    } catch {

        console.log('crm.flyurdream.com logo not found');
    }

    // =========================
    // guideuni.com
    // =========================

    await page.goto('https://guideuni.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 120000
    });

    const [newpage] = await Promise.all([
        context.waitForEvent('page'),
        page.getByRole('link', { name: 'Login' }).click()
    ]);

    await newpage.waitForLoadState('domcontentloaded');

    try {

        await expect(newpage).toHaveURL('https://crm.guideuni.com/');

        console.log('guideuni.com CMS is opened');

    } catch {

        console.log('guideuni.com CMS is failed');
    }

    const loginbutton = newpage.getByRole('button', {
        name: 'Sign In'
    });

    try {

        await expect(loginbutton).toBeVisible({
            timeout: 30000
        });

        console.log('crm.guideuni.com is opened');

    } catch {

        console.log('crm.guideuni.com logo not found');
    }

});