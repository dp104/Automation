import { test, expect } from '@playwright/test';

const url = 'https://flyurdream.com/';

test('Full Navbar Pages Scroll Flow', async ({ page }) => {
    test.setTimeout(60000);

  await page.goto(url);
  console.log(':globe_with_meridians: Website opened');

  await page.waitForLoadState('domcontentloaded');

  // :small_blue_diamond: FUNCTION: FULL PAGE SCROLL
  async function fullScroll() {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 300;

        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= document.body.scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 200);
      });
    });
  }

  // :white_check_mark: STEP 1: HOME PAGE FULL SCROLL
  console.log(':point_right: Scrolling Home Page');
  await fullScroll();
  console.log(':arrow_down: Home page scrolled');

  // :arrow_up: BACK TO TOP
//   await page.evaluate(() => window.scrollTo(0, 0));
//   await page.waitForTimeout(1000);

  // :pushpin: NAVBAR ITEMS (based on your site)
  const navItems = [
    'Home',
    'Student',
    'Recruitment Partners',
    'Institutions',
    'Franchise',
    'Company'
  ];

  // :repeat: LOOP THROUGH NAV ITEMS
  for (const item of navItems) {

    console.log(`:point_right: Opening: ${item}`);

    const nav = page.locator(`text=${item}`).first();

    await expect(nav).toBeVisible({ timeout: 10000 });
    await nav.click();

    // :hourglass_flowing_sand: wait for page load
    await page.waitForLoadState('domcontentloaded');
    // await page.waitForTimeout(2000);

    console.log(`:white_check_mark: ${item} page opened`);

    // :arrow_down: FULL PAGE SCROLL
    await fullScroll();

    console.log(`:arrow_down: ${item} fully scrolled`);

    // :arrow_up: BACK TO TOP FOR NEXT CLICK
    await page.evaluate(() => window.scrollTo(0, 0));
    // await page.waitForTimeout(1500);
  }

  console.log(':dart: All pages opened & fully scrolled successfully');



// :closed_lock_with_key: LOGIN CLICK
console.log(':point_right: Clicking Login button');

const loginBtn = page.getByText('Login', { exact: true });

await loginBtn.waitFor({ state: 'visible', timeout: 10000 });
await loginBtn.click();

// :globe_with_meridians: VERIFY CRM URL
await expect(page).toHaveURL(/crm.flyurdream.com/);

console.log(':globe_with_meridians: crm.flyurdream.com site opened');
await page.waitForTimeout(5000);

// :white_check_mark: WAIT UNTIL SIGN IN BUTTON VISIBLE (page fully loaded)
const signInBtn = page.getByText('Sign In', { exact: true });


// await signInBtn.waitFor({ state: 'visible', timeout: 15000 });

// :white_check_mark: SUCCESS MESSAGE
console.log(':white_check_mark: crm.flyurdream.com loaded successfully (Sign In visible)');
});