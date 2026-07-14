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
    await expect(page).toHaveURL('https://qabuckingham.guideuni.com/#/dashboard');
    await page.locator('body').click();
    const course = await page.getByPlaceholder('Search Course',{exact:true}).fill('Business');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('https://qabuckingham.guideuni.com/#/programs');
    await page.waitForTimeout(4000);
});