import { expect, test } from '@playwright/test';
import { login } from '../../utils/login'
import { env } from '../../utils/environmenturls';
test('smartsearch', async({page}) => {
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
        await page.getByText('Smart Search',{exact:true}).click();
        await page.waitForTimeout(3000);
        console.log('smartsearch page is opened');
        const country = await page.locator('input[role="combobox"]').first();
        await country.click();
        await country.fill('Ind');
        await page.locator('[role="option"]').filter({ hasText: 'India' }).click();
        const country2 = await page.locator('input[role="combobox"]').nth(1);
        await country2.click();
        await country2.fill('United');
        await page.locator('[role="option"]').filter({ hasText: 'United Kingdom' }).click();
        const level = await page.getByRole('combobox').nth(2);
        await level.click();
        await level.fill('Pos');
        await page.locator('[role="option"]').filter({ hasText: 'Postgraduate' }).click();
        await page.getByRole('button',{name:'Search Courses'}).click();
        await page.waitForTimeout(4000);
        await page.getByText('Apply Now', { exact: true }).nth(2).click();// applying the 9th card course from the course page
        await page.waitForTimeout(4000);
        await page.locator('tr:has-text("GUIDS190") >> text=Select').click();
        await page.locator('.tab', {hasText: 'Personal Details'}).click();
        await page.waitForTimeout(5000);
        await page.locator('.tab', {hasText: 'Education'}).click();
        await page.waitForTimeout(5000);
        await page.locator('.tab', {hasText: 'Create Application'}).click();
        await page.waitForTimeout(5000);
        await page.getByRole('button', { name: 'Save' }).click();
        await page.waitForTimeout(4000);
        await page.getByRole('button', { name: 'Save & Next' }).click();
        await page.waitForTimeout(3000);
        await page.locator('.application-selection-section',{hasText:'Select Applications for Document Upload'}).click(); //Dropdown opens
        // await page.locator('.app-id', { hasText: 'GUIDA265' }).locator('xpath=ancestor::div[contains(@class,"application-option-info")]').click();
        const lastApp = page.locator('.dropdown-option').last();
        await lastApp.scrollIntoViewIfNeeded();
        await lastApp.locator('input[type="checkbox"]').nth(-1).check(); //application id checked
        await page.locator('body').click();
        await page.locator('.css-hlgwow',{hasText:'Select Document Type'}).click();          //documents dropdown are opened
        await page.getByText('Secondary School Certificate (10th)',{exact:true}).first().click();
        // await page.getByRole('button',{ name: 'Select Document'}).click();
        const filePath = '/Users/flyurdream/Automation Testing/First/files/Dummy_Pdf.pdf';    // 10th class pdf
        await page.locator('input[type="file"]').setInputFiles(filePath);  //file uploaded form here 

        await page.locator('.css-hlgwow',{hasText:'Secondary School Certificate (10th)'}).first().click(); //dropdown clicks
        await page.getByText('Passport',{exact:true}).first().click();  //passport selects
        // await page.getByRole('button',{ name: 'Select Document'}).click();
        const filePath1 = '/Users/flyurdream/Automation Testing/First/files/dummy.docx'; // passport uploaded
        await page.locator('input[type="file"]').setInputFiles(filePath1);

        await page.locator('.css-hlgwow',{hasText:'Passport'}).first().click(); //dropdown clicks
        await page.getByText('Higher Secondary Certificate (12th)',{exact:true}).first().click();  //12 select from the dropdown
        const filePath2 = '/Users/flyurdream/Automation Testing/First/files/HYDFTeam_logo.png'; 
        await page.locator('input[type="file"]').setInputFiles(filePath2); // 12 th class document are uploaded 
        await page.locator('.css-hlgwow',{hasText:'Higher Secondary Certificate (12th)'}).first().click();
        await page.getByText('CV / Resume',{exact:true}).first().click();
        const filePath3 = '/Users/flyurdream/Automation Testing/First/files/Dummy_Pdf 2.pdf';  //resume uploaded
        await page.locator('input[type="file"]').setInputFiles(filePath3);
        await page.locator('.css-hlgwow',{hasText:'CV / Resume'}).first().click();
        await page.getByText('Visa History',{exact:true}).first().click();
        const filePath4 = '/Users/flyurdream/Automation Testing/First/files/dummy 2.docx'; 
        await page.locator('input[type="file"]').setInputFiles(filePath4);
        await page.getByRole('button',{name :'📤 Upload Document'}).click();
        await page.waitForTimeout(10000);
        console.log("documents uploaded sucessfully");
        }else{
            console.log("Something went wrong");
        }

});