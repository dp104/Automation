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
    //Form open 
    // await page.locator('[name="firstName"]').fill('Rohit'); //Studnet First Name
    // await page.locator('[name="lastName"]').fill('Bhai');  //Studnet Last Name
    // await page.locator('[name="email"]').fill('rohitbhai@gmail.com'); //Student Mail id 
    // const gender = await page.getByRole('combobox').nth(0); //dropdown opens 
    // await gender.click();
    // await page.getByRole('option',{name:'Male',exact:true}).click();  // Gender selecting --> Female or Male
    // // await page.screenshot({ path: 'screenshot.png', fullPage: true });
    // await page.getByPlaceholder('DD/MM/YYYY').first().fill('16/09/2002');  //Student DOB 
    // await page.locator('body').click();
    // await page.getByRole('combobox').nth(1).click();
    // await page.getByRole('option',{name:'Unmarried',exact:true}).click();  //Student Mariatial status ---> Married,Unmarried
    // await page.getByRole('combobox').nth(2).click();
    // await page.waitForTimeout(3000);
    // await page.getByText('India',{exact:true}).click(); // Student Mobile number country code --> Pakistan,India
    // await page.locator('input[type="tel"][name="phoneNumber"][placeholder="Enter Phone Number"]').fill('9550768833');  //Student mobile number 
    // // open country dropdown
    // const country = await page.getByRole('combobox').nth(3);
    // await country.click();
    // await country.fill('Ind'); //Student Nationality 
    // await page.locator('[role="option"]').filter({ hasText: 'India' }).nth(1).click(); //--> Pakistan,India
    // await page.locator('input[type="text"][name="passportNo"][placeholder="Enter Passport Number"]').fill('A12345'); // Passport Number
    // await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(1).fill('09/09/2023'); //Passport start date
    // await page.getByRole('combobox').nth(4).click();
    // await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(2).fill('04/09/2033'); //passport end date
    // await page.locator('body').click();
    // await page.locator('input[type="text"][name="addressLine1"][placeholder="Enter Address Line 1"]').fill('Madhapur');  //student full address
    // const country2 = await page.getByRole('combobox').nth(4);
    // await country2.click();
    // await country2.fill('Ind'); // Select country 
    // await page.locator('[role="option"]').filter({ hasText: 'India' }).nth(1).click();  // Country 
    // const state =await page.getByRole('combobox').nth(5);
    // await state.click();
    // await state.fill('Tel');  //State 
    // await page.locator('[role="option"]').filter({ hasText: 'Telangana' }).first().click(); 
    // await page.getByRole('combobox').nth(6).click();
    // await page.getByText('Hyderabad',{exact:true}).click();  // City
    // await page.locator('input[type="text"][name="postalCode"][placeholder="Enter Postal Code"]').fill('500072');  //pin code 
    // await page.getByRole('button',{name:'Save & Next '}).click();          
    console.log("Personal Inforamtion is filled sucessfully");              
    await page.getByText('Education', { exact: true }).click();                                                   //Tab 1 completed
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByText('Education',{exact:true}).click();
    await page.locator('.css-1bx2lkn-control').first().click(); 
    await page.getByText('Postgraduate',{exact:true}).click();   //select Highest qualification from here   PG 
    await page.locator('.css-1bx2lkn-control').first().click(); 
    // await page.getByText('Select Board Country',{exact:true}).first().click();
    await page.locator('[role="option"]').filter({ hasText: 'India' }).nth(1).click();  //country select for ssc
    await page.locator('input[type="text"][name="schoolName"][placeholder="Enter Board Name"]').first().fill('Secondary School of education');  //ssc board name
    await page.locator('input[type="text"][name="courseName"][placeholder="Enter specialization"]').first().fill("10th Class");
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(3).fill('25/06/2017');  //ssc starting year
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(4).fill('12/04/2018');  //ssc ending year
    await page.locator('input[type="radio"][name="selectedOption-0"][value="gpa"]').click();  //select gpa 
    await page.locator('input[type="tel"][step="0.1"][min="0"][max="10"][name="gpa"][placeholder="E.g., 7.50 or 10.00"]').first().fill('8.9'); 
    await page.getByRole('button',{name:'Save',exact:true});
    // Adding the HSC data from here (Inter/diploma)
    await page.locator('.css-1bx2lkn-control').nth(2).click(); //For selecting the diploma
    await page.getByText('Diploma',{exact:true}).click();
    // await page.getByRole('button',{name:'Remove',exact:true}).click();  //remove the hsc from the list
    await page.locator('.school-entry').filter({ hasText: 'Higher Education (12th)' }).getByRole('button', { name: 'Remove' }).click();
    // await page.locator('body').click();
    // // Adding the Undergraduate from here onwards (Btech)
    await page.locator('.css-1bx2lkn-control').nth(3).click();
    await page.locator('[role="option"]').filter({ hasText: 'India' }).nth(1).click();  //ug country
    await page.locator('.css-ksb0kh').nth(10).click();
    await page.keyboard.type('Jawaharlal');  //ug board dropdown
    await page.locator('[role="option"]').filter({ hasText: 'Jawaharlal Nehru Technological University, Kakinada' }).click();
    await page.locator('input[type="text"][name="courseName"][placeholder="Enter specialization"]').nth(1).fill('CSE');
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(5).fill('05/06/2022'); //ug start date
    await page.locator('body').click();
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(6).fill('21/03/2025'); //ug end date
    await page.locator('body').click();
    await page.locator('input[type="radio"][name="selectedOption-1"][value="gpa"]').click(); //click on the gpa
    await page.locator('input[type="tel"][step="0.1"][min="0"][max="10"][name="gpa"][placeholder="E.g., 7.50 or 10.00"]').nth(1).fill('8.0'); //ug cgpa
    await page.getByRole('button',{name:'Save',exact:true});
    // //Postgraduate education details from here 
    await page.locator('.css-ksb0kh').nth(12).click();
    await page.locator('[role="option"]').filter({ hasText: 'India' }).nth(1).click(); //pg country 
    // await page.getByRole('combobox').last().click();
    await page.locator('input[type="text"][name="schoolName"][placeholder="Enter Board Name"]').nth(1).fill("Postgraduate Board of AP"); //pg board name
    await page.locator('input[type="text"][name="courseName"][placeholder="Enter specialization"]').nth(2).fill('BA');
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(7).fill('05/06/2023'); //pg start date
    await page.locator('body').click();
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(8).fill('21/03/2024'); //pg end date
    await page.locator('body').click();
    await page.locator('input[type="radio"][name="selectedOption-2"][value="gpa"]').click();
    await page.locator('input[type="tel"][step="0.1"][min="0"][max="10"][name="gpa"][placeholder="E.g., 7.50 or 10.00"]').nth(2).fill('8.0');  //pg cgpa
    await page.getByRole('button',{name:'Save',exact:true});

    //Diploma education details are added fron here 
    await page.locator('.css-1bx2lkn-control').nth(8).click(); 
    await page.locator('[role="option"]').filter({ hasText: 'India' }).nth(1).click();
    await page.locator('input[type="text"][name="schoolName"][placeholder="Enter Board Name"]').last().fill('State Board of Technical Education and Training');
    await page.locator('input[type="text"][name="courseName"][placeholder="Enter specialization"]').nth(3).fill('ECE');
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(9).fill('05/06/2022'); //ug start date
    await page.locator('body').click();
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(10).fill('21/03/2025'); //ug end date
    await page.locator('body').click();
    await page.locator('input[type="radio"][name="selectedOption-3"][value="percentage"]').click();
    await page.locator('input[type="tel"][name="percentage"][placeholder="Enter Percentage"]').fill('79');
    await page.getByRole('button',{name:'Save',exact:true});
    
    await page.locator('input[type="radio"][name="hasCoursePreference"][value="yes"]').click(); //Adding the interested courses 
    await page.locator('input[placeholder="Enter course"]').fill('Java Full Stack');
    // await page.getByRole('button',{name:'Add Another',exact:true}).click(); // More than one courses
    // // Select "No"
    // await page.locator('input[name="hasCoursePreference"][value="no"]').check();
    // // Verify "No" is selected
    // await expect(
    //     page.locator('input[name="hasCoursePreference"][value="no"]')
    // ).toBeChecked();

        // profiency test scores //
    // await page.locator('input[type="radio"][name="hasProficiencyScores"][value="no"]').click(); //profiency scores no 
    await page.locator('input[type="radio"][name="hasProficiencyScores"][value="yes"]').click(); //profiency test scores yes 
    await page.waitForTimeout(3000);
    await page.locator('.css-19bb58m').first().click(); //dropdowns   
    await page.locator('[role="option"]').filter({ hasText: 'Duolingo' }).click();
        await page.locator('input[type="tel"][name="duolingoTest.overall"][placeholder="overall"]').fill('119'); //overall score dulingo
        await page.locator('input[type="tel"][name="duolingoTest.literacy"][placeholder="literacy"]').fill('88'); //literacy
        await page.locator('input[type="tel"][name="duolingoTest.conversation"][placeholder="conversation"]').fill('78'); //conversation 
        await page.locator('input[type="tel"][name="duolingoTest.comprehension"][placeholder="comprehension"]').fill('98'); //comprehension
        await page.locator('input[type="tel"][name="duolingoTest.production"][placeholder="production"]').fill('64'); //production

        // work experinece //
    // await page.locator('input[type="radio"][name="hasWorkExperience"][value="no"]').click();  // Work Experience  no 
    await page.locator('input[type="radio"][name="hasWorkExperience"][value="yes"]').click(); // Work Experience yes 
        await page.locator('input[type="text"][name="companyName"][placeholder="Enter Company Name"]').fill('Apple'); //companyname
        await page.locator('input[type="text"][name="role"][placeholder="Enter Role"]').fill('Architect'); //designination 
        await page.locator('input[placeholder="DD/MM/YYYY"]').nth(11).fill('15/09/2025');
        await page.locator('body').click(); 
        await page.locator('input[placeholder="DD/MM/YYYY"]').nth(12).fill('15/04/2026');
        await page.locator('body').click();
        await page.locator('input[type="text"][name="projectName"][placeholder="Enter Project Name"]').fill("AI Interview , CRM Dashboard"); 
        await page.locator('textarea[name="projectDetails"]').fill('AI Based Student Portal Project');
        await page.getByRole('button', { name: /Save/i }).nth(4).click();      
    await page.getByRole('button', { name: 'Save & Next' }).click();
    console.log("Educational Details is Saved sucessfully");
    await page.waitForTimeout(4000);
      // If Skipped that Section // 
    await page.getByRole('button',{name:'Skip This Section'}).click();
    console.log("Emergency section is skipped");
     // IF NO //
    await page.locator('input[name="hasEmergencyContact"]').first().check(); // Emergency Contact Yes 
        await page.locator('input[type="text"][name="contactPersonName"][placeholder="Enter Contact Person Name"]').fill('Rajesh');
        await page.locator('input[type="tel"][name="phoneNumber"][placeholder="Enter Phone Number"][maxlength="10"]').fill('9876543210');
        await page.locator('input[type="email"][name="email"][placeholder="Enter Email"]').fill('random@mailinator');
        console.log('Emergency Contact is filled')
        // VISA Refusall // Yes 
    await page.locator('input[type="radio"][name="hasVisaRefusal"][value="yes"]').click();
        await page.locator('input[aria-describedby="react-select-87-placeholder"]').fill('Student Visa');
        await page.locator('[role="option"]', { hasText: 'Student Visa' }).click();
        const country15 = await page.locator('.css-ksb0kh').nth(15);
        await country15.click();
        await country15.fill('Ind');
        await page.locator('[role="option"]').filter({ hasText: 'India' }).nth(1).click();
    console.log("Emergency section is skipped");
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
 