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
        console.log('applications opened');
        const viewapplications=await page.getByText('View Applications',{exact:true});
        await viewapplications.click();
        console.log('view application');
        // const viewallapllications = await page.getByText('GUIDS2',{exact:true});
        const viewallapllications = await page.locator('.bi-chevron-down').nth(2);//students picking
        await viewallapllications.click();
        // await page.waitForTimeout(3000);
        //opens a new tab 
        const newtab = page.context().waitForEvent('page'); //promise 
        await page.getByTitle(/View Details/).nth(2).click();
        const newpage = await newtab; //actual value
        console.log("Accodon Details are opened");
        await newpage.getByRole('button',{name:'Comments/Reminders'}).click();
        console.log('comments opened');
        await expect(newpage).toHaveURL(/tab=comments/);
        await newpage.getByPlaceholder('Write your comment...').fill('Hello , Good Evening');
        // console.log(await newpage.locator('button').allTextContents());
        test.setTimeout(60000);
        const comment = newpage.getByRole('button',{name:'Post Comment'});
        await expect(comment).toBeVisible({timeout:15000});
        await expect(comment).toBeEnabled();
        // await comment.click({force:true});
        await expect(comment).not.toHaveText(/posting/i);
        // await newpage.pause();
        await newpage.waitForTimeout(18000);
        await comment.click({force:true});
        await newpage.waitForTimeout(3000);
        console.log('comments posted');


    }
});