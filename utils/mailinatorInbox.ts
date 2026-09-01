import { Page } from '@playwright/test';

// Reads a message from a Mailinator PUBLIC inbox — no signup or API key exists for
// this (Mailinator's Message API requires a paid Private Domain subscription even
// for public inboxes), so this drives the real public inbox page the same way a
// user checking their mail would: https://www.mailinator.com/v4/public/inboxes.jsp?to=<localPart>
// New mail arrives there via a websocket the page opens on load — no manual
// reload loop needed, just a generous wait for the message row to appear.
//
// Message rows sit in the same <tbody> as the static "From / Subject / Received"
// header row — Angular's ng-repeat is what tells them apart (rows carry an
// `ng-scope` class the header doesn't), confirmed live against a real inbox.
//
// Clicking a row is how the inbox's own UI loads the message — this captures
// that same `/fetch_public?msgid=...` call (same-origin, undocumented but is
// exactly what the page itself relies on) instead of scraping the sanitized
// on-page iframe, so the returned subject/HTML/links are the exact source.

export type MailinatorMessage = {
    id: string;
    subject: string;
    from: string;
    html: string;
    links: { link: string; text: string }[];
};

export async function fetchMailinatorMessage(
    page: Page,
    localPart: string,
    opts: { subjectMatch?: RegExp; timeout?: number } = {}
): Promise<MailinatorMessage | null> {
    const timeout = opts.timeout ?? 60000;
    await page.goto(`https://www.mailinator.com/v4/public/inboxes.jsp?to=${localPart}`);

    const row = page.locator('table tr.ng-scope', { hasText: opts.subjectMatch }).first();
    const arrived = await row.waitFor({ state: 'visible', timeout }).then(() => true).catch(() => false);
    if (!arrived) return null;

    const [resp] = await Promise.all([
        page.waitForResponse(r => /\/fetch_public\?msgid=/.test(r.url()), { timeout: 15000 }).catch(() => null),
        row.click(),
    ]);
    if (!resp) return null;

    const json = await resp.json().catch(() => null);
    const d = json?.data;
    if (!d) return null;

    const htmlPart = (d.parts || []).find((p: any) => /text\/html/i.test(p.headers?.['content-type'] || ''));

    return {
        id: d.id || '',
        subject: d.subject || '',
        from: d.from || '',
        html: htmlPart?.body || '',
        links: d.clickablelinks || [],
    };
}

// Sanity-checks that an email actually carries real styling. Every GuideUni
// transactional template observed uses inline style="..." attributes, a
// table-based layout, and the partner's branding logo — a template that
// silently lost its CSS (a broken render, a stripped style block, a partial
// send) would otherwise pass a plain "the email arrived" check with no signal.
// Returns an empty array when styling looks intact.
export function findMissingStyling(html: string): string[] {
    const problems: string[] = [];
    if (html.length < 400) problems.push(`body is unexpectedly short (${html.length} chars) — template may not have rendered`);
    if (!/style\s*=/.test(html)) problems.push('no inline style="..." attributes found');
    if (!/<table/i.test(html)) problems.push('no <table> layout structure found');
    if (!/<img[^>]+partnerlogo/i.test(html)) problems.push('no branding logo <img> found');
    return problems;
}
