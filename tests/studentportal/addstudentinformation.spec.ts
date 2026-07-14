import { expect, test } from '@playwright/test';
import { login } from '../../utils/login'
import { env } from '../../utils/environmenturls';
test('Dashboard test', async({page}) => {
    test.setTimeout(120000); // 60 seconds

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
    await page.getByText('Add Student Information',{exact:true}).click();
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/add-student/);
    console.log("Add student Information page is opened");
    //Form open 
    await page.locator('[name="firstName"]').fill('Prakash');
    await page.locator('[name="lastName"]').fill('bhanu');
    await page.locator('[name="email"]').fill('prakashbhanu@gmail.com');
    const gender = await page.getByRole('combobox').nth(0); //dropdown opens 
    await gender.click();
    await page.getByRole('option',{name:'Male',exact:true}).click();
    // await page.screenshot({ path: 'screenshot.png', fullPage: true });
    await page.getByPlaceholder('DD/MM/YYYY').first().fill('16/09/2004');
    await page.locator('body').click();
    await page.getByRole('combobox').nth(1).click();
    await page.getByRole('option',{name:'Unmarried',exact:true}).click();
    await page.getByRole('combobox').nth(2).click();
    await page.waitForTimeout(3000);
    await page.getByText('India',{exact:true}).click();
    await page.locator('input[type="tel"][name="phoneNumber"][placeholder="Enter Phone Number"]').fill('9550768833');
    // open country dropdown
    const country = await page.getByRole('combobox').nth(3);
    await country.click();
    await country.fill('Ind');
    await page.locator('[role="option"]').filter({ hasText: 'India' }).nth(1).click();
    await page.locator('input[type="text"][name="passportNo"][placeholder="Enter Passport Number"]').fill('A984034');
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(1).fill('09/09/2024');
    await page.getByRole('combobox').nth(4).click();
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(2).fill('04/09/2034');
    await page.locator('body').click();
    await page.locator('input[type="text"][name="addressLine1"][placeholder="Enter Address Line 1"]').fill('Kphb , Kukatpally');
    const country2 = await page.getByRole('combobox').nth(4);
    await country2.click();
    await country2.fill('Ind');
    await page.locator('[role="option"]').filter({ hasText: 'India' }).nth(1).click();
    const state =await page.getByRole('combobox').nth(5);
    await state.click();
    await state.fill('Tel');
    await page.locator('[role="option"]').filter({ hasText: 'Telangana' }).first().click();
    await page.getByRole('combobox').nth(6).click();
    await page.getByText('Hyderabad',{exact:true}).click();
    await page.locator('input[type="text"][name="postalCode"][placeholder="Enter Postal Code"]').fill('500072');
    await page.getByRole('button',{name:'Save & Next '}).click();
    await page.waitForTimeout(3000);
    // await page.screenshot({ path: 'screenshot.png', fullPage: true });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('.css-1bx2lkn-control').first().click();
    // await expect(page.getByText('Secondary Education')).toBeVisible();
    // await page.getByText('Secondary Education (10th)',{exact:true}).click();
    await page.getByText('Secondary Education (10th)',{exact:true}).click();
    await page.locator('.css-1bx2lkn-control').click();
    await page.locator('[role="option"]').filter({ hasText: 'India' }).nth(1).click();
    await page.locator('input[type="text"][name="schoolName"][placeholder="Enter Board Name"]').fill('Secondary School of education');
    await page.locator('input[type="text"][name="courseName"][placeholder="Enter specialization"]').first().fill('10th class');
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(3).fill('25/06/2018');
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(4).fill('12/04/2019');
    await page.locator('input[type="radio"][name="selectedOption-0"][value="gpa"]').click();
    await page.locator('input[type="tel"][step="0.1"][min="0"][max="10"][name="gpa"][placeholder="E.g., 7.50 or 10.00"]').fill('8.9');
    await page.getByRole('button',{name:'Save',exact:true});
    await page.getByRole('button', { name: 'Add School' }).click(); //secondary board
    await page.locator('.css-1bx2lkn-control').first().click();
    // await expect(page.getByText('Secondary Education')).toBeVisible();
    // await page.getByText('Secondary Education (10th)',{exact:true}).click();
    await page.getByText('Higher Education (12th)',{exact:true}).click();
    await page.locator('.css-1bx2lkn-control').click();
    await page.locator('[role="option"]').filter({ hasText: 'India' }).nth(1).click();
    await page.getByRole('combobox').last().click();
    await page.locator('[role="option"]').filter({ hasText: 'Andhra Pradesh Board of Intermediate Education' }).click();
    await page.locator('input[type="text"][name="courseName"][placeholder="Enter specialization"]').nth(1).fill('MPC');
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(3).fill('15/07/2019');
    await page.locator('body').click();
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(4).fill('11/04/2021');
    await page.locator('body').click();
    await page.locator('input[type="radio"][name="selectedOption-1"][value="percentage"]').click();
    await page.locator('input[type="tel"][name="percentage"][placeholder="Enter Percentage"]').fill('72%');
    await page.getByRole('button',{name:'Save',exact:true});
    await page.getByRole('button', { name: 'Add School' }).click();//undergraduate board
    await page.locator('.css-1bx2lkn-control').first().click();
    await page.getByText('Undergraduate',{exact:true}).click();
    await page.locator('.css-1bx2lkn-control').click();
    await page.locator('[role="option"]').filter({ hasText: 'India' }).nth(1).click();
    await page.getByRole('combobox').last().click();
    await page.locator('[role="option"]').filter({ hasText: 'Jawaharlal Nehru Technological University, Kakinada' }).click();
    await page.locator('input[type="text"][name="courseName"][placeholder="Enter specialization"]').nth(2).fill('AIML');
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(3).fill('05/06/2021');
    await page.locator('body').click();
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(4).fill('21/03/2025');
    await page.locator('body').click();
    await page.locator('input[type="radio"][name="selectedOption-2"][value="gpa"]').click();
    await page.locator('input[type="tel"][step="0.1"][min="0"][max="10"][name="gpa"][placeholder="E.g., 7.50 or 10.00"]').fill('8.0');
    await page.getByRole('button',{name:'Save',exact:true});
    await page.locator('input[type="radio"][name="hasProficiencyScores"][value="no"]').click();
    await page.locator('input[type="radio"][name="hasWorkExperience"][value="no"]').click();
    await page.getByRole('button', { name: 'Save & Next' }).click();
    await page.waitForTimeout(4000);
    await page.getByRole('button',{name:'Skip This Section'}).click();
    await page.locator('.css-1fls9q2-control').click();
    await page.locator('[role="option"]').filter({ hasText: 'United Kingdom' }).click(); // appliying country from here
    await page.locator('.css-1fls9q2-control',{hasText:'State'}).click();
    await page.locator('[role="option"]').filter({ hasText: 'England' }).click(); //appliying sate from here
    await page.locator('.css-1fls9q2-control',{hasText:'City'}).click();
    await page.locator('[role="option"]').filter({ hasText: 'Uxbridge' }).click();
    await page.locator('.css-1fls9q2-control',{hasText:'Academic Level'}).click();
    await page.locator('[role="option"]').filter({ hasText: 'Postgraduate' }).click();
    await page.locator('.css-hlgwow',{hasText:'Intake Month'}).click();
    await page.locator('[role="option"]').filter({ hasText: 'September' }).click();
    await page.locator('.css-hlgwow',{hasText:'University'}).click();
    await page.locator('[role="option"]').filter({ hasText: 'Buckinghamshire New University' }).click();
    await page.locator('.css-hlgwow',{hasText:'Search Course'}).click();
    await page.locator('[role="option"]').filter({ hasText: 'MSc Data Science' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(3000);
    await page.getByRole('button', { name: 'Save & Next' }).click();
    await page.waitForTimeout(3000);
    await page.locator('.application-selection-section',{hasText:'Select Applications for Document Upload'}).click(); //Dropdown opens
        // await page.locator('.app-id', { hasText: 'GUIDA265' }).locator('xpath=ancestor::div[contains(@class,"application-option-info")]').click();
        const lastApp = page.locator('.dropdown-option').last();
        await lastApp.scrollIntoViewIfNeeded();
        await lastApp.locator('input[type="checkbox"]').click(); //application id checked
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
        console.log('Something went wrong');
    }
        
});