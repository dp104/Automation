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
        await page.getByText('Universities/Courses',{exact:true}).click();
        await page.getByText('Universities',{exact:true}).click();
        await page.waitForTimeout(3000);
        console.log('Universities page is opened');
    }
});