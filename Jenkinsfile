pipeline {
    agent any

    tools {
        nodejs 'NodeJS-22'
    }

    /*
     * Run twice every day:
     * Morning - around 10:00 AM
     * Evening - around 06:00 PM
     */
    triggers {
        cron('H 10 * * *\nH 18 * * *')
    }

    options {
        timestamps()

        // Prevent overlapping executions
        disableConcurrentBuilds()

        // Maximum execution time
        timeout(time: 60, unit: 'MINUTES')

        // Keep latest 20 builds
        buildDiscarder(
            logRotator(
                numToKeepStr: '20'
            )
        )
    }

    stages {

        /*
         * ========================================================
         * INSTALL DEPENDENCIES
         * ========================================================
         */
        stage('Install Dependencies') {
            steps {

                echo 'Checking Node.js version...'
                sh 'node --version'

                echo 'Checking npm version...'
                sh 'npm --version'

                echo 'Installing project dependencies...'
                sh 'npm ci'

                echo 'Installing Playwright Chromium...'
                sh 'npx playwright install --with-deps chromium'
            }
        }


        /*
         * ========================================================
         * HSC STUDENT SELF REGISTRATION
         * ========================================================
         */
        stage('Mahindra — Student Self-Registers (HSC)') {
            steps {

                catchError(
                    buildResult: 'FAILURE',
                    stageResult: 'FAILURE'
                ) {

                    sh '''
                        set -o pipefail

                        echo "=============================================="
                        echo "HSC STUDENT SELF REGISTRATION"
                        echo "=============================================="

                        npx playwright test \
                        tests/Daily_Jobs/mahindra-student-self-register-hsc.spec.ts \
                        --project=chromium \
                        2>&1 | tee hsc-test-output.txt

                        TEST_EXIT_CODE=${PIPESTATUS[0]}

                        echo "Extracting HSC Application ID..."

                        if grep -q "CREATED APP ID:" hsc-test-output.txt; then
                            grep "CREATED APP ID:" hsc-test-output.txt \
                            | tail -1 \
                            | sed 's/.*CREATED APP ID: //' \
                            > hsc-application-id.txt
                        else
                            echo "Not Created" > hsc-application-id.txt
                        fi

                        echo "HSC Application ID:"
                        cat hsc-application-id.txt

                        exit $TEST_EXIT_CODE
                    '''
                }
            }
        }


        /*
         * ========================================================
         * DIPLOMA THOROUGH STUDENT SELF REGISTRATION
         * ========================================================
         */
        stage('Mahindra — Student Self-Registers (Diploma Thorough)') {
            steps {

                catchError(
                    buildResult: 'FAILURE',
                    stageResult: 'FAILURE'
                ) {

                    sh '''
                        set -o pipefail

                        echo "=================================================="
                        echo "DIPLOMA THOROUGH STUDENT SELF REGISTRATION"
                        echo "=================================================="

                        npx playwright test \
                        tests/Daily_Jobs/mahindra-student-self-register-diploma-thorough.spec.ts \
                        --project=chromium \
                        2>&1 | tee diploma-thorough-test-output.txt

                        TEST_EXIT_CODE=${PIPESTATUS[0]}

                        echo "Extracting Diploma Thorough Application ID..."

                        if grep -q "CREATED APP ID:" diploma-thorough-test-output.txt; then
                            grep "CREATED APP ID:" diploma-thorough-test-output.txt \
                            | tail -1 \
                            | sed 's/.*CREATED APP ID: //' \
                            > diploma-thorough-application-id.txt
                        else
                            echo "Not Created" > diploma-thorough-application-id.txt
                        fi

                        echo "Diploma Thorough Application ID:"
                        cat diploma-thorough-application-id.txt

                        exit $TEST_EXIT_CODE
                    '''
                }
            }
        }
    }


    /*
     * ============================================================
     * POST BUILD ACTIONS
     * ============================================================
     */
    post {

        always {

            echo 'Preparing test report and application IDs...'


            /*
             * Make sure Application ID files exist.
             */
            script {

                if (!fileExists('hsc-application-id.txt')) {
                    writeFile(
                        file: 'hsc-application-id.txt',
                        text: 'Not Created'
                    )
                }

                if (!fileExists('diploma-thorough-application-id.txt')) {
                    writeFile(
                        file: 'diploma-thorough-application-id.txt',
                        text: 'Not Created'
                    )
                }
            }


            /*
             * Read Application IDs.
             */
            script {

                env.HSC_APP_ID = readFile(
                    file: 'hsc-application-id.txt'
                ).trim()

                env.DIPLOMA_APP_ID = readFile(
                    file: 'diploma-thorough-application-id.txt'
                ).trim()

                echo "HSC Application ID: ${env.HSC_APP_ID}"
                echo "Diploma Thorough Application ID: ${env.DIPLOMA_APP_ID}"
            }


            /*
             * Archive Playwright reports and test outputs.
             */
            archiveArtifacts(
                artifacts: '''
                    playwright-report/**,
                    test-results/**,
                    hsc-test-output.txt,
                    diploma-thorough-test-output.txt,
                    hsc-application-id.txt,
                    diploma-thorough-application-id.txt
                ''',
                allowEmptyArchive: true
            )


            /*
             * Publish JUnit results if available.
             */
            junit(
                testResults: 'test-results/**/*.xml',
                allowEmptyResults: true
            )


            /*
             * ====================================================
             * EMAIL NOTIFICATION
             * ====================================================
             */
            emailext(

                // Recipients
                to: 'durgaprasad@flyurdream.com, manikannta@flyurdream.com',

                // Sender email
                from: 'durgaprasad@flyurdream.com',

                // Email subject
                subject: "[Student Self Registration] ${currentBuild.currentResult} - ${env.JOB_NAME} #${env.BUILD_NUMBER}",

                // HTML email body
                body: """
                    <html>

                    <body style="font-family: Arial, sans-serif;">

                        <h2>
                            Student Self Registration
                            Automation Report
                        </h2>

                        <p>
                            <b>Hi Team,</b>
                        </p>

                        <p>
                            Please find below the automated
                            Student Self Registration execution
                            results.
                        </p>

                        <hr>


                        <h3>Build Information</h3>

                        <table border="1"
                               cellpadding="8"
                               cellspacing="0"
                               style="border-collapse: collapse;">

                            <tr>
                                <td><b>Job</b></td>
                                <td>${env.JOB_NAME}</td>
                            </tr>

                            <tr>
                                <td><b>Build Number</b></td>
                                <td>#${env.BUILD_NUMBER}</td>
                            </tr>

                            <tr>
                                <td><b>Status</b></td>
                                <td>
                                    <b>${currentBuild.currentResult}</b>
                                </td>
                            </tr>

                            <tr>
                                <td><b>Build Duration</b></td>
                                <td>${currentBuild.durationString}</td>
                            </tr>

                            <tr>
                                <td><b>Build URL</b></td>
                                <td>
                                    <a href="${env.BUILD_URL}">
                                        Open Jenkins Build
                                    </a>
                                </td>
                            </tr>

                        </table>


                        <br>


                        <h3>Application Creation Results</h3>

                        <table border="1"
                               cellpadding="10"
                               cellspacing="0"
                               style="border-collapse: collapse;
                                      width: 100%;">

                            <tr>
                                <th>Test</th>
                                <th>Application ID</th>
                            </tr>

                            <tr>

                                <td>
                                    Mahindra —
                                    Student Self-Registers (HSC)
                                </td>

                                <td>
                                    <b>${env.HSC_APP_ID}</b>
                                </td>

                            </tr>

                            <tr>

                                <td>
                                    Mahindra —
                                    Student Self-Registers
                                    (Diploma Thorough)
                                </td>

                                <td>
                                    <b>${env.DIPLOMA_APP_ID}</b>
                                </td>

                            </tr>

                        </table>


                        <br>


                        <h3>Tests Executed</h3>

                        <ul>

                            <li>
                                Mahindra — Student
                                Self-Registers (HSC)
                            </li>

                            <li>
                                Mahindra — Student
                                Self-Registers
                                (Diploma Thorough)
                            </li>

                        </ul>


                        <h3>Execution Schedule</h3>

                        <p>
                            <b>Morning:</b>
                            Around 10:00 AM
                        </p>

                        <p>
                            <b>Evening:</b>
                            Around 06:00 PM
                        </p>


                        <hr>


                        <h3>Test Reports</h3>

                        <p>
                            Playwright reports, screenshots,
                            videos and test results are archived
                            in Jenkins.
                        </p>

                        <p>
                            <a href="${env.BUILD_URL}artifact/">
                                View Build Artifacts
                            </a>
                        </p>


                        <hr>


                        <p>
                            Regards,<br>
                            <b>DurgaPrasad</b><br>
                            QA Automation
                        </p>

                        <p style="font-size: 12px; color: gray;">
                            This is an automated email generated
                            by Jenkins.
                        </p>

                    </body>

                    </html>
                """,

                // Email is HTML
                mimeType: 'text/html',

                // Do not attach Jenkins console log
                attachLog: false
            )
        }


        /*
         * ========================================================
         * SUCCESS
         * ========================================================
         */
        success {

            echo '''
            =====================================================
            SUCCESS
            Both student self-registration tests completed.
            Application IDs have been captured.
            Email notification has been sent.
            =====================================================
            '''
        }


        /*
         * ========================================================
         * FAILURE
         * ========================================================
         */
        failure {

            echo '''
            =====================================================
            FAILURE
            One or more student self-registration tests failed.
            Any created Application IDs have been captured.
            Email notification has been sent.
            =====================================================
            '''
        }


        /*
         * ========================================================
         * UNSTABLE
         * ========================================================
         */
        unstable {

            echo '''
            =====================================================
            UNSTABLE
            Pipeline completed with unstable results.
            Any created Application IDs have been captured.
            Email notification has been sent.
            =====================================================
            '''
        }
    }
}
