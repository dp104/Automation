```groovy
pipeline {
    agent any

    /*
     * ============================================================
     * SCHEDULE
     * ============================================================
     *
     * Run the automation twice every day:
     *
     * Morning : Around 10:00 AM
     * Evening : Around 06:00 PM
     *
     * Jenkins 'H' automatically selects a consistent minute.
     */
    triggers {
        cron('H 10 * * *\nH 18 * * *')
    }

    /*
     * ============================================================
     * PIPELINE OPTIONS
     * ============================================================
     */
    options {

        // Show timestamps in Jenkins console output.
        timestamps()

        // Prevent two executions from running simultaneously.
        disableConcurrentBuilds()

        // Maximum time for the complete pipeline.
        timeout(time: 60, unit: 'MINUTES')

        // Keep the last 20 builds.
        buildDiscarder(
            logRotator(
                numToKeepStr: '20'
            )
        )
    }

    /*
     * ============================================================
     * STAGES
     * ============================================================
     */
    stages {

        /*
         * --------------------------------------------------------
         * Install Dependencies
         * --------------------------------------------------------
         */
        stage('Install Dependencies') {

            steps {

                echo 'Installing Node.js dependencies...'

                sh 'npm ci'

                echo 'Installing Playwright Chromium...'

                sh 'npx playwright install --with-deps chromium'
            }
        }


        /*
         * --------------------------------------------------------
         * HSC Student Self Registration
         * --------------------------------------------------------
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
         * --------------------------------------------------------
         * Diploma Thorough Student Self Registration
         * --------------------------------------------------------
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
         * --------------------------------------------------------
         * ALWAYS
         * --------------------------------------------------------
         *
         * This block executes whether the pipeline:
         *
         * SUCCESS
         * FAILURE
         * UNSTABLE
         *
         * Therefore the email will be sent after every run.
         */
        always {

            echo 'Publishing Playwright reports...'


            /*
             * Archive Playwright HTML reports,
             * screenshots, videos and test results.
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
             * Requires Jenkins Email Extension Plugin.
             *
             * SMTP must also be configured in:
             *
             * Manage Jenkins
             *      ↓
             * System
             *      ↓
             * Extended E-mail Notification
             */
            emailext(

                /*
                 * EMAIL RECIPIENTS
                 */
                to: 'durgaprasad@flyurdream.com, manikannta@flyurdream.com',

                /*
                 * DYNAMIC EMAIL SUBJECT
                 *
                 * Example:
                 *
                 * [Student Self Registration] SUCCESS
                 * - Student Self Registration #25
                 *
                 * or
                 *
                 * [Student Self Registration] FAILURE
                 * - Student Self Registration #26
                 */
                subject: "[Student Self Registration] ${currentBuild.currentResult} - ${env.JOB_NAME} #${env.BUILD_NUMBER}",


                /*
                 * HTML EMAIL BODY
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
                                Mahindra — Student
                                Self-Registers (HSC)
                            </li>

                            <li>
                                Mahindra — Student
                                Self-Registers
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
                            The Playwright reports, screenshots,
                            videos and test results are archived
                            in the Jenkins build.
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

                /*
                 * Tell Jenkins that the email body is HTML.
                 */
                mimeType: 'text/html',

                /*
                 * Do not attach the complete Jenkins console log.
                 */
                attachLog: false
            )
        }


        /*
         * --------------------------------------------------------
         * SUCCESS
         * --------------------------------------------------------
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
         * --------------------------------------------------------
         * FAILURE
         * --------------------------------------------------------
         */
        failure {

            echo '''
            =====================================================
            FAILURE
            One or more student self-registration tests failed.
            Email notification has been sent.
            Check the Playwright report and Jenkins console.
            =====================================================
            '''
        }


        /*
         * --------------------------------------------------------
         * UNSTABLE
         * --------------------------------------------------------
         */
        unstable {

            echo '''
            =====================================================
            UNSTABLE
            The pipeline completed with unstable results.
            Email notification has been sent.
            =====================================================
            '''
        }
    }
}
```
