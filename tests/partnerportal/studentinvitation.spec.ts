import { expect, test } from '@playwright/test';
import { login } from '../../utils/login'
import { env } from '../../utils/environmenturls';
test('Dashboard test', async({page}) => {
    test.setTimeout(60000);
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
    await page.getByText('View Student Information',{exact:true}).click();
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/get-student/);
    console.log("View student Information page is opened");
    await page.waitForTimeout(4000);
    await page.locator('button[title="Go to last page"]').click();
    await page.waitForTimeout(3000);
    await page.locator('.fa-paper-plane').nth(6).click(); //S224
    await page.waitForTimeout(3000);
    }else{
        console.log('Something went wrong');
    }
        
});
 