pipeline {
    agent any

    tools {
        nodejs 'NodeJS-22'
    }

    triggers {
        cron('H 3 * * *')
    }

    options {
        timestamps()
        timeout(time: 60, unit: 'MINUTES')
    }

    environment {
        HSC_APP_ID      = 'Not Captured'
        DIPLOMA_APP_ID  = 'Not Captured'

        // Playwright test result (based on actual exit code, not on ID scraping)
        HSC_TEST_RESULT     = 'FAIL'
        DIPLOMA_TEST_RESULT = 'FAIL'

        // Whether we managed to scrape an Application ID out of the log
        HSC_ID_STATUS     = 'NOT CAPTURED'
        DIPLOMA_ID_STATUS = 'NOT CAPTURED'
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

                    def hscExitCode = sh(
                        script: '''
                            set +e

                            npx playwright test \
                            tests/Daily_Jobs/mahindra-student-self-register-hsc.spec.ts \
                            --project=chromium 2>&1 | tee hsc-test-output.log

                            exit ${PIPESTATUS[0]}
                        ''',
                        returnStatus: true
                    )

                    def hscLog = fileExists('hsc-test-output.log') ? readFile('hsc-test-output.log') : ''

                    // DIAGNOSTIC — remove once ID capture is confirmed reliable again.
                    echo "DEBUG: hsc-test-output.log length=${hscLog.length()}, contains 'GUIDA'=${hscLog.contains('GUIDA')}"

                    def hscResult = extractAppId(hscLog)

                    env.HSC_APP_ID    = hscResult.appId
                    env.HSC_ID_STATUS = hscResult.found ? 'CAPTURED' : 'NOT CAPTURED'

                    // Test result comes from Playwright's own exit code — NOT from whether
                    // we managed to scrape an ID out of the console text. An app can be
                    // created successfully in the portal even if the ID-scrape step misses it.
                    // Explicit 'as int' cast: returnStatus values have been observed not to
                    // compare reliably against a bare int literal in this environment, which
                    // was silently forcing every run to FAIL regardless of the real exit code.
                    env.HSC_TEST_RESULT = ((hscExitCode as int) == 0) ? 'PASS' : 'FAIL'

                    echo "HSC Playwright Exit Code : ${hscExitCode}"
                    echo "HSC Test Result          : ${env.HSC_TEST_RESULT}"
                    echo "HSC Application ID       : ${env.HSC_APP_ID} (${env.HSC_ID_STATUS})"
                }
            }
        }

        stage('Mahindra — Student Self-Registers (Diploma Thorough)') {
            steps {
                script {
                    echo 'Running Diploma Thorough Student Self-Registration test...'

                    def diplomaExitCode = sh(
                        script: '''
                            set +e

                            npx playwright test \
                            tests/Daily_Jobs/mahindra-student-self-register-diploma-thorough.spec.ts \
                            --project=chromium 2>&1 | tee diploma-test-output.log

                            exit ${PIPESTATUS[0]}
                        ''',
                        returnStatus: true
                    )

                    def diplomaLog = fileExists('diploma-test-output.log') ? readFile('diploma-test-output.log') : ''

                    // DIAGNOSTIC — remove once ID capture is confirmed reliable again.
                    echo "DEBUG: diploma-test-output.log length=${diplomaLog.length()}, contains 'GUIDA'=${diplomaLog.contains('GUIDA')}"

                    def diplomaResult = extractAppId(diplomaLog)

                    env.DIPLOMA_APP_ID    = diplomaResult.appId
                    env.DIPLOMA_ID_STATUS = diplomaResult.found ? 'CAPTURED' : 'NOT CAPTURED'

                    env.DIPLOMA_TEST_RESULT = ((diplomaExitCode as int) == 0) ? 'PASS' : 'FAIL'

                    echo "Diploma Playwright Exit Code : ${diplomaExitCode}"
                    echo "Diploma Test Result          : ${env.DIPLOMA_TEST_RESULT}"
                    echo "Diploma Application ID       : ${env.DIPLOMA_APP_ID} (${env.DIPLOMA_ID_STATUS})"
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
                    echo "HSC Test Result         : ${env.HSC_TEST_RESULT}"
                    echo "HSC Application ID      : ${env.HSC_APP_ID} (${env.HSC_ID_STATUS})"
                    echo ''
                    echo "Diploma Test Result     : ${env.DIPLOMA_TEST_RESULT}"
                    echo "Diploma Application ID  : ${env.DIPLOMA_APP_ID} (${env.DIPLOMA_ID_STATUS})"
                    echo '====================================================='

                    // Overall build status is now driven purely by whether the
                    // Playwright specs actually passed — not by ID-scrape success.
                    if (env.HSC_TEST_RESULT == 'PASS' && env.DIPLOMA_TEST_RESULT == 'PASS') {
                        currentBuild.result = 'SUCCESS'
                        echo 'SUCCESS: Both Playwright tests passed.'

                        if (env.HSC_ID_STATUS == 'NOT CAPTURED' || env.DIPLOMA_ID_STATUS == 'NOT CAPTURED') {
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
                        diploma-test-output.log
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
                def hscStatusColor     = env.HSC_TEST_RESULT == 'PASS' ? '#4f7d3a' : '#a83a2b'
                def diplomaStatusColor = env.DIPLOMA_TEST_RESULT == 'PASS' ? '#4f7d3a' : '#a83a2b'

                // ID badge color: green if captured, amber if not captured (but test still passed),
                // red only if the test itself failed too.
                def hscIdColor = (env.HSC_ID_STATUS == 'CAPTURED') ? '#4f7d3a' :
                                  (env.HSC_TEST_RESULT == 'PASS') ? '#b58a1e' : '#a83a2b'

                def diplomaIdColor = (env.DIPLOMA_ID_STATUS == 'CAPTURED') ? '#4f7d3a' :
                                      (env.DIPLOMA_TEST_RESULT == 'PASS') ? '#b58a1e' : '#a83a2b'

                def hscIdLabel = (env.HSC_ID_STATUS == 'CAPTURED') ? env.HSC_APP_ID :
                                  (env.HSC_TEST_RESULT == 'PASS') ? 'Created (ID not captured)' : 'Not Created'

                def diplomaIdLabel = (env.DIPLOMA_ID_STATUS == 'CAPTURED') ? env.DIPLOMA_APP_ID :
                                      (env.DIPLOMA_TEST_RESULT == 'PASS') ? 'Created (ID not captured)' : 'Not Created'

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

            <p style="font-size:15px;margin-top:0;">
                Hi Team,
            </p>

            <p style="font-size:14px;line-height:22px;">
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
                        ● ${env.HSC_TEST_RESULT}
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
                        ● ${env.DIPLOMA_TEST_RESULT}
                    </td>
                </tr>

            </table>

            <p style="font-size:12px;color:#777777;margin-top:10px;">
                Note: "Created (ID not captured)" means the Playwright test passed but the automation
                could not scrape an Application ID out of the console log — the application may still
                have been created successfully in the portal and should be checked manually.
            </p>


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
                echo "HSC TEST RESULT          : ${env.HSC_TEST_RESULT}"
                echo "HSC APPLICATION ID       : ${env.HSC_APP_ID} (${env.HSC_ID_STATUS})"
                echo "DIPLOMA TEST RESULT      : ${env.DIPLOMA_TEST_RESULT}"
                echo "DIPLOMA APPLICATION ID   : ${env.DIPLOMA_APP_ID} (${env.DIPLOMA_ID_STATUS})"
                echo '====================================================='
            }
        }
    }
}

/**
 * Extracts a GUIDA application ID from a raw Playwright console log.
 *
 * Robust against the common silent-failure causes seen in practice:
 *   - ANSI color/escape codes wrapped around or inside the ID text
 *   - Extra whitespace / line-wrapping around the marker text
 *   - Multiple possible marker phrases used by different test scripts
 *
 * Returns a map: [found: Boolean, appId: String]
 */
@NonCPS
def extractAppId(String rawLog) {
    if (!rawLog) {
        return [found: false, appId: 'Not Captured']
    }

    // Strip ANSI escape sequences (color codes etc.) that can otherwise split
    // or hide the ID text when scraped from a CI console log.
    def cleanLog = rawLog.replaceAll(/\x1B\[[0-9;]*[a-zA-Z]/, '')

    // Try the most specific markers first, then fall back to a bare ID scan.
    // NOTE: uses Groovy's built-in =~ operator with an inline (?i) case-insensitive
    // flag instead of java.util.regex.Pattern — the Jenkins script-security sandbox
    // blocks direct access to Pattern.compile()/Pattern.CASE_INSENSITIVE unless an
    // admin whitelists that signature, so this avoids needing any approval.
    def patterns = [
        /(?i)CREATED APP ID:\s*(GUIDA\d+)/,
        /(?i)submitted an application[^\n]*id\s*[:=]?\s*(GUIDA\d+)/,
        /(?i)application ID capture:\s*(GUIDA\d+)/,
        /(?i)(GUIDA\d+)/
    ]

    for (p in patterns) {
        def m = (cleanLog =~ p)
        if (m.find()) {
            return [found: true, appId: m.group(1)]
        }
    }

    return [found: false, appId: 'Not Captured']
}
