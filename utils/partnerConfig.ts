import { env } from './environmenturls';

// Single place to point the whole tests/vivekconsultancy-partner suite at a
// different partner tenant/company — every script in that folder reads its
// portal + credentials from here, so switching companies is a one-line change
// (or override via environment variables, no file edit needed):
//
//   PARTNER_TENANT=hydftem PARTNER_EMAIL=hydfteam@mailinator.com PARTNER_PASSWORD=Data@1234 \
//     npx playwright test tests/vivekconsultancy-partner
//
// PARTNER_TENANT must be a key from utils/environmenturls.ts (env.*).
const tenantKey = (process.env.PARTNER_TENANT as keyof typeof env) || 'vivekconsultancy';

export const partnerConfig = {
    tenantKey,
    portalUrl: env[tenantKey] || env.vivekconsultancy,
    email: process.env.PARTNER_EMAIL || 'qapartnergopi@gmail.com',
    password: process.env.PARTNER_PASSWORD || 'Data@1234',
};
