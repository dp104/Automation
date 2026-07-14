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
        console.log('applications opened');
        const viewapplications=await page.getByText('View Applications',{exact:true});
        await viewapplications.click();
        console.log('view application');
        const viewallapllications = await page.getByText('GUIDS17',{exact:true}); //student id's
        await viewallapllications.click();
        // await page.waitForTimeout(3000);
        //opens a new tab 
        const newtab = page.context().waitForEvent('page'); //promise 
        // await page.getByTitle(/View Details/).first().click();
        await page.getByTitle(/View Details/).nth(4).click();  //application id's
        const newpage = await newtab; //actual value
        console.log("Accodon Details are opened");
        await newpage.getByRole('button',{name:'University Communication'}).click();
        // await expect(newpage).toHaveURL('https://qabuckingham.guideuni.com/#/application?appId=GUIDA31&companyId=8&branchId=0&tab=documents');
        await newpage.url().includes('&companyId=8&branchId=0&tab=University_Communication');
        await newpage.waitForTimeout(3000);
        console.log('University Communication tab are open');
    }
});