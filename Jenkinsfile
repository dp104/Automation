pipeline {
    agent any

    /*
     * Node.js configuration
     *
     * This name MUST exactly match the NodeJS installation
     * configured under:
     *
     * Manage Jenkins → Tools → NodeJS installations
     */
    tools {
        nodejs 'NodeJS-22'
    }

    /*
     * Run twice every day:
     *
     * Morning - around 10:00 AM
     * Evening - around 06:00 PM
     */
    triggers {
        cron('H 10 * * *\nH 18 * * *')
    }

    options {
        timestamps()

        // Prevent two Jenkins runs from executing simultaneously.
        disableConcurrentBuilds()

        // Maximum pipeline execution time.
        timeout(time: 60, unit: 'MINUTES')

        // Keep the latest 20 builds.
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
                        npx playwright test \
                        tests/Daily_Jobs/mahindra-student-self-register-hsc.spec.ts \
                        --project=chromium
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
                        npx playwright test \
                        tests/Daily_Jobs/mahindra-student-self-register-diploma-thorough.spec.ts \
                        --project=chromium
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

        /*
         * This runs whether the build succeeds or fails.
         */
        always {

            echo 'Publishing Playwright reports...'

            /*
             * Archive Playwright reports, screenshots,
             * videos and test results.
             */
            archiveArtifacts(
                artifacts: 'playwright-report/**, test-results/**',
                allowEmptyArchive: true
            )

            /*
             * Publish JUnit XML results if available.
             */
            junit(
                testResults: 'test-results/**/*.xml',
                allowEmptyResults: true
            )

            /*
             * ====================================================
             * EMAIL NOTIFICATION
             * ====================================================
             *
             * Requires:
             * Email Extension Plugin
             *
             * SMTP must be configured in:
             * Manage Jenkins → System
             */
            emailext(

                /*
                 * Email recipients
                 */
                to: 'durgaprasad@flyurdream.com, manikannta@flyurdream.com',

                /*
                 * Dynamic subject
                 */
                subject: "[Student Self Registration] ${currentBuild.currentResult} - ${env.JOB_NAME} #${env.BUILD_NUMBER}",

                /*
                 * HTML email body
                 */
                body: """
                    <html>
                    <body>

                    <h2>
                        Student Self Registration
                        Automation Report
                    </h2>

                    <hr>

                    <h3>Build Information</h3>

                    <p>
                        <b>Job:</b>
                        ${env.JOB_NAME}
                    </p>

                    <p>
                        <b>Build Number:</b>
                        #${env.BUILD_NUMBER}
                    </p>

                    <p>
                        <b>Status:</b>
                        ${currentBuild.currentResult}
                    </p>

                    <p>
                        <b>Build Duration:</b>
                        ${currentBuild.durationString}
                    </p>

                    <p>
                        <b>Build URL:</b>
                        <a href="${env.BUILD_URL}">
                            Open Jenkins Build
                        </a>
                    </p>

                    <hr>

                    <h3>Tests Executed</h3>

                    <ul>

                        <li>
                            Mahindra — Student Self-Registers (HSC)
                        </li>

                        <li>
                            Mahindra — Student Self-Registers
                            (Diploma Thorough)
                        </li>

                    </ul>

                    <hr>

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
                        This is an automated email generated
                        by Jenkins.
                    </p>

                    </body>
                    </html>
                """,

                mimeType: 'text/html',

                // Do not attach the entire Jenkins console log.
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
            Email notification has been sent.
            =====================================================
            '''
        }
    }
}
