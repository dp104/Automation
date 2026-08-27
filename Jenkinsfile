pipeline {
    agent any

    triggers {
        cron('H 3 * * *')
    }

    options {
        timestamps()
        timeout(time: 60, unit: 'MINUTES')
    }

    environment {
        HSC_APP_ID = 'Not Created'
        DIPLOMA_APP_ID = 'Not Created'

        HSC_STATUS = 'FAIL'
        DIPLOMA_STATUS = 'FAIL'
    }

    stages {

        stage('Install Dependencies') {
            steps {
                echo 'Installing Node.js dependencies...'

                sh '''
                    export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

                    echo "Node version:"
                    node --version

                    echo "NPM version:"
                    npm --version

                    npm ci
                    npx playwright install chromium
                '''
            }
        }

        stage('Mahindra — Student Self-Registers (HSC)') {
            steps {
                script {
                    def testExitCode = sh(
                        script: '''
                            export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

                            rm -f hsc-output.log

                            npx playwright test \
                            tests/Daily_Jobs/mahindra-student-self-register-hsc.spec.ts \
                            --project=chromium 2>&1 | tee hsc-output.log

                            exit ${PIPESTATUS[0]}
                        ''',
                        returnStatus: true
                    )

                    def output = sh(
                        script: 'cat hsc-output.log 2>/dev/null || true',
                        returnStdout: true
                    ).trim()

                    /*
                     * Searches for Application IDs such as:
                     * GUIDA1249
                     * GUID1234
                     *
                     * Update the regex below if your application ID
                     * format is different.
                     */
                    def matcher = output =~ /(?i)\b(?:GUID[A-Z0-9]+)\b/

                    if (matcher.find()) {
                        env.HSC_APP_ID = matcher.group(0)
                    }

                    if (testExitCode == 0 && env.HSC_APP_ID != 'Not Created') {
                        env.HSC_STATUS = 'PASS'

                        echo "HSC test completed successfully."
                        echo "Application ID: ${env.HSC_APP_ID}"
                    } else {
                        env.HSC_STATUS = 'FAIL'
                        echo "HSC test failed or Application ID was not created."

                        if (testExitCode != 0) {
                            echo "Test exit code: ${testExitCode}"
                        }

                        if (env.HSC_APP_ID == 'Not Created') {
                            echo "Application ID not found."
                        }
                    }
                }
            }
        }

        stage('Mahindra — Student Self-Registers (Diploma Thorough)') {
            steps {
                script {
                    def testExitCode = sh(
                        script: '''
                            export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

                            rm -f diploma-output.log

                            npx playwright test \
                            tests/Daily_Jobs/mahindra-student-self-register-diploma-thorough.spec.ts \
                            --project=chromium 2>&1 | tee diploma-output.log

                            exit ${PIPESTATUS[0]}
                        ''',
                        returnStatus: true
                    )

                    def output = sh(
                        script: 'cat diploma-output.log 2>/dev/null || true',
                        returnStdout: true
                    ).trim()

                    /*
                     * Searches for Application IDs such as:
                     * GUIDA1251
                     * GUID1234
                     */
                    def matcher = output =~ /(?i)\b(?:GUID[A-Z0-9]+)\b/

                    if (matcher.find()) {
                        env.DIPLOMA_APP_ID = matcher.group(0)
                    }

                    if (testExitCode == 0 && env.DIPLOMA_APP_ID != 'Not Created') {
                        env.DIPLOMA_STATUS = 'PASS'

                        echo "Diploma Thorough test completed successfully."
                        echo "Application ID: ${env.DIPLOMA_APP_ID}"
                    } else {
                        env.DIPLOMA_STATUS = 'FAIL'
                        echo "Diploma Thorough test failed or Application ID was not created."

                        if (testExitCode != 0) {
                            echo "Test exit code: ${testExitCode}"
                        }

                        if (env.DIPLOMA_APP_ID == 'Not Created') {
                            echo "Application ID not found."
                        }
                    }
                }
            }
        }

        stage('Validate Results') {
            steps {
                script {
                    echo "=========================================="
                    echo "HSC Status: ${env.HSC_STATUS}"
                    echo "HSC Application ID: ${env.HSC_APP_ID}"
                    echo "------------------------------------------"
                    echo "Diploma Status: ${env.DIPLOMA_STATUS}"
                    echo "Diploma Application ID: ${env.DIPLOMA_APP_ID}"
                    echo "=========================================="

                    if (env.HSC_STATUS == 'FAIL' || env.DIPLOMA_STATUS == 'FAIL') {
                        currentBuild.result = 'FAILURE'
                    } else {
                        currentBuild.result = 'SUCCESS'
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                def buildStatus = currentBuild.currentResult ?: 'SUCCESS'

                def hscStatusColor =
                    env.HSC_STATUS == 'PASS' ? '#4F7D3A' : '#B42318'

                def diplomaStatusColor =
                    env.DIPLOMA_STATUS == 'PASS' ? '#4F7D3A' : '#B42318'

                def overallStatusColor =
                    buildStatus == 'SUCCESS' ? '#4F7D3A' : '#B42318'

                def emailBody = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>

<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:Arial, Helvetica, sans-serif; color:#333333;">

    <div style="max-width:750px; margin:30px auto; background-color:#ffffff;">

        <!-- Header -->
        <div style="background-color:#2F6B2F; padding:20px 26px;">
            <span style="font-size:24px; color:#9ACD55;">●</span>
            <span style="font-size:22px; font-weight:bold; color:#ffffff; margin-left:8px;">
                Student Self Registration Report
            </span>
        </div>

        <div style="padding:20px 25px;">

            <!-- Build Summary -->
            <h3 style="margin:0 0 12px 0; border-bottom:1px solid #dddddd; padding-bottom:10px;">
                Build Summary
            </h3>

            <table style="width:100%; border-collapse:collapse; font-size:14px;">
                <tr>
                    <td style="padding:10px; border-bottom:1px solid #dddddd; font-weight:bold; width:32%;">
                        Status
                    </td>
                    <td style="padding:10px; border-bottom:1px solid #dddddd; font-weight:bold; color:${overallStatusColor};">
                        ${buildStatus}
                    </td>
                </tr>

                <tr style="background-color:#f7f7f7;">
                    <td style="padding:10px; font-weight:bold;">
                        Project
                    </td>
                    <td style="padding:10px;">
                        ${JOB_NAME}
                    </td>
                </tr>

                <tr>
                    <td style="padding:10px; border-bottom:1px solid #dddddd; font-weight:bold;">
                        Build Number
                    </td>
                    <td style="padding:10px; border-bottom:1px solid #dddddd;">
                        #${BUILD_NUMBER}
                    </td>
                </tr>

                <tr style="background-color:#f7f7f7;">
                    <td style="padding:10px; font-weight:bold;">
                        Date & Time
                    </td>
                    <td style="padding:10px;">
                        ${new Date().format('dd-MM-yyyy HH:mm:ss')}
                    </td>
                </tr>

                <tr>
                    <td style="padding:10px; border-bottom:1px solid #dddddd; font-weight:bold;">
                        Agent
                    </td>
                    <td style="padding:10px; border-bottom:1px solid #dddddd;">
                        ${NODE_NAME ?: 'built-in'}
                    </td>
                </tr>

                <tr style="background-color:#f7f7f7;">
                    <td style="padding:10px; font-weight:bold;">
                        Execution Time
                    </td>
                    <td style="padding:10px;">
                        ${currentBuild.durationString.replace(' and counting', '')}
                    </td>
                </tr>
            </table>

            <!-- Application Results -->
            <h3 style="margin:30px 0 12px 0; border-bottom:1px solid #dddddd; padding-bottom:10px;">
                Application Creation Results
            </h3>

            <table style="width:100%; border-collapse:collapse; font-size:14px;">
                <thead>
                    <tr style="background-color:#333333; color:#ffffff;">
                        <th style="padding:12px; text-align:left; border:1px solid #555555;">
                            Test
                        </th>
                        <th style="padding:12px; text-align:left; border:1px solid #555555;">
                            Application ID
                        </th>
                        <th style="padding:12px; text-align:left; border:1px solid #555555;">
                            Status
                        </th>
                    </tr>
                </thead>

                <tbody>
                    <tr>
                        <td style="padding:12px; border:1px solid #dddddd;">
                            Mahindra — Student Self-Registers (HSC)
                        </td>
                        <td style="padding:12px; border:1px solid #dddddd; font-weight:bold;">
                            ${env.HSC_APP_ID}
                        </td>
                        <td style="padding:12px; border:1px solid #dddddd; font-weight:bold; color:${hscStatusColor};">
                            ● ${env.HSC_STATUS}
                        </td>
                    </tr>

                    <tr style="background-color:#f7f7f7;">
                        <td style="padding:12px; border:1px solid #dddddd;">
                            Mahindra — Student Self-Registers (Diploma Thorough)
                        </td>
                        <td style="padding:12px; border:1px solid #dddddd; font-weight:bold;">
                            ${env.DIPLOMA_APP_ID}
                        </td>
                        <td style="padding:12px; border:1px solid #dddddd; font-weight:bold; color:${diplomaStatusColor};">
                            ● ${env.DIPLOMA_STATUS}
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Tests Executed -->
            <h3 style="margin:30px 0 12px 0; border-bottom:1px solid #dddddd; padding-bottom:10px;">
                Tests Executed
            </h3>

            <ul style="font-size:14px; line-height:1.8;">
                <li>Mahindra — Student Self-Registers (HSC)</li>
                <li>Mahindra — Student Self-Registers (Diploma Thorough)</li>
            </ul>

            <!-- Execution Schedule -->
            <h3 style="margin:25px 0 12px 0; border-bottom:1px solid #dddddd; padding-bottom:10px;">
                Execution Schedule
            </h3>

            <p style="font-size:14px;">
                <strong>Daily:</strong> Scheduled automatically by Jenkins
            </p>

            <!-- Build Links -->
            <h3 style="margin:25px 0 12px 0; border-bottom:1px solid #dddddd; padding-bottom:10px;">
                Build Links
            </h3>

            <a href="${BUILD_URL}"
               style="display:inline-block; background-color:#2F6B2F; color:#ffffff; text-decoration:none; padding:12px 20px; margin-right:10px; font-weight:bold;">
                View Build
            </a>

            <a href="${BUILD_URL}console"
               style="display:inline-block; background-color:#2F6B2F; color:#ffffff; text-decoration:none; padding:12px 20px; font-weight:bold;">
                Console Output
            </a>

            <!-- Footer -->
            <div style="margin-top:35px; padding-top:15px; border-top:1px solid #dddddd; font-size:12px; color:#777777;">
                <p style="margin:5px 0;">Generated automatically by Jenkins</p>
                <p style="margin:5px 0;">Project: ${JOB_NAME}</p>
                <p style="margin:5px 0;">Automation Owner: Durgaprasad</p>
            </div>

        </div>
    </div>

</body>
</html>
"""

                emailext(
                    from: 'Durgaprasad <nameisdp104@gmail.com>',
                    to: 'durgaprasad@flyurdream.com, gopikrishna@excellait.co.uk, manikannta@flyurdream.com',
                    subject: "[Student Self Registration] ${buildStatus} - Build #${BUILD_NUMBER}",
                    mimeType: 'text/html',
                    body: emailBody
                )
            }

            archiveArtifacts artifacts: '''
                playwright-report/**,
                test-results/**,
                hsc-output.log,
                diploma-output.log
            ''', allowEmptyArchive: true

            junit testResults: 'test-results/**/*.xml', allowEmptyResults: true
        }
    }
}
