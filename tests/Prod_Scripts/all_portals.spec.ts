import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/* ============================================================
 * CONFIGURATION
 * ========================================================== */

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 20_000; // 20 seconds between retries
const NAVIGATION_TIMEOUT_MS = 90_000; // 90 seconds
const LOCATOR_TIMEOUT_MS = 30_000; // 30 seconds
const POPUP_DETECTION_TIMEOUT_MS = 5_000; // 5 seconds — short-circuit when no popup opens
const OVERALL_TEST_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes — 5 portals x 3 retries x 90s
// navigation timeouts (plus 20s retry delays) can comfortably exceed 10 minutes
// in a bad-case run, so the overall budget is sized for that worst case.

const FLYURDREAM_URL = 'https://flyurdream.com/';
const FLYURDREAM_CRM_URL_PREFIX = 'https://crm.flyurdream.com';
const GUIDEUNI_URL = 'https://guideuni.com/';
const GUIDEUNI_CRM_URL_PREFIX = 'https://crm.guideuni.com';
const LOAN_PORTAL_URL = 'https://qa.studylend.in/';

const STATUS_FILES = {
  flyurdream: 'flyurdream.pass',
  flyurdreamCRM: 'flyurdreamCRM.pass',
  guideuni: 'guideuni.pass',
  guideuniCRM: 'guideuniCRM.pass',
  loan: 'loan.pass',
} as const;

/* ============================================================
 * TIMESTAMPED LOGGING
 *
 * Every important action is logged with a [DD-MM-YYYY HH:MM:SS]
 * prefix, and every caught exception is logged with its actual
 * message (never swallowed silently) — this is what makes a
 * failed Jenkins run debuggable after the fact.
 * ========================================================== */

function formatTimestamp(date: Date = new Date()): string {
  const pad = (value: number) => value.toString().padStart(2, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

function log(message: string): void {
  console.log(`[${formatTimestamp()}] ${message}`);
}

function logError(message: string, error: unknown): void {
  const reason = error instanceof Error ? error.message : String(error);
  console.error(`[${formatTimestamp()}] ${message} Reason: ${reason}`);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ============================================================
 * PATH / STATUS FILE HELPERS
 *
 * Jenkins checks fileExists("flyurdream.pass") etc. from the
 * WORKSPACE ROOT, not from beside this spec file — so status
 * files must be anchored to process.cwd() (the directory the
 * `npx playwright test` command is invoked from), not to this
 * file's own directory.
 * ========================================================== */

const WORKSPACE_DIR = process.cwd();

function statusFile(name: string): string {
  return path.join(WORKSPACE_DIR, name);
}

function deleteOldStatusFiles(): void {
  Object.values(STATUS_FILES).forEach((fileName) => {
    const filePath = statusFile(fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      log(`Deleted old status file: ${fileName}`);
    }
  });
}

function writeStatusFile(fileName: string): void {
  fs.writeFileSync(statusFile(fileName), 'PASS');
  log(`Created status file: ${fileName}`);
}

/* ============================================================
 * URL MATCHING HELPER
 *
 * Predicate-based matching (rather than a "**" glob) so a match
 * still holds even when the real URL carries query parameters
 * Playwright's glob matching would otherwise choke on.
 * ========================================================== */

function urlStartsWith(prefix: string): (url: URL) => boolean {
  return (url: URL) => url.href.startsWith(prefix);
}

/* ============================================================
 * RETRY HELPER
 *
 * Retries `fn` up to `retries` times, waiting `delayMs` between
 * attempts. Only retries on actual failure — a successful attempt
 * returns immediately without ever sleeping.
 * ========================================================== */

interface RetryOptions {
  retries: number;
  delayMs: number;
}

async function retry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const { retries, delayMs } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    log(`Attempt ${attempt}`);
    try {
      const result = await fn();
      log('SUCCESS');
      return result;
    } catch (error) {
      lastError = error;
      logError(`Attempt ${attempt} failed.`, error);
      if (attempt < retries) {
        log(`Retrying in ${delayMs / 1000} seconds...`);
        await sleep(delayMs);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/* ============================================================
 * PAGE SETUP HELPER
 *
 * Every check opens its own fresh page so a failed/expired page
 * from a previous retry attempt never leaks into the next one.
 * ========================================================== */

async function newConfiguredPage(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);
  page.setDefaultTimeout(LOCATOR_TIMEOUT_MS);
  return page;
}

/* ============================================================
 * PORTAL CHECKS
 * ========================================================== */

async function checkFlyurdream(context: BrowserContext): Promise<void> {
  const page = await newConfiguredPage(context);
  try {
    await page.goto(FLYURDREAM_URL, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS });
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible({ timeout: LOCATOR_TIMEOUT_MS });
  } finally {
    await page.close().catch(() => {});
  }
}

async function checkFlyurdreamCRM(context: BrowserContext): Promise<void> {
  const page = await newConfiguredPage(context);
  try {
    await page.goto(FLYURDREAM_URL, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS });

    await Promise.all([
      page.waitForURL(urlStartsWith(FLYURDREAM_CRM_URL_PREFIX), { timeout: NAVIGATION_TIMEOUT_MS }),
      page.getByRole('link', { name: 'Login' }).click(),
    ]);

    await page.waitForLoadState('domcontentloaded', { timeout: NAVIGATION_TIMEOUT_MS });
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible({ timeout: LOCATOR_TIMEOUT_MS });
  } finally {
    await page.close().catch(() => {});
  }
}

async function checkGuideUni(context: BrowserContext): Promise<void> {
  const page = await newConfiguredPage(context);
  try {
    await page.goto(GUIDEUNI_URL, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS });
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible({ timeout: LOCATOR_TIMEOUT_MS });
  } finally {
    await page.close().catch(() => {});
  }
}

async function checkGuideUniCRM(context: BrowserContext): Promise<void> {
  const page = await newConfiguredPage(context);
  let popup: Page | null = null;
  let openedNewTab = false;
  try {
    await page.goto(GUIDEUNI_URL, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS });

    // GuideUni login: detect a popup with a short timeout, fall back to
    // same-tab navigation if none appears.
    const popupPromise = context.waitForEvent('page', { timeout: POPUP_DETECTION_TIMEOUT_MS }).catch(() => null);
    await page.getByRole('link', { name: 'Login' }).click();
    const newPage = await popupPromise;

    if (newPage) {
      popup = newPage;
      openedNewTab = true;
      popup.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);
      popup.setDefaultTimeout(LOCATOR_TIMEOUT_MS);
    } else {
      popup = page;
    }

    await popup.waitForLoadState('domcontentloaded', { timeout: NAVIGATION_TIMEOUT_MS });
    await popup.waitForURL(urlStartsWith(GUIDEUNI_CRM_URL_PREFIX), { timeout: NAVIGATION_TIMEOUT_MS });
    await expect(popup.getByRole('button', { name: 'Sign In' })).toBeVisible({ timeout: LOCATOR_TIMEOUT_MS });
  } finally {
    if (openedNewTab && popup) {
      await popup.close().catch(() => {});
    }
    await page.close().catch(() => {});
  }
}

