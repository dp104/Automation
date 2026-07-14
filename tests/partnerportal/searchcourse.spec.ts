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
        await page.getByText('Universities/Courses',{exact:true}).click();
        await page.getByText('Search-Course',{exact:true}).click();
        await page.waitForTimeout(3000);
        console.log('Search course page is opened');
        const country = await page.getByRole('button', { name: "Select Nationality"});
        await country.click();
        await country.fill('Ind');     
        await page.locator('[role="option"]').filter({ hasText: 'India' }).nth(1).click();  
    }
});
