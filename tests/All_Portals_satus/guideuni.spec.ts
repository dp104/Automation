import { test, expect } from '@playwright/test';

const url = 'https://guideuni.com/';

test('Navbar Full Flow (Normal + Company + Login)', async ({ page }) => {
test.setTimeout(60000); // 1 minutes timeout for the entire test
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  console.log(':globe_with_meridians: Site opened');

  // :arrow_down_small: Scroll Function
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

    await page.evaluate(() => window.scrollTo(0, 0));
  }

  // :white_check_mark: Home scroll
  await page.waitForLoadState('networkidle');
  await fullScroll();

  // :small_blue_diamond: NORMAL NAV ITEMS
  const navLinks = page.locator(
    '#navbarSupportedContent .nav-link:not(.dropdown-toggle):not(.ext-link)'
  );

  const navCount = await navLinks.count();

  for (let i = 0; i < navCount; i++) {
    const link = navLinks.nth(i);
    const text = await link.innerText();

    console.log(`:arrow_right: Clicking: ${text}`);

    await link.click();
    await page.waitForLoadState('networkidle');

    await fullScroll();

    await page.goBack();
    await page.waitForLoadState('networkidle');
  }

  console.log(':white_check_mark: Normal navbar items completed');

  // :arrow_down_small: COMPANY DROPDOWN
  const companyDropdown = page.locator('#navbarDropdown');

  await companyDropdown.click();
  await page.waitForTimeout(1000);

  const dropdownItems = page.locator('.dropdown-menu .dropdown-item');
  const dropCount = await dropdownItems.count();

  for (let i = 0; i < dropCount; i++) {
    const item = dropdownItems.nth(i);
    const text = await item.innerText();

    console.log(`:arrow_down_small: Company -> ${text}`);

    await item.click();
    await page.waitForLoadState('networkidle');

    await fullScroll();

    await page.goBack();
    await page.waitForLoadState('networkidle');

    // :repeat: reopen dropdown
    await companyDropdown.click();
    // await page.waitForTimeout(1000);
  }

  await page.getByRole('link',{name:'Login'}).click();
  console.log(':closed_lock_with_key: Login page opened');

  const newPage = await page.context().waitForEvent('page');

await newPage.waitForURL('**crm.guideuni.com**');
await newPage.waitForLoadState('domcontentloaded');

console.log(':white_check_mark: CRM Login page opened');

// verify login field
await expect(newPage.locator('input[name="email"]')).toBeVisible();

await newPage.waitForTimeout(5000);

});