import { Page } from '@playwright/test';
export  async function login(page:Page,url:string,email:string,password:string) {
    await page.goto(url);
    await page.locator('[name="email"]').fill(email);
    await page.locator('[name="password"]').fill(password);
    await page.getByText('Sign In',{exact:true}).click();
    await page.waitForTimeout(3000);
    const errorlogin = await page.locator('.error-modern');
    if (await errorlogin.isVisible()){
        const errortext = await errorlogin.innerText();
        if (errortext.includes('Email not found')){
            console.log('Email id Not Found');
            return 'email error' ;
        }else{
            console.log('Incorrect Password');
            return 'password error';
        }
    }
    const forcelogout = page.locator('.force-checkbox');
    if (await forcelogout.isVisible({ timeout: 2000 }).catch(() => false)){
        await forcelogout.click();
        await page.waitForTimeout(500);
        console.log('Session conflict handled');
        await page.locator('.login-btn-modern').click();
        await page.waitForURL('**/dashboard', { timeout: 15000 });
        console.log('Dashboard open');
    }
};