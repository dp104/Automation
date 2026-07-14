import { expect, test } from '@playwright/test';
import { login } from '../../utils/login'
import { env } from '../../utils/environmenturls';
test('Dashboard test', async({page}) => {
    test.setTimeout(60000); // 60 seconds

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
    console.log("View student Information page is opened");await page.waitForTimeout(4000);
    const searchbox = await page.locator('input[type="text"][class="search-bar"][placeholder="Search for Name, Email and Mobile.."]');
    await searchbox.click();
    await searchbox.fill('Johny'); //student id are given from here
    await page.locator('.student-status-badge').first().click();
    const status = await page.locator('.student-status-badge').first();
    await expect(status).not.toHaveText(/Checking/i, {timeout: 30000});
    const status1 = await status.innerText();

    console.log("That Student profile status is ",status1);
    }else{
        console.log('Something went wrong');
    }
        
});
 