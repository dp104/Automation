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
        // console.log('menu opening');
        await page.locator('.menu-toggle-icon').click();
        await page.locator('.menu').getByText('Partner',{exact:true}).click();
        await page.getByText('Partner Users',{exact:true}).click();
        await page.waitForTimeout(4000);
        console.log('Partner users page is opened');
    }
});