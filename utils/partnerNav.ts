import { Page } from '@playwright/test';

// Shared navigation helpers for the GuideUni PARTNER portal sidebar.
// This UI (icon-only collapsed sidebar, "nsm-*" classes) is shared platform
// chrome — the same structure should appear for any partner tenant
// (env.vivekconsultancy, env.hydftem, env.buckingportal, ...), only the
// company-specific data behind it differs. Pass a tenant's base URL
// (from utils/environmenturls.ts) to make any helper here tenant-agnostic.

// Sidebar section (top-level icon) → submenu item → hash route, as discovered
// on vivekconsultancy. Route paths are platform routes, not tenant-specific,
// so this map is expected to hold for other partner tenants too.
export const PARTNER_ROUTES = {
    dashboard: 'dashboard',
    universities: 'universities',
    searchCourse: 'programpage4',
    addStudent: 'add-student',
    viewStudents: 'get-student',
    viewApplications: 'Get-Applications',
    primaryStatusApplications: 'Application_PrimaryStatus',
    secondaryStatusApplications: 'Application_SecondaryStatus',
    createUser: 'Create-User',
    getUsers: 'Users',
    partnerInformation: 'agent-form',
    storeUserAllocation: 'Partner_Users',
    enquiries: 'get-enquiry',
    createEnquiry: 'create-enquiry',
    accommodation: 'accommodation',
    viewSubmittedAccommodation: 'View_Accomodation',
    emailLogs: 'EmailLogs',
    itSupport: 'It-Support',
} as const;

export type PartnerSection =
    | 'Dashboard' | 'Universities/Courses' | 'Application' | 'Authentication'
    | 'Partner' | 'Enquiry' | 'Accommodation' | 'Email Settings' | 'Help Desk';

// Navigate straight to a route by building the URL from the tenant's base
// (env.<tenant>, e.g. 'https://vivekconsultancy.flyurdream.com/#/') — the
// most reliable way to reach a page, since the sidebar itself uses hover
// flyout submenus that are slower and more brittle to drive.
export async function gotoPartnerRoute(page: Page, tenantBaseUrl: string, route: string): Promise<void> {
    const base = tenantBaseUrl.replace(/\/?#\/?$/, '');
    await page.goto(`${base}/#/${route}`);
}

// Open a top-level sidebar section by its icon title (e.g. "Application").
// The sidebar is collapsed to icons only — sections are identified by the
// `title` attribute on `.nsm-link`, not visible text.
export async function openSidebarSection(page: Page, section: PartnerSection): Promise<void> {
    await page.locator(`.nsm-link[title="${section}"]`).click();
    await page.waitForTimeout(800);
}

// Click a submenu item's text after opening its parent section — use when
// testing the sidebar navigation itself (not just reaching a page).
export async function openSidebarItem(page: Page, section: PartnerSection, itemText: string): Promise<void> {
    await openSidebarSection(page, section);
    const link = page.locator('.nsm-submenu a, [class*="submenu"] a, [class*="sub-menu"] a')
        .filter({ hasText: itemText }).first();
    await link.click();
    await page.waitForTimeout(1500);
}

// The partner dashboard shows aggregate stats across ALL of the partner's
// students (unlike the student portal's single-person dashboard). Reads the
// four headline stat numbers for use in assertions/logging.
export async function readPartnerDashboardStats(page: Page) {
    return await page.evaluate(() => {
        const grab = (label: string) => {
            const el = Array.from(document.querySelectorAll('*'))
                .find(e => (e as HTMLElement).offsetParent !== null
                    && e.children.length === 0
                    && new RegExp(label, 'i').test(e.textContent || ''));
            return el?.textContent?.trim() || '';
        };
        return {
            totalStudents: grab('Total Students'),
            applications: grab('^Applications$'),
            activePartners: grab('Active Partners'),
            availableCourses: grab('Available Courses'),
        };
    });
}
