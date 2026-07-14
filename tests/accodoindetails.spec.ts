import { expect, test } from '@playwright/test';
import { login } from '../utils/login'
import { env } from '../utils/environmenturls';
test('Dashboard test', async({page}) => {

    const result1 = await login(page,env.buckingportal,'karthik@gmail.com','Data@1234');
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
        console.log('applications opened');
        // await page.getByTitle(/View Details/).first().click();
        // await page.getByTitle(/View Details/).nth(3).click();
        // await page.waitForTimeout(3000);
        const viewallapllications = await page.locator('.bi-chevron-down').nth(2);
        await viewallapllications.click();
        // await page.waitForTimeout(3000);
        //opens a new tab 
        const newtab = page.context().waitForEvent('page'); //promise 
        await page.getByTitle(/View Details/).nth(2).click();
        const newpage = await newtab; //actual value
        console.log("Accodon Details are opened");
    }
});