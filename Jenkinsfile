pipeline {
    agent any

    environment {
        PATH = "/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:${env.PATH}"

        HSC_STATUS = "NOT RUN"
        HSC_APPLICATION_ID = "Not Created"

        DIPLOMA_STATUS = "NOT RUN"
        DIPLOMA_APPLICATION_ID = "Not Created"
    }

    triggers {
        // Runs once every day
        cron('H 3 * * *')
    }

    options {
        timestamps()
        timeout(time: 60, unit: 'MINUTES')
    }

    stages {

        stage('Install Dependencies') {
            steps {
                sh '''
                    #!/bin/bash
                    set -e

                    echo "=========================================="
                    echo "INSTALLING DEPENDENCIES"
                    echo "=========================================="

                    echo "Node version:"
                    node --version

                    echo "NPM version:"
                    npm --version

                    npm ci

                    echo "Installing Playwright Chromium..."
                    npx playwright install chromium
                '''
            }
        }

        stage('Mahindra — Student Self-Registers (HSC)') {
            steps {
                script {
                    echo "=========================================="
                    echo "RUNNING HSC STUDENT SELF REGISTRATION"
                    echo "=========================================="

                    int exitCode = sh(
                        script: '''
                            #!/bin/bash
                            set +e

                            npx playwright test \
                                tests/Daily_Jobs/mahindra-student-self-register-hsc.spec.ts \
                                --project=chromium 2>&1 | tee hsc-test-output.txt

                            exit ${PIPESTATUS[0]}
                        ''',
                        returnStatus: true
                    )

                    echo "HSC Test Exit Code: ${exitCode}"

                    if (exitCode == 0) {
                        env.HSC_STATUS = "PASS"

                        def applicationId = sh(
                            script: '''
                                #!/bin/bash

                                if [ -f hsc-test-output.txt ]; then
                                    grep -Eo 'GUIDA[0-9]+' hsc-test-output.txt | tail -1 || true
                                fi
                            ''',
                            returnStdout: true
                        ).trim()

                        if (applicationId) {
                            env.HSC_APPLICATION_ID = applicationId
                            echo "HSC Application ID: ${applicationId}"
                        } else {
                            env.HSC_APPLICATION_ID = "Not Captured"
                            echo "HSC test passed successfully, but Application ID was not captured."
                        }

                    } else {
                        env.HSC_STATUS = "FAIL"
                        env.HSC_APPLICATION_ID = "Not Created"

                        echo "HSC test failed."
                    }
                }
            }
        }

        stage('Mahindra — Student Self-Registers (Diploma Thorough)') {
            steps {
                script {
                    echo "=========================================="
                    echo "RUNNING DIPLOMA THOROUGH SELF REGISTRATION"
                    echo "=========================================="

                    int exitCode = sh(
                        script: '''
                            #!/bin/bash
                            set +e

                            npx playwright test \
                                tests/Daily_Jobs/mahindra-student-self-register-diploma-thorough.spec.ts \
                                --project=chromium 2>&1 | tee diploma-thorough-test-output.txt

                            exit ${PIPESTATUS[0]}
                        ''',
                        returnStatus: true
                    )

                    echo "Diploma Thorough Test Exit Code: ${exitCode}"

                    if (exitCode == 0) {
                        env.DIPLOMA_STATUS = "PASS"

                        def applicationId = sh(
                            script: '''
                                #!/bin/bash

                                if [ -f diploma-thorough-test-output.txt ]; then
                                    grep -Eo 'GUIDA[0-9]+' diploma-thorough-test-output.txt | tail -1 || true
                                fi
                            ''',
                            returnStdout: true
                        ).trim()

                        if (applicationId) {
                            env.DIPLOMA_APPLICATION_ID = applicationId
                            echo "Diploma Thorough Application ID: ${applicationId}"
                        } else {
                            env.DIPLOMA_APPLICATION_ID = "Not Captured"
                            echo "Diploma Thorough test passed successfully, but Application ID was not captured."
                        }

                    } else {
                        env.DIPLOMA_STATUS = "FAIL"
                        env.DIPLOMA_APPLICATION_ID = "Not Created"

                        echo "Diploma Thorough test failed."
                    }
                }
            }
        }

        stage('Validate Results') {
            steps {
                script {
                    echo "=========================================="
                    echo "FINAL TEST RESULTS"
                    echo "=========================================="
                    echo "HSC Status: ${env.HSC_STATUS}"
                    echo "HSC Application ID: ${env.HSC_APPLICATION_ID}"
                    echo "------------------------------------------"
                    echo "Diploma Thorough Status: ${env.DIPLOMA_STATUS}"
                    echo "Diploma Thorough Application ID: ${env.DIPLOMA_APPLICATION_ID}"
                    echo "=========================================="

                    if (env.HSC_STATUS == "FAIL" ||
                        env.DIPLOMA_STATUS == "FAIL") {

                        currentBuild.result = "FAILURE"
                        echo "One or more Playwright tests failed."

                    } else {
                        currentBuild.result = "SUCCESS"
                        echo "All Playwright tests passed successfully."
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                def overallStatus = currentBuild.currentResult ?: "SUCCESS"

                def overallStatusColor =
                    overallStatus == "SUCCESS" ? "#4f8a10" : "#b3261e"

                def hscStatusColor =
                    env.HSC_STATUS == "PASS" ? "#4f8a10" : "#b3261e"

                def diplomaStatusColor =
                    env.DIPLOMA_STATUS == "PASS" ? "#4f8a10" : "#b3261e"

                def subjectStatus =
                    overallStatus == "SUCCESS" ? "SUCCESS" : "FAILURE"

                emailext(
                    // EMAIL SENDER NAME
                    from: 'Durgaprasad <nameisdp104@gmail.com>',

                    // EMAIL RECIPIENTS
                    to: 'durgaprasad@flyurdream.com, gopikrishna@excellait.co.uk, manikanta@flyurdream.com',

                    subject: "[Student Self Registration] ${subjectStatus} - Build #${env.BUILD_NUMBER}",

                    mimeType: 'text/html',

                    body: """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>

<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:Arial, Helvetica, sans-serif; color:#333333;">

    <div style="width:720px; max-width:100%; margin:20px auto; background:#ffffff;">

        <!-- HEADER -->
        <div style="background:#2f6b35; padding:22px 28px;">
            <div style="font-size:23px; font-weight:bold; color:#ffffff;">
                <span style="color:#9ac65d;">●</span>
                Student Self Registration Report
            </div>
        </div>

        <div style="padding:24px 26px;">

            <p style="font-size:15px; margin-top:0;">
                Hi Team,
            </p>

            <p style="font-size:14px; color:#555555;">
                Please find below the automated Student Self Registration execution results.
            </p>

            <!-- BUILD SUMMARY -->
            <h3 style="font-size:16px; border-bottom:1px solid #dddddd; padding-bottom:10px;">
                Build Summary
            </h3>

            <table style="border-collapse:collapse; width:100%; font-size:14px;">

                <tr>
                    <td style="padding:10px; width:30%; border-bottom:1px solid #dddddd; background:#f4f4f4;">
                        <strong>Status</strong>
                    </td>
                    <td style="padding:10px; border-bottom:1px solid #dddddd;">
                        <strong style="color:${overallStatusColor};">
                            ${overallStatus}
                        </strong>
                    </td>
                </tr>

                <tr>
                    <td style="padding:10px; border-bottom:1px solid #dddddd;">
                        <strong>Project</strong>
                    </td>
                    <td style="padding:10px; border-bottom:1px solid #dddddd;">
                        Student Self Registration
                    </td>
                </tr>

                <tr>
                    <td style="padding:10px; border-bottom:1px solid #dddddd; background:#f4f4f4;">
                        <strong>Build Number</strong>
                    </td>
                    <td style="padding:10px; border-bottom:1px solid #dddddd;">
                        #${env.BUILD_NUMBER}
                    </td>
                </tr>

                <tr>
                    <td style="padding:10px; border-bottom:1px solid #dddddd;">
                        <strong>Date &amp; Time</strong>
                    </td>
                    <td style="padding:10px; border-bottom:1px solid #dddddd;">
                        ${new Date().format("dd-MM-yyyy HH:mm:ss")}
                    </td>
                </tr>

                <tr>
                    <td style="padding:10px; border-bottom:1px solid #dddddd; background:#f4f4f4;">
                        <strong>Agent</strong>
                    </td>
                    <td style="padding:10px; border-bottom:1px solid #dddddd;">
                        ${env.NODE_NAME ?: "built-in"}
                    </td>
                </tr>

                <tr>
                    <td style="padding:10px; background:#f4f4f4;">
                        <strong>Execution Time</strong>
                    </td>
                    <td style="padding:10px;">
                        ${currentBuild.durationString.replace(" and counting", "")}
                    </td>
                </tr>

            </table>


            <!-- APPLICATION RESULTS -->
            <h3 style="font-size:16px; border-bottom:1px solid #dddddd; padding-bottom:10px; margin-top:30px;">
                Application Creation Results
            </h3>

            <table style="border-collapse:collapse; width:100%; font-size:14px;">

                <tr style="background:#3b3b3b; color:#ffffff;">
                    <th style="padding:12px; text-align:left;">Test</th>
                    <th style="padding:12px; text-align:left;">Application ID</th>
                    <th style="padding:12px; text-align:left;">Status</th>
                </tr>

                <tr>
                    <td style="padding:12px; border:1px solid #dddddd;">
                        Mahindra — Student Self-Registers (HSC)
                    </td>

                    <td style="padding:12px; border:1px solid #dddddd;">
                        <strong>${env.HSC_APPLICATION_ID}</strong>
                    </td>

                    <td style="padding:12px; border:1px solid #dddddd;">
                        <strong style="color:${hscStatusColor};">
                            ${env.HSC_STATUS == "PASS" ? "● PASS" : "● FAIL"}
                        </strong>
                    </td>
                </tr>

                <tr>
                    <td style="padding:12px; border:1px solid #dddddd;">
                        Mahindra — Student Self-Registers (Diploma Thorough)
                    </td>

                    <td style="padding:12px; border:1px solid #dddddd;">
                        <strong>${env.DIPLOMA_APPLICATION_ID}</strong>
                    </td>

                    <td style="padding:12px; border:1px solid #dddddd;">
                        <strong style="color:${diplomaStatusColor};">
                            ${env.DIPLOMA_STATUS == "PASS" ? "● PASS" : "● FAIL"}
                        </strong>
                    </td>
                </tr>

            </table>


            <!-- TESTS EXECUTED -->
            <h3 style="font-size:16px; border-bottom:1px solid #dddddd; padding-bottom:10px; margin-top:30px;">
                Tests Executed
            </h3>

            <ul style="font-size:14px; line-height:1.8;">
                <li>Mahindra — Student Self-Registers (HSC)</li>
                <li>Mahindra — Student Self-Registers (Diploma Thorough)</li>
            </ul>


            <!-- SCHEDULE -->
            <h3 style="font-size:16px; border-bottom:1px solid #dddddd; padding-bottom:10px; margin-top:25px;">
                Execution Schedule
            </h3>

            <p style="font-size:14px;">
                <strong>Daily:</strong> Scheduled automatically by Jenkins
            </p>


            <!-- BUILD LINKS -->
            <h3 style="font-size:16px; border-bottom:1px solid #dddddd; padding-bottom:10px; margin-top:25px;">
                Build Links
            </h3>

            <p>
                <a href="${env.BUILD_URL}"
                   style="display:inline-block; padding:12px 20px; background:#2f6b35; color:#ffffff; text-decoration:none; font-weight:bold; margin-right:10px;">
                    View Build
                </a>

                <a href="${env.BUILD_URL}console"
                   style="display:inline-block; padding:12px 20px; background:#2f6b35; color:#ffffff; text-decoration:none; font-weight:bold;">
                    Console Output
                </a>
            </p>

        </div>

        <!-- FOOTER -->
        <div style="padding:18px 26px; border-top:1px solid #dddddd; color:#777777; font-size:12px;">
            Generated automatically by Jenkins<br>
            Project: Student Self Registration
        </div>

    </div>

</body>
</html>
                    """
                )

                echo """
=====================================================
BUILD RESULT: ${overallStatus}

HSC:
Status: ${env.HSC_STATUS}
Application ID: ${env.HSC_APPLICATION_ID}

DIPLOMA THOROUGH:
Status: ${env.DIPLOMA_STATUS}
Application ID: ${env.DIPLOMA_APPLICATION_ID}

Email sent from: Durgaprasad
=====================================================
                """
            }

            archiveArtifacts artifacts: '''
                playwright-report/**,
                test-results/**,
                hsc-test-output.txt,
                diploma-thorough-test-output.txt
            ''', allowEmptyArchive: true

            junit testResults: 'test-results/**/*.xml', allowEmptyResults: true
        }
    }
}
