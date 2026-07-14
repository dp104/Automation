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
        const viewallapllications = await page.getByText('GUIDS2',{exact:true});
        await viewallapllications.click();
        await page.waitForTimeout(3000);
        //opens a new tab 
        const newtab = page.context().waitForEvent('page'); //promise 
        await page.getByTitle(/View Details/).first().click();
        const newpage = await newtab; //actual value
        console.log("Accodon Details are opened");
        await newpage.getByRole('button',{name:'Comments/Reminders'}).click();
        console.log('comments opened');
        await expect(newpage).toHaveURL('https://qabuckingham.guideuni.com/#/application?appId=GUIDA22&companyId=8&branchId=0&tab=comments');
        await newpage.getByText('Create Reminder',{exact:true}).click();
        await newpage.getByPlaceholder('Enter title (max 999 characters only)').fill("Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum")
        // console.log(await newpage.locator('button').allTextContents());
        await newpage.locator('.date-input-field').first().click();
        await newpage.getByText('14').click();
        await newpage.getByPlaceholder('DD-MM-YYYY HH:MM AM/PM').nth(1).click();
        await newpage.getByText('14').click();
        test.setTimeout(60000);
        const remainderbutton = await newpage.getByText('Save Event',{exact:true});
        await expect(remainderbutton).toBeVisible({timeout:15000});
        await expect(remainderbutton).toBeEnabled();
        await expect(remainderbutton).not.toHaveText(/saving|loading/i);
        await newpage.waitForTimeout(6000);
        await remainderbutton.click({force:true});
        console.log('Remainder craeted');


    }
});