import * as fs from 'fs';
import * as path from 'path';

// Persistent store of registered student credentials for reuse across tests.
// File: test-data/registered-students.json (created on first save).
//
// Usage:
//   import { saveStudent, latestVerifiedStudent, loadStudents } from '../utils/studentStore';
//   const student = latestVerifiedStudent();          // newest working account
//   await login(page, env.vivekconsultancy, student.email, student.password);

export type RegisteredStudent = {
    salutation: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    mobile: string;
    portal: string;           // e.g. 'vivekconsultancy'
    registeredAt: string;     // ISO timestamp
    loginVerified: boolean;   // true = signing in with these credentials worked
};

// Resolve the project root by walking up from the current directory until the
// playwright config is found — works no matter which subfolder the tests are
// launched from (e.g. running inside tests/).
function projectRoot(): string {
    let dir = process.cwd();
    for (let i = 0; i < 8; i++) {
        if (fs.existsSync(path.join(dir, 'playwright.config.ts'))
            || fs.existsSync(path.join(dir, 'playwright.config.js'))) return dir;
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return process.cwd();
}

const FILE = path.join(projectRoot(), 'test-data', 'registered-students.json');

export function loadStudents(): RegisteredStudent[] {
    try {
        return JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch {
        return [];
    }
}

export function saveStudent(student: RegisteredStudent): string {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    const students = loadStudents();
    // Upsert by email+portal — re-storing a student updates the existing entry
    const existing = students.findIndex(s =>
        s.email.toLowerCase() === student.email.toLowerCase() && s.portal === student.portal);
    if (existing >= 0) students[existing] = student;
    else students.push(student);
    fs.writeFileSync(FILE, JSON.stringify(students, null, 2));
    return FILE;
}

// Newest credentials that are known to work for login.
export function latestVerifiedStudent(portal = 'vivekconsultancy'): RegisteredStudent | undefined {
    return loadStudents().filter(s => s.loginVerified && s.portal === portal).pop();
}
