import { test, expect } from '@playwright/test';

test('Add Student (Old) Test', async ({ page }) => {
  // Step 1: Open login page at https://mahindra.guideuni.com/
  await page.goto('https://mahindra.guideuni.com/');

  // Step 2: Fill the email input with placeholder "Enter your email" with value hydfteam@mailinator.com
  await page.locator("input[placeholder='Enter your email']").fill('hydfteam@mailinator.com');

  // Step 3: Fill the password input with placeholder "Enter your password" with value Data@12345
  await page.locator("input[placeholder='Enter your password']").fill('Data@12345');

  // Step 4: Click the button with class login-btn-modern to sign in
  await page.locator('button.login-btn-modern').click();

  // Step 5: If a session conflict checkbox appears check it and click the login button again
  const sessionConflict = page.locator('text=Session Conflict, text=Force Login').first();
  if (await sessionConflict.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.locator('input[type="checkbox"]').first().check();
    await page.waitForTimeout(500);
    await page.locator('button.login-btn-modern').click();
    await page.waitForLoadState('networkidle');
  }

  // Step 6: Wait for the dashboard to load after login
  await page.waitForLoadState('networkidle');

  // Step 7: Click the sidebar toggle icon with class menu-toggle-icon to expand the sidebar
  await page.locator('a.menu-toggle-icon').click();
  await page.waitForTimeout(500);

  // Step 8: Click the Application menu item in the sidebar using selector a.menu-link[title='Application']
  await page.locator("a.menu-link[title='Application']").click();
  await page.waitForLoadState('networkidle');

  // Step 9: Click Add Student(Old) submenu using selector a.menu-link[href='#/add-application']
  await page.locator("a.menu-link[href='#/add-application']").click();
  await page.waitForLoadState('networkidle');

  // Step 10: Wait for the Add Student form to load with 5 tabs
  await expect(page.locator('button.sp-tab')).toHaveCount(5);

  // --- TAB 1: PERSONAL DETAILS ---
  // Step 11: Fill input with placeholder "First name" with value Rahul
  await page.locator("input[placeholder='First name']").fill('Rahul');

  // Step 12: Fill input with placeholder "Last name" with value Sharma
  await page.locator("input[placeholder='Last name']").fill('Sharma');

  // Step 13: Fill input with placeholder "name@example.com" with value rahul.sharma@mailinator.com
  await page.locator("input[placeholder='name@example.com']").fill('rahul.sharma@mailinator.com');

  // Step 14: Click the first react-select dropdown (Gender) and select Male
  await page.getByRole('combobox', { name: 'Gender' }).click();
  await page.getByText('Male').click();

  // Step 15: Fill the first date input (Date of Birth) with 2000-01-15
  await page.locator("input[type='date']").nth(0).fill('2000-01-15');

  // Step 16: Click the second react-select dropdown (Marital Status) and select Single
  await page.getByRole('combobox', { name: 'Marital Status' }).click();
  await page.getByText('Single').click();

  // Step 17: Click the third react-select dropdown (Phone Country Code) and select India +91
  await page.getByRole('combobox', { name: 'Phone Country Code' }).click();
  await page.getByText('+91').click();

  // Step 18: Fill input with placeholder "Phone number" with value 9876543210
  await page.locator("input[placeholder='Phone number']").fill('9876543210');

  // Step 19: Click the fourth react-select dropdown (Nationality) and select Indian
  await page.getByRole('combobox', { name: 'Nationality' }).click();
  await page.getByText('Indian').click();

  // Step 20: Fill input with placeholder "e.g. N1234567" with value P1234567
  await page.locator("input[placeholder='e.g. N1234567']").fill('P1234567');

  // Step 21: Fill the second date input (Passport Issue Date) with 2020-01-01
  await page.locator("input[type='date']").nth(1).fill('2020-01-01');

  // Step 22: Fill the third date input (Passport Expiry Date) with 2030-01-01
  await page.locator("input[type='date']").nth(2).fill('2030-01-01');

  // Step 23: Fill input with placeholder "Address line 1" with value 123 MG Road Banjara Hills
  await page.locator("input[placeholder='Address line 1']").fill('123 MG Road Banjara Hills');

  // Step 24: Click the fifth react-select dropdown (Country) and select India
  await page.getByRole('combobox', { name: 'Country' }).click();
  await page.getByText('India').click();

  // Step 25: Click the sixth react-select dropdown (State/Region) and select Telangana
  await page.getByRole('combobox', { name: 'State/Region' }).click();
  await page.getByText('Telangana').click();

  // Step 26: Click the seventh react-select dropdown (City) and select Hyderabad
  await page.getByRole('combobox', { name: 'City' }).click();
  await page.getByText('Hyderabad').click();

  // Step 27: Fill input with placeholder "e.g. 500081" with value 500034
  await page.locator("input[placeholder='e.g. 500081']").fill('500034');

  // Step 28: Click the button with text "Save & Next →" to proceed to Education tab
  await page.locator('button:has-text("Save & Next →")').click();
  await page.waitForLoadState('networkidle');

  // --- TAB 2: EDUCATION DETAILS ---
  // Step 29: Click the first Yes button with class edu-yn-btn to toggle Course Preference to Yes
  await page.locator('button.edu-yn-btn').nth(0).click();

  // Step 30: Click the second Yes button with class edu-yn-btn to toggle English Proficiency to Yes
  await page.locator('button.edu-yn-btn').nth(1).click();

  // Step 31: Click the third Yes button with class edu-yn-btn to toggle Work Experience to Yes
  await page.locator('button.edu-yn-btn').nth(2).click();

  // Step 32: Click the button with text "Next: Emergency & Visa →" to proceed
  await page.locator('button:has-text("Next: Emergency & Visa →")').click();
  await page.waitForLoadState('networkidle');

  // --- TAB 3: EMERGENCY & VISA ---
  // Step 33: Click the button with text "Skip →" and class sp-btn-ghost to skip emergency contact
  await page.locator('button.sp-btn-ghost:has-text("Skip →")').click();
  await page.waitForLoadState('networkidle');

  // --- TAB 4: CREATE APPLICATION ---
  // Step 34: Click the button with text "Create Application" to open the application form
  await page.locator('button:has-text("Create Application")').click();
  await page.waitForLoadState('networkidle');

  // Step 35: Click the button with text "Next: Documents →" to proceed to documents
  await page.locator('button:has-text("Next: Documents →")').click();
  await page.waitForLoadState('networkidle');

  // --- TAB 5: DOCUMENTS ---
  // Step 36: Verify the Documents tab is displayed and the form completed successfully
  await expect(page.locator('h1')).toHaveText('Documents');
});   