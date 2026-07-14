import { expect, test } from '@playwright/test';
import { login } from '../../utils/login'
import { env } from '../../utils/environmenturls';
test('Dashboard test', async({page}) => {
    test.setTimeout(150000); // 60 seconds

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
    await page.locator('[name="firstName"]').fill('Prasad'); //Studnet First Name
    await page.locator('[name="lastName"]').fill('devarakonda');  //Studnet Last Name
    await page.locator('[name="email"]').fill('prakashbhanu+3@gmail.com'); //Student Mail id 
    const gender = await page.getByRole('combobox').nth(0); //dropdown opens 
    await gender.click();
    await page.getByRole('option',{name:'Male',exact:true}).click();  // Gender selecting --> Female or Male
    // await page.screenshot({ path: 'screenshot.png', fullPage: true });
    await page.getByPlaceholder('DD/MM/YYYY').first().fill('16/09/2004');  //Student DOB 
    await page.locator('body').click();
    await page.getByRole('combobox').nth(1).click();
    await page.getByRole('option',{name:'Unmarried',exact:true}).click();  //Student Mariatial status ---> Married,Unmarried
    await page.getByRole('combobox').nth(2).click();
    await page.waitForTimeout(3000);
    await page.getByText('India',{exact:true}).click(); // Student Mobile number country code --> Pakistan,India
    await page.locator('input[type="tel"][name="phoneNumber"][placeholder="Enter Phone Number"]').fill('9550768833');  //Student mobile number 
    // open country dropdown
    const country = await page.getByRole('combobox').nth(3);
    await country.click();
    await country.fill('Ind'); //Student Nationality 
    await page.locator('[role="option"]').filter({ hasText: 'India' }).nth(1).click(); //--> Pakistan,India
    await page.locator('input[type="text"][name="passportNo"][placeholder="Enter Passport Number"]').fill('A984034'); // Passport Number
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(1).fill('09/09/2024'); //Passport start date
    await page.getByRole('combobox').nth(4).click();
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(2).fill('04/09/2034'); //passport end date
    await page.locator('body').click();
    await page.locator('input[type="text"][name="addressLine1"][placeholder="Enter Address Line 1"]').fill('Kphb , Kukatpally');  //student full address
    const country2 = await page.getByRole('combobox').nth(4);
    await country2.click();
    await country2.fill('Ind'); // Select country 
    await page.locator('[role="option"]').filter({ hasText: 'India' }).nth(1).click();  // Country 
    const state =await page.getByRole('combobox').nth(5);
    await state.click();
    await state.fill('Tel');  //State 
    await page.locator('[role="option"]').filter({ hasText: 'Telangana' }).first().click(); 
    await page.getByRole('combobox').nth(6).click();
    await page.getByText('Hyderabad',{exact:true}).click();  // City
    await page.locator('input[type="text"][name="postalCode"][placeholder="Enter Postal Code"]').fill('500072');  //pin code 
    await page.getByRole('button',{name:'Save & Next '}).click();          
    console.log("Personal Inforamtion is filled sucessfully");                                                                 //Tab 1 completed
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByText('Education',{exact:true}).click();
    await page.locator('.css-1bx2lkn-control').first().click(); 
    await page.getByText('Postgraduate',{exact:true}).click();   //select Highest qualification from here   PG 
    await page.locator('.css-1bx2lkn-control').first().click(); 
    // await page.getByText('Select Board Country',{exact:true}).first().click();
    await page.locator('[role="option"]').filter({ hasText: 'India' }).nth(1).click();  //country select for ssc
    await page.locator('input[type="text"][name="schoolName"][placeholder="Enter Board Name"]').first().fill('Secondary School of education');  //ssc board name
    await page.locator('input[type="text"][name="courseName"][placeholder="Enter specialization"]').first().fill('10th Class');
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(3).fill('25/06/2016');  //ssc starting year
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(4).fill('12/04/2017');  //ssc ending year
    await page.locator('input[type="radio"][name="selectedOption-0"][value="gpa"]').click();  //select gpa 
    await page.locator('input[type="tel"][step="0.1"][min="0"][max="10"][name="gpa"][placeholder="E.g., 7.50 or 10.00"]').fill('8.9'); 
    await page.getByRole('button',{name:'Save',exact:true});
    // Adding the HSC data from here (Inter/diploma)
    await page.locator('.css-1bx2lkn-control').nth(3).click();
    await page.locator('[role="option"]').filter({ hasText: 'India' }).nth(1).click();  // Hsc board country
    // await page.getByRole('combobox').last().click();
    await page.getByRole('combobox').nth(4).click();
    await page.keyboard.type('Andhra');  //Hsc Board name dropdown
    await page.getByRole('option',{name:'Andhra Pradesh Board of Intermediate Education'}).click();
    await page.locator('input[type="text"][name="courseName"][placeholder="Enter specialization"]').nth(1).fill('MPC');
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(5).fill('15/07/2017'); //hsc start year 
    await page.locator('body').click();
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(6).fill('11/04/2019'); //hsc end year
    await page.locator('body').click();
    // await page.locator('input[type="tel"][name="percentage"][placeholder="Enter Percentage"]').click();
    await page.locator('input[type="tel"][name="percentage"][placeholder="Enter Percentage"]').first().fill('72%'); //hsc percentange
    await page.locator('input[type="tel"][name="englishMarks"][placeholder="Enter English Marks"]').fill('78');  //english marks
    await page.getByRole('button',{name:'Save',exact:true}); 
    // // Adding the Undergraduate from here onwards (Btech)
    await page.locator('.css-1bx2lkn-control').nth(6).click();
    await page.locator('[role="option"]').filter({ hasText: 'India' }).nth(1).click();  //ug country
    await page.getByRole('combobox').nth(7).click();
    await page.keyboard.type('Jawaharlal');  //ug board dropdown
    await page.locator('[role="option"]').filter({ hasText: 'Jawaharlal Nehru Technological University, Kakinada' }).click();
    await page.locator('input[type="text"][name="courseName"][placeholder="Enter specialization"]').nth(2).fill('CSE');
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(7).fill('05/06/2019'); //ug start date
    await page.locator('body').click();
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(8).fill('21/03/2023'); //ug end date
    await page.locator('body').click();
    await page.locator('input[type="radio"][name="selectedOption-2"][value="gpa"]').click(); //click on the gpa
    await page.locator('input[type="tel"][step="0.1"][min="0"][max="10"][name="gpa"][placeholder="E.g., 7.50 or 10.00"]').nth(1).fill('8.0'); //ug cgpa
    await page.getByRole('button',{name:'Save',exact:true});
    // //Postgraduate education details from here 
    await page.locator('.css-1bx2lkn-control').nth(9).click();
    await page.locator('[role="option"]').filter({ hasText: 'India' }).nth(1).click(); //pg country 
    // await page.getByRole('combobox').last().click();
    await page.locator('input[type="text"][name="schoolName"][placeholder="Enter Board Name"]').nth(1).fill("Postgraduate Board of AP"); //pg board name
    await page.locator('input[type="text"][name="courseName"][placeholder="Enter specialization"]').nth(3).fill('BA');
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(9).fill('05/06/2023'); //pg start date
    await page.locator('body').click();
    await page.locator('input[type="text"][placeholder="DD/MM/YYYY"]').nth(10).fill('21/03/2024'); //pg end date
    await page.locator('body').click();
    await page.locator('input[type="radio"][name="selectedOption-3"][value="gpa"]').click();
    await page.locator('input[type="tel"][step="0.1"][min="0"][max="10"][name="gpa"][placeholder="E.g., 7.50 or 10.00"]').nth(2).fill('8.0');  //pg cgpa
    await page.getByRole('button',{name:'Save',exact:true});
    await page.locator('input[name="hasCoursePreference"][value="yes"]').click();
    await page.locator('input[placeholder="Enter course"]').fill('Java Full Stack');
    // await page.getByRole('button',{name:'Add Another',exact:true}).click();
    // // Select "No"
    // await page.locator('input[name="hasCoursePreference"][value="no"]').check();
    // // Verify "No" is selected
    // await expect(
    //     page.locator('input[name="hasCoursePreference"][value="no"]')
    // ).toBeChecked();
    await page.locator('input[name="hasProficiencyScores"][value="no"]').click(); //profiency scores
    await page.locator('input[name="hasWorkExperience"][value="no"]').click(); //work experinece 
    await page.getByRole('button', { name: 'Save & Next' }).click();
    console.log("Educational Details is Saved sucessfully");
    await page.waitForTimeout(4000);
    await page.getByRole('button',{name:'Skip This Section'}).click();
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
    await page.waitForTimeout(4000);
    await page.keyboard.type('Digital Marketing'); 
    await page.locator('[role="option"]').filter({ hasText: 'MSc Digital Marketing'}).first().click();
    await page.getByRole('button', { name: 'Save' }).click();
    console.log("Application is saved sucessfully");
    await page.waitForTimeout(5000);
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

     await page.locator('.css-hlgwow',{hasText:'Higher Secondary Certificate (12th)'}).first().click(); //dropdown clicks
     await page.getByText('CV / Resume',{exact:true}).first().click();   //resume
     const filePath3 = '/Users/flyurdream/Automation Testing/First/files/Dummy_Pdf 2.pdf'; 
    await page.locator('input[type="file"]').setInputFiles(filePath3);
    await page.getByRole('button',{name :'📤 Upload Document'}).click();
    await page.waitForTimeout(120000);
    console.log("documents uploaded sucessfully");
    }else{
        console.log('Something went wrong');
    }
        
});
 