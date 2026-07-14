import { expect, test } from '@playwright/test';
import { login } from '../../utils/login'
import { env } from '../../utils/environmenturls';
test('Dashboard test', async({page}) => {
    test.setTimeout(120000);

    const result1 = await login(page,env.hydftem,'hydfteam@mailinator.com','Data@12345');
    if (result1 === 'email error' || result1 === 'password error') {
    console.log('Login failed');
    }else{
        console.log('sucesss');
    }    
    if (await page.url().includes('dashboard')){
        await page.locator('body').click();
        console.log('menu opening');
        await page.locator('.menu-toggle-icon').click();
        const menu =await page.getByText('Application',{exact:true});
        await menu.click();
        const viewapplications=await page.getByText('View Applications',{exact:true});
        await viewapplications.click();
        console.log('view applications are opened');
        await page.waitForTimeout(4000);
        const searchbox = await page.locator('input[type="text"][placeholder="Search by ID, Name, Email, Mobile, Passport..."][class="common-field"]');
        await searchbox.click();
        await searchbox.fill('GUIDS127'); //student ids 
        await page.getByText('GUIDS127', { exact: true }).click(); // same student id 
        await page.locator('.create-new-application-click').click();

        await page.getByRole('combobox').nth(1).click();
        await page.waitForTimeout(3000);
        await page.keyboard.type('United'); //Institution country dropdown
        await page.getByRole('option',{name:'United Kingdom'}).click();

         await page.getByRole('combobox').nth(2).click();
        await page.waitForTimeout(3000);
        await page.keyboard.type('Engl'); //Institution State dropdown
        await page.getByRole('option',{name:'England'}).click();

         await page.getByRole('combobox').nth(3).click();
        await page.waitForTimeout(3000);
        await page.keyboard.type('London'); //Institution city dropdown
        await page.getByRole('option',{name:'London'}).click();

         await page.getByRole('combobox').nth(4).click();
        await page.waitForTimeout(3000);
        await page.keyboard.type('Undergra'); //Institution qualification dropdown
        await page.getByRole('option',{name:'Undergraduate'}).click();

        await page.getByRole('combobox').nth(5).click();
        await page.waitForTimeout(3000);
        await page.keyboard.type('Sept'); //Institution month dropdown
        await page.getByRole('option',{name:'September'}).click();

        await page.getByRole('combobox').nth(6).click();
        await page.waitForTimeout(3000);
        await page.keyboard.type('2026'); //Institution year dropdown
        await page.getByRole('option',{name:'2026'}).click();

        await page.getByRole('combobox').nth(7).click();
        await page.waitForTimeout(3000);
        await page.keyboard.type("City"); //Institution year dropdown
        await page.getByRole('option',{name:"City St George's, University of London"}).click();

        await page.getByRole('combobox').nth(8).click();
        await page.keyboard.type('Business with Finance'); //Institution year dropdown
        await page.waitForTimeout(3000);
        await page.getByRole('option', { name: 'BSc (Hons) Business with Finance' }).nth(0).click();

        await page.getByText('Submit',{exact:true}).click();
        await page.waitForTimeout(10000);
    }
});