// Loan portal health check — confirms the QA StudyLend app is reachable
// and responding. This intentionally checks nothing about page content:
// a loading screen, splash screen, redirect, login page, or dashboard are
// all equally acceptable outcomes.
async function checkLoanPortal(context: BrowserContext): Promise<void> {
  const page = await newConfiguredPage(context);
  try {
    const response = await page.goto(LOAN_PORTAL_URL, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT_MS,
    });

    if (!response) {
      throw new Error('No HTTP response received from the loan portal.');
    }

    const status = response.status();
    const isNotFound = status === 404;
    const isServerError = status >= 500;
    if (isNotFound || isServerError) {
      throw new Error(`Loan portal responded with failing status ${status}`);
    }

    await page.waitForLoadState('domcontentloaded', { timeout: NAVIGATION_TIMEOUT_MS });

    if (!page.url()) {
      throw new Error('Loan portal page has no URL after navigation — the page may have crashed.');
    }

    log('StudyLend QA Portal is UP');
  } finally {
    await page.close().catch(() => {});
  }
}

/* ============================================================
 * ORCHESTRATION
 * ========================================================== */

interface PortalCheck {
  label: string;
  statusFileName: string;
  check: () => Promise<void>;
}

interface PortalResult {
  label: string;
  passed: boolean;
}

async function runPortalCheck(portal: PortalCheck): Promise<PortalResult> {
  log(`Checking ${portal.label}`);
  const startedAt = Date.now();
  try {
    await retry(portal.check, { retries: MAX_RETRIES, delayMs: RETRY_DELAY_MS });
    writeStatusFile(portal.statusFileName);
    const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(2);
    log(`${portal.label} PASSED (${elapsedSeconds} seconds)`);
    return { label: portal.label, passed: true };
  } catch (error) {
    const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(2);
    logError(`${portal.label} marked as FAILED after ${MAX_RETRIES} attempts.`, error);
    log(`${portal.label} FAILED (${elapsedSeconds} seconds)`);
    return { label: portal.label, passed: false };
  }
}

function printSummary(results: PortalResult[]): void {
  log('======================================');
  log('PORTAL STATUS');
  log('======================================');
  results.forEach((result) => {
    log(`${result.label.padEnd(22)}${result.passed ? 'PASSED' : 'FAILED'}`);
  });
  log('======================================');

  const failedResults = results.filter((result) => !result.passed);
  const passedCount = results.length - failedResults.length;

  log('--------------------------------------');
  log(`Total Portals: ${results.length}`);
  log(`Passed: ${passedCount}`);
  log(`Failed: ${failedResults.length}`);
  log('--------------------------------------');

  if (failedResults.length > 0) {
    log('Failed Portals');
    failedResults.forEach((result) => log(result.label));
  }
}

/* ============================================================
 * TEST
 * ========================================================== */

test('Portal availability monitoring', async ({ context }) => {
  test.setTimeout(OVERALL_TEST_TIMEOUT_MS);

  deleteOldStatusFiles();

  const portals: PortalCheck[] = [
    { label: 'flyurdream.com', statusFileName: STATUS_FILES.flyurdream, check: () => checkFlyurdream(context) },
    {
      label: 'crm.flyurdream.com',
      statusFileName: STATUS_FILES.flyurdreamCRM,
      check: () => checkFlyurdreamCRM(context),
    },
    { label: 'guideuni.com', statusFileName: STATUS_FILES.guideuni, check: () => checkGuideUni(context) },
    {
      label: 'crm.guideuni.com',
      statusFileName: STATUS_FILES.guideuniCRM,
      check: () => checkGuideUniCRM(context),
    },
    { label: 'loan.studylend.in', statusFileName: STATUS_FILES.loan, check: () => checkLoanPortal(context) },
  ];

  const results: PortalResult[] = [];

  // Sequential, and each iteration is independently try/caught inside
  // runPortalCheck — one portal failing never stops the rest from running.
  for (let i = 0; i < portals.length; i++) {
    results.push(await runPortalCheck(portals[i]));
    if (i < portals.length - 1) {
      log('Next portal');
    }
  }

  printSummary(results);

  const failedCount = results.filter((result) => !result.passed).length;
  if (failedCount > 0) {
    throw new Error(`${failedCount} portal(s) failed`);
  }
});