import { expect, test } from '@playwright/test';
import { login } from '../../utils/login'
import { env } from '../../utils/environmenturls';
test('Dashboard test', async({page}) => {
    test.setTimeout(120000); // 60 seconds

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
    await page.getByText('Add Student Information',{exact:true}).click();
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/add-student/);
    console.log("Add student Information page is opened");
    
    await page.locator('input[type="text"][id="searchInput"][placeholder="Enter Unique ID, Email or Passport Number"]').fill('GUIDS126'); //guids11,190,
    await page.getByRole('button', { name: 'Fetch Data' }).click();
    await page.waitForTimeout(4000);
    await page.locator('.tab', {hasText: 'Create Application'}).click();
    await page.waitForTimeout(5000);
    await page.getByRole('button',{name: 'Add New Application'}).click();
    await page.locator('.css-1fls9q2-control').click();
    await page.locator('[role="option"]').filter({ hasText: 'United Kingdom' }).click(); // appliying country from here
    await page.locator('.css-1fls9q2-control',{hasText:'State'}).click();
    await page.locator('[role="option"]').filter({ hasText: 'England' }).click(); //appliying sate from here
    await page.locator('.css-1fls9q2-control',{hasText:'City'}).click();
    await page.locator('[role="option"]').filter({ hasText: 'London' }).click(); //city
    await page.locator('.css-1fls9q2-control',{hasText:'Academic Level'}).click(); //academic level
    await page.locator('[role="option"]').filter({ hasText: 'Pre-Masters' }).click();
    await page.locator('.css-hlgwow',{hasText:'Intake Month'}).click(); //intake month
    await page.locator('[role="option"]').filter({ hasText: 'May' }).click();
    await page.locator('.css-hlgwow',{hasText:'University'}).click();
    await page.locator('[role="option"]').filter({ hasText: 'Northumbria University London' }).click(); //university
    await page.locator('.css-hlgwow',{hasText:'Search Course'}).click();
    await page.waitForTimeout(3000);
    await page.keyboard.type('MSc Digital Marketing'); 
    await page.locator('[role="option"]').filter({ hasText: 'MSc Digital Marketing'}).first().click();
    await page.getByRole('button', { name: 'Save' }).click();
    console.log("Application is saved sucessfully");
    await page.waitForTimeout(3000);
    await page.getByRole('button', { name: 'Save & Next',}).click();

    // 145 - 150 these for the only search by studentid and upload that documents 
    // await page.locator('input[type="text"][id="searchInput"][placeholder="Enter Unique ID, Email or Passport Number"]').fill('GUIDS190'); //guids11,190,
    // await page.getByRole('button', { name: 'Fetch Data' }).click();
    // await page.locator('.tab', {hasText: 'Create Application'}).click();
    // await page.waitForTimeout(5000);
    // await page.locator('.tab', {hasText: 'Documents'}).click();


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
    await page.getByRole('button',{name :'📤 Upload Document'}).click();
    await page.waitForTimeout(10000);
    console.log("documents uploaded sucessfully");
    }else{
        console.log('Something went wrong');
    }
        
});
 