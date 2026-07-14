import {test,expect} from '@playwright/test';
test('Mytest', async ({page}) => {
    await page.goto("https://qabuckingham.guideuni.com/#/");
    const email = 'karthik@gmail.com';
    const password = 'Data@1234';
    await page.locator('[name="email"]').fill(email);
    await page.locator('[name="password"]').fill(password);
    await page.getByText('Sign In',{exact:true }).click();
    await page.waitForTimeout(3000);
    const errorlogin=await page.locator('.error-modern');
    if (await errorlogin.count()>0){
        const errortext = await errorlogin.innerText();
        if (errortext.includes('Email not found')){
            console.log('Email id Not Found');
            return
        }else{
            console.log('Incorrect Password');
            return
        }
    }
    const forcelogout=await page.getByText('Force logout from all other devices');
    if (await forcelogout.count() > 0){
        forcelogout.click();
        console.log('Session conflict sucessfull');
        await page.getByText('Sign In',{exact:true }).click();
        await page.waitForURL('**/dashboard');
        console.log('Dashboard open');
    }
    if (await page.url().includes('dashboard')){
        await page.locator('body').click();
        await page.locator('.nav-profile-div').click();
        await page.getByText('View Profile').click({force:true});
        await page.waitForURL('**/get-profile');
        console.log('profile page opens');
        const lastlogin = await page.locator('[title*="Your last login"]');
        await lastlogin.waitFor();
        const last_login =await lastlogin.innerText(); 
        console.log(last_login);
        await page.getByTitle(/karthik vasa/).click();
        await page.locator('.nav-sign-btn').click();
        if (page.url().includes('https://qabuckingham.guideuni.com/#/')){
            console.log('Logged out Sucessfully');
        }
        
    }
});