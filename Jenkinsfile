// Plain script-level state, deliberately kept OUTSIDE Jenkins' environment{}/withEnv
// machinery. The custom fields below were previously declared with defaults inside
// the pipeline's top-level environment{} block and updated via env.X = value from
// within stages — but env.X assignments made after Jenkins' withEnv wrapping (visible
// in the console log as nested "withEnv { withEnv { ... } }" around the whole build)
// were not being reflected when read back via ${env.X} string interpolation within
// that same wrapped scope; every read kept resolving to the original declared default,
// regardless of what was actually computed. A plain Groovy Map avoids that entirely —
// it's an ordinary object in the script's binding, with no relation to withEnv at all.
def results = [
    hscAppId              : 'Not Captured',
    hscIdStatus           : 'NOT CAPTURED',
    hscTestResult         : 'FAIL',
    hscTemplateResults    : [:],
    hscTemplateDefects    : [],
    diplomaAppId          : 'Not Captured',
    diplomaIdStatus       : 'NOT CAPTURED',
    diplomaTestResult     : 'FAIL',
    diplomaTemplateResults: [:],
    diplomaTemplateDefects: []
]

// The four points in the self-register flow where the app emails the
// student — each spec logs one "TEMPLATE RESULT: <name> = PASS|FAIL" line
// per name once its checks finish. Fixed order matches the flow itself.
def TEMPLATE_NAMES = ['Verify Email', 'Welcome Email', 'Student ID Email', 'Application Email']

