import { expect, test } from '@playwright/test';
import { login } from '../../utils/login'
import { env } from '../../utils/environmenturls';
test('Dashboard test', async({page}) => {

    const result1 = await login(page,env.hydftem,'elonmusk@gmail.com','Data@12345');
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
    }
});