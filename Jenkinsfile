pipeline {
    agent any

    tools {
        nodejs 'NodeJS'
    }

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

        HSC_EXIT_CODE = '1'
        DIPLOMA_EXIT_CODE = '1'
    }

    stages {

        stage('Install Dependencies') {
            steps {
                sh '''
                    echo "Installing Node.js dependencies..."
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

                    HSC_EXIT_CODE = sh(
                        script: '''
                            set +e

                            npx playwright test \
                            tests/Daily_Jobs/mahindra-student-self-register-hsc.spec.ts \
                            --project=chromium 2>&1 | tee hsc-test-output.log

                            exit ${PIPESTATUS[0]}
                        ''',
                        returnStatus: true
                    ).toString()

                    def hscLog = ''

                    if (fileExists('hsc-test-output.log')) {
                        hscLog = readFile('hsc-test-output.log')
                    }

                    // Capture Application IDs such as GUIDA1249, GUIDA1251, etc.
                    def matcher = (hscLog =~ /\bGUIDA\d+\b/)

                    if (matcher.find()) {
                        HSC_APP_ID = matcher.group(0)
                        HSC_STATUS = 'PASS'

                        echo "HSC Application ID Created: ${HSC_APP_ID}"
                    } else {
                        HSC_APP_ID = 'Not Created'
                        HSC_STATUS = 'FAIL'

                        echo 'HSC Application ID was not found in the test output.'
                    }

                    echo "HSC Test Exit Code: ${HSC_EXIT_CODE}"
                    echo "HSC Final Status: ${HSC_STATUS}"
                }
            }
        }

        stage('Mahindra — Student Self-Registers (Diploma Thorough)') {
            steps {
                script {
                    echo 'Running Diploma Thorough Student Self-Registration test...'

                    DIPLOMA_EXIT_CODE = sh(
                        script: '''
                            set +e

                            npx playwright test \
                            tests/Daily_Jobs/mahindra-student-self-register-diploma-thorough.spec.ts \
                            --project=chromium 2>&1 | tee diploma-test-output.log

                            exit ${PIPESTATUS[0]}
                        ''',
                        returnStatus: true
                    ).toString()

                    def diplomaLog = ''

                    if (fileExists('diploma-test-output.log')) {
                        diplomaLog = readFile('diploma-test-output.log')
                    }

                    // Capture Application IDs such as GUIDA1249, GUIDA1251, etc.
                    def matcher = (diplomaLog =~ /\bGUIDA\d+\b/)

                    if (matcher.find()) {
                        DIPLOMA_APP_ID = matcher.group(0)
                        DIPLOMA_STATUS = 'PASS'

                        echo "Diploma Application ID Created: ${DIPLOMA_APP_ID}"
                    } else {
                        DIPLOMA_APP_ID = 'Not Created'
                        DIPLOMA_STATUS = 'FAIL'

                        echo 'Diploma Application ID was not found in the test output.'
                    }

                    echo "Diploma Test Exit Code: ${DIPLOMA_EXIT_CODE}"
                    echo "Diploma Final Status: ${DIPLOMA_STATUS}"
                }
            }
        }

        stage('Validate Application Creation') {
            steps {
                script {
                    echo '=============================================='
                    echo 'APPLICATION CREATION SUMMARY'
                    echo '=============================================='
                    echo "HSC Application ID: ${HSC_APP_ID}"
                    echo "HSC Status: ${HSC_STATUS}"
                    echo ''
                    echo "Diploma Application ID: ${DIPLOMA_APP_ID}"
                    echo "Diploma Status: ${DIPLOMA_STATUS}"
                    echo '=============================================='

                    if (HSC_STATUS == 'PASS' && DIPLOMA_STATUS == 'PASS') {
                        currentBuild.result = 'SUCCESS'
                        echo 'Both applications were created successfully.'
                    } else {
                        currentBuild.result = 'FAILURE'
                        echo 'One or more applications were not created.'
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
                def statusText = overallStatus == 'SUCCESS' ? 'SUCCESS' : 'FAILURE'

                def hscStatusColor = HSC_STATUS == 'PASS' ? '#4f7d3a' : '#a83a2b'
                def diplomaStatusColor = DIPLOMA_STATUS == 'PASS' ? '#4f7d3a' : '#a83a2b'

                def hscIcon = HSC_STATUS == 'PASS' ? '●' : '●'
                def diplomaIcon = DIPLOMA_STATUS == 'PASS' ? '●' : '●'

                emailext(
                    to: 'durgaprasad@flyurdream.com,gopikrishna@excellait.co.uk,manikannta@flyurdream.com',

                    from: 'Durgaprasad <durgaprasad@flyurdream.com>',

                    subject: "[Student Self Registration] ${statusText} - Build #${BUILD_NUMBER}",

                    mimeType: 'text/html',

                    body: """
                    <html>
                    <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#333333;">

                        <div style="width:760px;max-width:100%;margin:30px auto;background:#ffffff;">

                            <!-- Header -->
                            <div style="background:#2f6b2f;padding:22px 26px;">
                                <span style="color:#8fbc4f;font-size:26px;vertical-align:middle;">●</span>
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

                                <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;">
                                    <tr>
                                        <td style="padding:10px;background:#f1f1f1;border-bottom:1px solid #dddddd;font-weight:bold;width:35%;">
                                            Status
                                        </td>
                                        <td style="padding:10px;border-bottom:1px solid #dddddd;color:${statusColor};font-weight:bold;">
                                            ${statusText}
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
                                            #${BUILD_NUMBER}
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
                                            ${NODE_NAME}
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

                                <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid #dddddd;">

                                    <tr style="background:#3b3b3b;color:#ffffff;">
                                        <th style="padding:12px;text-align:left;border-right:1px solid #555555;">
                                            Test
                                        </th>
                                        <th style="padding:12px;text-align:left;border-right:1px solid #555555;">
                                            Application ID
                                        </th>
                                        <th style="padding:12px;text-align:left;">
                                            Status
                                        </th>
                                    </tr>

                                    <tr>
                                        <td style="padding:12px;border-top:1px solid #dddddd;border-right:1px solid #dddddd;">
                                            Mahindra — Student Self-Registers (HSC)
                                        </td>

                                        <td style="padding:12px;border-top:1px solid #dddddd;border-right:1px solid #dddddd;font-weight:bold;">
                                            ${HSC_APP_ID}
                                        </td>

                                        <td style="padding:12px;border-top:1px solid #dddddd;color:${hscStatusColor};font-weight:bold;">
                                            ${hscIcon} ${HSC_STATUS}
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding:12px;border-top:1px solid #dddddd;border-right:1px solid #dddddd;">
                                            Mahindra — Student Self-Registers (Diploma Thorough)
                                        </td>

                                        <td style="padding:12px;border-top:1px solid #dddddd;border-right:1px solid #dddddd;font-weight:bold;">
                                            ${DIPLOMA_APP_ID}
                                        </td>

                                        <td style="padding:12px;border-top:1px solid #dddddd;color:${diplomaStatusColor};font-weight:bold;">
                                            ${diplomaIcon} ${DIPLOMA_STATUS}
                                        </td>
                                    </tr>

                                </table>


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

                                <a href="${BUILD_URL}"
                                   style="display:inline-block;background:#356b3c;color:#ffffff;text-decoration:none;padding:12px 20px;font-weight:bold;margin-right:10px;">
                                    View Build
                                </a>

                                <a href="${BUILD_URL}console"
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

                echo """
                =====================================================
                BUILD STATUS: ${statusText}
                HSC APPLICATION ID: ${HSC_APP_ID}
                HSC STATUS: ${HSC_STATUS}
                DIPLOMA APPLICATION ID: ${DIPLOMA_APP_ID}
                DIPLOMA STATUS: ${DIPLOMA_STATUS}
                =====================================================
                """
            }
        }
    }
}