pipeline {
    agent any

    tools {
        nodejs 'NodeJS-22'
    }

      triggers {
        // Run every day at 9:00 AM and 6:00 PM
        cron('0 9,18 * * *')
    }
    
    options {
        timestamps()
        timeout(time: 60, unit: 'MINUTES')
    }

    stages {

        stage('Install Dependencies') {
            steps {
                sh '''
                    echo "Node version:"
                    node --version

                    echo "NPM version:"
                    npm --version

                    echo "Installing dependencies..."
                    npm ci

                    echo "Installing Playwright Chromium..."
                    npx playwright install chromium
                '''
            }
        }

        stage('Mahindra — Student Self-Registers (HSC)') {
            steps {
                script {
                    echo 'Running HSC Student Self-Registration test...'

                    // Exit code is written to a file by the shell itself and read back as
                    // plain text. Groovy's sh(returnStatus:true) value was found to compare
                    // unreliably against int/String literals in this sandbox — this sidesteps
                    // that entirely: no Groovy-side type coercion involved anywhere.
                    sh '''
                        set +e

                        npx playwright test \
                        tests/Daily_Jobs/mahindra-student-self-register-hsc.spec.ts \
                        --project=chromium 2>&1 | tee hsc-test-output.log

                        echo ${PIPESTATUS[0]} > hsc-exit-code.txt
                    '''

                    def hscExitCode = fileExists('hsc-exit-code.txt') ? readFile('hsc-exit-code.txt').trim() : '1'
                    def hscLog      = fileExists('hsc-test-output.log') ? readFile('hsc-test-output.log') : ''

                    def hscResult = extractAppId(hscLog)

                    results.hscAppId = hscResult.appId
                    if (hscResult.found) {
                        results.hscIdStatus = 'CAPTURED'
                    } else {
                        results.hscIdStatus = 'NOT CAPTURED'
                    }

                    if (hscExitCode == '0') {
                        results.hscTestResult = 'PASS'
                    } else {
                        results.hscTestResult = 'FAIL'
                    }

                    // The spec itself opens the real Mailinator inbox at each of the
                    // four points a student receives an email. It logs one
                    // "TEMPLATE RESULT: <name> = PASS|FAIL" line per email once its
                    // checks finish, plus a "TEMPLATE DEFECT: ..." line for every
                    // individual thing wrong with what actually arrived — pull both
                    // out the same way extractAppId does.
                    results.hscTemplateResults = extractTemplateResults(hscLog)
                    results.hscTemplateDefects = extractTemplateDefects(hscLog)

                    echo "HSC Playwright Exit Code : ${hscExitCode}"
                    echo "HSC Test Result          : ${results.hscTestResult}"
                    echo "HSC Application ID       : ${results.hscAppId} (${results.hscIdStatus})"
                    echo "HSC Template Results     : ${results.hscTemplateResults}"
                }
            }
        }

        stage('Mahindra — Student Self-Registers (Diploma Thorough)') {
            steps {
                script {
                    echo 'Running Diploma Thorough Student Self-Registration test...'

                    sh '''
                        set +e

                        npx playwright test \
                        tests/Daily_Jobs/mahindra-student-self-register-diploma-thorough.spec.ts \
                        --project=chromium 2>&1 | tee diploma-test-output.log

                        echo ${PIPESTATUS[0]} > diploma-exit-code.txt
                    '''

                    def diplomaExitCode = fileExists('diploma-exit-code.txt') ? readFile('diploma-exit-code.txt').trim() : '1'
                    def diplomaLog      = fileExists('diploma-test-output.log') ? readFile('diploma-test-output.log') : ''

                    def diplomaResult = extractAppId(diplomaLog)

                    results.diplomaAppId = diplomaResult.appId
                    if (diplomaResult.found) {
                        results.diplomaIdStatus = 'CAPTURED'
                    } else {
                        results.diplomaIdStatus = 'NOT CAPTURED'
                    }

                    if (diplomaExitCode == '0') {
                        results.diplomaTestResult = 'PASS'
                    } else {
                        results.diplomaTestResult = 'FAIL'
                    }

                    results.diplomaTemplateResults = extractTemplateResults(diplomaLog)
                    results.diplomaTemplateDefects = extractTemplateDefects(diplomaLog)

                    echo "Diploma Playwright Exit Code : ${diplomaExitCode}"
                    echo "Diploma Test Result          : ${results.diplomaTestResult}"
                    echo "Diploma Application ID       : ${results.diplomaAppId} (${results.diplomaIdStatus})"
                    echo "Diploma Template Results     : ${results.diplomaTemplateResults}"
                }
            }
        }

        stage('Validate Application Creation') {
            steps {
                script {
                    echo ''
                    echo '====================================================='
                    echo 'APPLICATION CREATION SUMMARY'
                    echo '====================================================='
                    echo "HSC Test Result         : ${results.hscTestResult}"
                    echo "HSC Application ID      : ${results.hscAppId} (${results.hscIdStatus})"
                    echo "HSC Template Results    : ${results.hscTemplateResults}"
                    echo ''
                    echo "Diploma Test Result     : ${results.diplomaTestResult}"
                    echo "Diploma Application ID  : ${results.diplomaAppId} (${results.diplomaIdStatus})"
                    echo "Diploma Template Results: ${results.diplomaTemplateResults}"
                    echo '====================================================='

                    // Overall build status is now driven purely by whether the
                    // Playwright specs actually passed — not by ID-scrape success.
                    if (results.hscTestResult == 'PASS' && results.diplomaTestResult == 'PASS') {
                        currentBuild.result = 'SUCCESS'
                        echo 'SUCCESS: Both Playwright tests passed.'

                        if (results.hscIdStatus == 'NOT CAPTURED' || results.diplomaIdStatus == 'NOT CAPTURED') {
                            echo 'NOTE: One or more Application IDs could not be scraped from the log, ' +
                                 'even though the application was likely created in the portal. Check manually.'
                        }
                    } else {
                        currentBuild.result = 'FAILURE'
                        echo 'FAILURE: One or more Playwright tests failed.'
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                echo 'Publishing Playwright reports...'

                archiveArtifacts(
                    artifacts: '''
                        playwright-report/**,
                        test-results/**,
                        hsc-test-output.log,
                        diploma-test-output.log,
                        hsc-exit-code.txt,
                        diploma-exit-code.txt
                    ''',
                    allowEmptyArchive: true
                )

                junit(
                    testResults: 'test-results/**/*.xml',
                    allowEmptyResults: true
                )

                def overallStatus = currentBuild.currentResult ?: 'SUCCESS'

                def statusColor = overallStatus == 'SUCCESS' ? '#4f7d3a' : '#a83a2b'

                // Row color reflects the real Playwright test result.
                def hscStatusColor     = results.hscTestResult == 'PASS' ? '#4f7d3a' : '#a83a2b'
                def diplomaStatusColor = results.diplomaTestResult == 'PASS' ? '#4f7d3a' : '#a83a2b'

                // ID badge color: green if captured, amber if not captured (but test still passed),
                // red only if the test itself failed too.
                def hscIdColor = (results.hscIdStatus == 'CAPTURED') ? '#4f7d3a' :
                                  (results.hscTestResult == 'PASS') ? '#b58a1e' : '#a83a2b'

                def diplomaIdColor = (results.diplomaIdStatus == 'CAPTURED') ? '#4f7d3a' :
                                      (results.diplomaTestResult == 'PASS') ? '#b58a1e' : '#a83a2b'

                def hscIdLabel = (results.hscIdStatus == 'CAPTURED') ? results.hscAppId :
                                  (results.hscTestResult == 'PASS') ? 'Created (ID not captured)' : 'Not Created'

                def diplomaIdLabel = (results.diplomaIdStatus == 'CAPTURED') ? results.diplomaAppId :
                                      (results.diplomaTestResult == 'PASS') ? 'Created (ID not captured)' : 'Not Created'

                // Pre-build the template-results table rows and the per-run defect
                // detail lists as plain strings before the emailext body — a GString
                // can't loop over a List inline, so this mirrors how hscIdLabel/
                // diplomaIdColor etc. are precomputed above.
                def templateResultRowsHtml = buildTemplateResultsTableRows(TEMPLATE_NAMES, results.hscTemplateResults, results.diplomaTemplateResults)
                def hscDefectsHtml     = buildDefectListHtml(results.hscTemplateDefects)
                def diplomaDefectsHtml = buildDefectListHtml(results.diplomaTemplateDefects)

                emailext(
                    to: 'durgaprasad@flyurdream.com,gopikrishna@excellait.co.uk,manikannta@flyurdream.com',

                    from: 'Durgaprasad <durgaprasad@flyurdream.com>',

                    subject: "[Student Self Registration] ${overallStatus} - Build #${env.BUILD_NUMBER}",

                    mimeType: 'text/html',

                    body: """
<html>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#333333;">

    <div style="width:760px;max-width:100%;margin:30px auto;background:#ffffff;">

        <!-- Header -->
        <div style="background:#2f6b2f;padding:22px 26px;">
            <span style="color:#8fbc4f;font-size:26px;">●</span>
            <span style="color:#ffffff;font-size:22px;font-weight:bold;margin-left:8px;">
                Student Self Registration Report
            </span>
        </div>

        <div style="padding:24px 26px;">

            <p style="font-size:14px;line-height:22px;margin-top:0;">
                Please find below the automated Student Self Registration execution results.
            </p>


            <!-- Build Summary -->
            <h3 style="font-size:16px;border-bottom:1px solid #dddddd;padding-bottom:10px;margin-top:28px;">
                Build Summary
            </h3>

            <table cellpadding="0" cellspacing="0"
                   style="width:100%;border-collapse:collapse;font-size:14px;">

                <tr>
                    <td style="padding:10px;background:#f1f1f1;border-bottom:1px solid #dddddd;font-weight:bold;width:35%;">
                        Status
                    </td>
                    <td style="padding:10px;border-bottom:1px solid #dddddd;color:${statusColor};font-weight:bold;">
                        ${overallStatus}
                    </td>
                </tr>

                <tr>
                    <td style="padding:10px;background:#f1f1f1;border-bottom:1px solid #dddddd;font-weight:bold;">
                        Project
                    </td>
                    <td style="padding:10px;border-bottom:1px solid #dddddd;">
                        Student Self Registration
                    </td>
                </tr>

                <tr>
                    <td style="padding:10px;background:#f1f1f1;border-bottom:1px solid #dddddd;font-weight:bold;">
                        Build Number
                    </td>
                    <td style="padding:10px;border-bottom:1px solid #dddddd;">
                        #${env.BUILD_NUMBER}
                    </td>
                </tr>

                <tr>
                    <td style="padding:10px;background:#f1f1f1;border-bottom:1px solid #dddddd;font-weight:bold;">
                        Date & Time
                    </td>
                    <td style="padding:10px;border-bottom:1px solid #dddddd;">
                        ${new Date().format("dd-MM-yyyy HH:mm:ss")}
                    </td>
                </tr>

                <tr>
                    <td style="padding:10px;background:#f1f1f1;border-bottom:1px solid #dddddd;font-weight:bold;">
                        Agent
                    </td>
                    <td style="padding:10px;border-bottom:1px solid #dddddd;">
                        ${env.NODE_NAME}
                    </td>
                </tr>

                <tr>
                    <td style="padding:10px;background:#f1f1f1;font-weight:bold;">
                        Execution Time
                    </td>
                    <td style="padding:10px;">
                        ${currentBuild.durationString.replace(' and counting', '')}
                    </td>
                </tr>

            </table>


            <!-- Application Results -->
            <h3 style="font-size:16px;border-bottom:1px solid #dddddd;padding-bottom:10px;margin-top:30px;">
                Application Creation Results
            </h3>

            <table cellpadding="0" cellspacing="0"
                   style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid #dddddd;">

                <tr style="background:#3b3b3b;color:#ffffff;">
                    <th style="padding:12px;text-align:left;border-right:1px solid #555555;">
                        Test
                    </th>
                    <th style="padding:12px;text-align:left;border-right:1px solid #555555;">
                        Application ID
                    </th>
                    <th style="padding:12px;text-align:left;">
                        Test Result
                    </th>
                </tr>

                <!-- HSC -->
                <tr>
                    <td style="padding:12px;border-top:1px solid #dddddd;border-right:1px solid #dddddd;">
                        Mahindra — Student Self-Registers (HSC)
                    </td>

                    <td style="padding:12px;border-top:1px solid #dddddd;border-right:1px solid #dddddd;font-weight:bold;color:${hscIdColor};">
                        ${hscIdLabel}
                    </td>

                    <td style="padding:12px;border-top:1px solid #dddddd;color:${hscStatusColor};font-weight:bold;">
                        ● ${results.hscTestResult}
                    </td>
                </tr>

                <!-- Diploma -->
                <tr>
                    <td style="padding:12px;border-top:1px solid #dddddd;border-right:1px solid #dddddd;">
                        Mahindra — Student Self-Registers (Diploma Thorough)
                    </td>

                    <td style="padding:12px;border-top:1px solid #dddddd;border-right:1px solid #dddddd;font-weight:bold;color:${diplomaIdColor};">
                        ${diplomaIdLabel}
                    </td>

                    <td style="padding:12px;border-top:1px solid #dddddd;color:${diplomaStatusColor};font-weight:bold;">
                        ● ${results.diplomaTestResult}
                    </td>
                </tr>

            </table>

            <p style="font-size:12px;color:#777777;margin-top:10px;">
                Note: "Created (ID not captured)" means the Playwright test passed but the automation
                could not scrape an Application ID out of the console log — the application may still
                have been created successfully in the portal and should be checked manually.
            </p>


            <!-- Email Template Check Results -->
            <h3 style="font-size:16px;border-bottom:1px solid #dddddd;padding-bottom:10px;margin-top:30px;">
                Email Template Check Results
            </h3>

            <p style="font-size:12px;color:#777777;margin-top:0;">
                Each run opens the real inbox and checks the four emails a student actually
                receives — subject wording, personalization, link destinations, and whether
                the CSS/branding rendered. "NOT RUN" means the wizard stopped before that
                email would have fired.
            </p>

            <table cellpadding="0" cellspacing="0"
                   style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid #dddddd;">

                <tr style="background:#3b3b3b;color:#ffffff;">
                    <th style="padding:12px;text-align:left;border-right:1px solid #555555;">
                        Template
                    </th>
                    <th style="padding:12px;text-align:left;border-right:1px solid #555555;">
                        HSC Result
                    </th>
                    <th style="padding:12px;text-align:left;">
                        Diploma Thorough Result
                    </th>
                </tr>

                ${templateResultRowsHtml}

            </table>

            <p style="font-size:13px;font-weight:bold;color:#333333;margin:20px 0 4px;">
                Details — HSC run
            </p>
            <ul style="font-size:13px;line-height:22px;margin-top:0;padding-left:20px;">
                ${hscDefectsHtml}
            </ul>

            <p style="font-size:13px;font-weight:bold;color:#333333;margin:16px 0 4px;">
                Details — Diploma Thorough run
            </p>
            <ul style="font-size:13px;line-height:22px;margin-top:0;padding-left:20px;">
                ${diplomaDefectsHtml}
            </ul>


            <!-- Tests Executed -->
            <h3 style="font-size:16px;border-bottom:1px solid #dddddd;padding-bottom:10px;margin-top:30px;">
                Tests Executed
            </h3>

            <ul style="font-size:14px;line-height:24px;">
                <li>Mahindra — Student Self-Registers (HSC)</li>
                <li>Mahindra — Student Self-Registers (Diploma Thorough)</li>
            </ul>


            <!-- Execution Schedule -->
            <h3 style="font-size:16px;border-bottom:1px solid #dddddd;padding-bottom:10px;margin-top:30px;">
                Execution Schedule
            </h3>

            <p style="font-size:14px;">
                <strong>Daily:</strong> Scheduled automatically by Jenkins
            </p>


            <!-- Build Links -->
            <h3 style="font-size:16px;border-bottom:1px solid #dddddd;padding-bottom:10px;margin-top:30px;">
                Build Links
            </h3>

            <a href="${env.BUILD_URL}"
               style="display:inline-block;background:#356b3c;color:#ffffff;text-decoration:none;padding:12px 20px;font-weight:bold;margin-right:10px;">
                View Build
            </a>

            <a href="${env.BUILD_URL}console"
               style="display:inline-block;background:#356b3c;color:#ffffff;text-decoration:none;padding:12px 20px;font-weight:bold;">
                Console Output
            </a>


            <div style="border-top:1px solid #dddddd;margin-top:34px;padding-top:18px;font-size:12px;color:#777777;">
                Generated automatically by Jenkins<br>
                Project: Student Self Registration
            </div>

        </div>
    </div>

</body>
</html>
                    """
                )

                echo ''
                echo '====================================================='
                echo "BUILD STATUS             : ${overallStatus}"
                echo "HSC TEST RESULT          : ${results.hscTestResult}"
                echo "HSC APPLICATION ID       : ${results.hscAppId} (${results.hscIdStatus})"
                echo "HSC TEMPLATE RESULTS     : ${results.hscTemplateResults}"
                echo "DIPLOMA TEST RESULT      : ${results.diplomaTestResult}"
                echo "DIPLOMA APPLICATION ID   : ${results.diplomaAppId} (${results.diplomaIdStatus})"
                echo "DIPLOMA TEMPLATE RESULTS : ${results.diplomaTemplateResults}"
                echo '====================================================='
            }
        }
    }
}

/**
 * Extracts a GUIDA application ID from a raw Playwright console log using a
 * plain forward string scan (no regex) — case-insensitive.
 *
 * Returns a map: [found: Boolean, appId: String]
 */
@NonCPS
def extractAppId(String rawLog) {
    if (!rawLog) {
        return [found: false, appId: 'Not Captured']
    }

    // Deliberately avoids regex entirely (java.util.regex / Groovy =~ both showed
    // unreliable behavior in this Jenkins sandbox — matches silently failing even
    // against text confirmed present via plain .contains()). This does a manual
    // forward scan instead: find "GUIDA", then collect the digits that follow it.
    // Case-insensitive, no external API calls beyond basic String/Character methods.
    def marker = 'GUIDA'
    def upperLog = rawLog.toUpperCase()
    def searchFrom = 0

    while (true) {
        def idx = upperLog.indexOf(marker, searchFrom)
        if (idx < 0) {
            break
        }

        def digitsStart = idx + marker.length()
        def i = digitsStart
        while (i < rawLog.length()) {
            int code = (int) rawLog.charAt(i)
            if (code < 48 || code > 57) {
                // Not an ASCII digit ('0'-'9' are codes 48-57) — stop collecting.
                break
            }
            i++
        }

        if (i > digitsStart) {
            // Found at least one digit after "GUIDA" — treat as a match.
            def appId = 'GUIDA' + rawLog.substring(digitsStart, i)
            return [found: true, appId: appId]
        }

        // "GUIDA" appeared but wasn't followed by digits (e.g. part of another
        // word) — keep scanning forward in case it appears again later.
        searchFrom = idx + marker.length()
    }

    return [found: false, appId: 'Not Captured']
}

/**
 * Pulls every "TEMPLATE RESULT: <name> = PASS|FAIL" line out of a raw
 * Playwright console log — the spec logs exactly one of these per email
 * template once its checks finish. Same plain forward-scan style as
 * extractAppId, no regex.
 *
 * Returns a Map<String,String> of template name -> "PASS"/"FAIL", covering
 * only the templates whose checks actually ran (a template the wizard never
 * reached simply won't have an entry — callers treat a missing key as
 * "NOT RUN").
 */
@NonCPS
def extractTemplateResults(String rawLog) {
    def resultsMap = [:]
    if (!rawLog) {
        return resultsMap
    }

    def marker = 'TEMPLATE RESULT:'
    def searchFrom = 0

    while (true) {
        def idx = rawLog.indexOf(marker, searchFrom)
        if (idx < 0) {
            break
        }

        def lineEnd = rawLog.indexOf('\n', idx)
        if (lineEnd < 0) {
            lineEnd = rawLog.length()
        }

        // Line looks like "TEMPLATE RESULT: Verify Email = PASS"
        def line = rawLog.substring(idx + marker.length(), lineEnd).trim()
        def eqIdx = line.lastIndexOf('=')
        if (eqIdx > 0) {
            def name = line.substring(0, eqIdx).trim()
            def status = line.substring(eqIdx + 1).trim()
            resultsMap[name] = status
        }

        searchFrom = lineEnd
    }

    return resultsMap
}

/**
 * Pulls every "TEMPLATE DEFECT: ..." line out of a raw Playwright console
 * log — the spec logs one of these for each individual thing wrong with an
 * actual delivered email (subject wording, broken links, missing CSS,
 * wrong domain). Same plain forward-scan style as extractAppId, no regex.
 *
 * Returns a List<String> of the defect messages found, in log order.
 */
@NonCPS
def extractTemplateDefects(String rawLog) {
    def defects = []
    if (!rawLog) {
        return defects
    }

    def marker = 'TEMPLATE DEFECT:'
    def searchFrom = 0

    while (true) {
        def idx = rawLog.indexOf(marker, searchFrom)
        if (idx < 0) {
            break
        }

        def lineEnd = rawLog.indexOf('\n', idx)
        if (lineEnd < 0) {
            lineEnd = rawLog.length()
        }

        def msg = rawLog.substring(idx + marker.length(), lineEnd).trim()
        if (msg) {
            defects << msg
        }
        searchFrom = lineEnd
    }

    return defects
}

/**
 * Turns a list of defect message strings into the <li> markup for the
 * report email's Details subsection — green checkmark line when the list
 * is empty, one red bullet per defect otherwise. Kept as plain string
 * concatenation (no GString loop) since a GString body can't iterate a
 * List inline.
 */
@NonCPS
def buildDefectListHtml(List defects) {
    if (!defects || defects.isEmpty()) {
        return '<li style="color:#4f7d3a;list-style:none;margin-left:-20px;">&#10003; No individual defects found — every check passed.</li>'
    }

    def html = ''
    defects.each { defect ->
        html += "<li style=\"color:#a83a2b;\">${defect}</li>"
    }
    return html
}

/**
 * Maps a template status string to the same green/red/amber palette used
 * elsewhere in the report — PASS green, FAIL red, anything else (i.e. the
 * template's checks never ran) amber, matching how a not-yet-created
 * Application ID is shown.
 */
@NonCPS
def templateStatusColor(String status) {
    if (status == 'PASS') {
        return '#4f7d3a'
    }
    if (status == 'FAIL') {
        return '#a83a2b'
    }
    return '#b58a1e'
}

/**
 * Builds the <tr> markup for the Email Template Check Results table — one
 * row per template name, HSC result and Diploma result side by side. Kept
 * as plain string concatenation (no GString loop) since a GString body
 * can't iterate a List inline.
 */
@NonCPS
def buildTemplateResultsTableRows(List names, Map hscResults, Map diplomaResults) {
    def rowsHtml = ''
    names.each { name ->
        def hscStatus     = hscResults.containsKey(name) ? hscResults[name] : 'NOT RUN'
        def diplomaStatus = diplomaResults.containsKey(name) ? diplomaResults[name] : 'NOT RUN'
        def hscColor     = templateStatusColor(hscStatus)
        def diplomaColor = templateStatusColor(diplomaStatus)

        rowsHtml += """
                <tr>
                    <td style="padding:12px;border-top:1px solid #dddddd;border-right:1px solid #dddddd;">
                        ${name}
                    </td>
                    <td style="padding:12px;border-top:1px solid #dddddd;border-right:1px solid #dddddd;color:${hscColor};font-weight:bold;">
                        ● ${hscStatus}
                    </td>
                    <td style="padding:12px;border-top:1px solid #dddddd;color:${diplomaColor};font-weight:bold;">
                        ● ${diplomaStatus}
                    </td>
                </tr>"""
    }
    return rowsHtml
}
