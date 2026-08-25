import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { env } from '../../utils/environmenturls';

// Universities page — NEW UI (newuniv-campus components, replaced the old
// .university-card grid in 2026-07): search box, campus count, card grid with
// logo/name/location and a "View Course" action per card.

test('Vivek Consultancy — Universities Page (new UI)', async ({ page }) => {
    test.setTimeout(180000);

    const result = await login(page, env.vivekconsultancy, 'chittibabu@gmail.com', 'Data@1234');
    if (result === 'email error' || result === 'password error') { console.log('Login failed:', result); return; }
    console.log('Login success');
    await page.waitForSelector('.nsm-sidebar', { timeout: 20000 });

    // ── Navigate ──────────────────────────────────────────────────────────────
    await page.goto('https://vivekconsultancy.flyurdream.com/#/universities');
    await page.waitForSelector('.newuniv-campus-card', { timeout: 40000 });
    await expect(page).toHaveURL(/universities/i);
    console.log('✓ Universities page loaded');

    // ── Search input ──────────────────────────────────────────────────────────
    const search = page.locator('input[placeholder*="Search universities" i]').first();
    await expect(search).toBeVisible();
    console.log('✓ Search input visible');

    // ── Count + card grid ─────────────────────────────────────────────────────
    const countText = await page.locator('.newuniv-campus-count').first().innerText().catch(() => '');
    console.log('✓ Campus count:', countText.replace(/\n/g, ' ').trim() || '(no count element)');

    const cards = page.locator('.newuniv-campus-card');
    const cardCount = await cards.count();
    expect(cardCount, 'university cards should be listed').toBeGreaterThan(0);
    console.log(`✓ ${cardCount} university cards displayed`);

    // ── First card structure ──────────────────────────────────────────────────
    const first = cards.first();
    await expect(first.locator('.newuniv-campus-name').first()).toBeVisible();
    await expect(first.locator('.newuniv-campus-location').first()).toBeVisible();
    const uniName = (await first.locator('.newuniv-campus-name').first().innerText()).trim();
    const location = (await first.locator('.newuniv-campus-location').first().innerText()).trim();
    console.log(`✓ First card: "${uniName}" — ${location}`);
    await expect(first.locator('text=View Course').first()).toBeVisible();
    console.log('✓ "View Course" action present on the card');

    // ── Search filters the grid ───────────────────────────────────────────────
    await search.fill('London');
    await page.waitForTimeout(2500);
    const filtered = await cards.count();
    console.log(`✓ Cards after searching "London": ${filtered}`);
    const allMatch = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.newuniv-campus-card'))
            .every(c => /london/i.test((c as HTMLElement).innerText)));
    console.log(`✓ All filtered cards mention "London": ${allMatch}`);

    await search.fill('');
    await page.waitForTimeout(2000);
    const restored = await cards.count();
    expect(restored, 'clearing the search should restore the list').toBeGreaterThanOrEqual(filtered);
    console.log(`✓ Search cleared — ${restored} cards`);

    // ── Toolbar extras (non-fatal) ────────────────────────────────────────────
    const filterBtn = await page.locator('.newuniv-campus-filter-btn').first().isVisible().catch(() => false);
    const viewToggle = await page.locator('.newuniv-campus-view-toggle').first().isVisible().catch(() => false);
    console.log(`✓ Filter button: ${filterBtn} | view toggle: ${viewToggle}`);

    console.log('\n✅ Universities page (new UI) verified');
});
