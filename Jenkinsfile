pipeline {
    agent any

    tools {
        nodejs 'NodeJS-22'
    }

    triggers {
        // Around 10:00 AM and 06:00 PM every day
        cron('H 10 * * *\nH 18 * * *')
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 60, unit: 'MINUTES')

        buildDiscarder(
            logRotator(
                numToKeepStr: '20'
            )
        )
    }

    stages {

        stage('Install Dependencies') {
            steps {
                echo 'Installing Node.js dependencies...'

                sh '''
                    node --version
                    npm --version
                    npm ci
                    npx playwright install chromium
                '''
            }
        }

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

                        grep -Eio \
                        '(CREATED APP ID|APPLICATION ID|Application ID|APP ID)[[:space:]]*[:=-][[:space:]]*[A-Za-z0-9_-]+' \
                        hsc-test-output.txt \
                        | tail -1 \
                        | sed -E 's/.*[:=-][[:space:]]*//' \
                        > hsc-application-id.txt || true

                        if [ ! -s hsc-application-id.txt ]; then
                            echo "Not Created" > hsc-application-id.txt
                        fi

                        echo "HSC Application ID:"
                        cat hsc-application-id.txt

                        exit $TEST_EXIT_CODE
                    '''
                }
            }
        }

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

                        grep -Eio \
                        '(CREATED APP ID|APPLICATION ID|Application ID|APP ID)[[:space:]]*[:=-][[:space:]]*[A-Za-z0-9_-]+' \
                        diploma-thorough-test-output.txt \
                        | tail -1 \
                        | sed -E 's/.*[:=-][[:space:]]*//' \
                        > diploma-thorough-application-id.txt || true

                        if [ ! -s diploma-thorough-application-id.txt ]; then
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

    post {

        always {

            script {

                /*
                 * Make sure Application ID files exist.
                 */
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


                /*
                 * Read Application IDs.
                 */
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
             * Archive reports and application IDs.
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
             * =====================================================
             * EMAIL
             * =====================================================
             */
            emailext(

                to: 'durgaprasad@flyurdream.com, gopikrishna@excellait.co.uk, manikannta@flyurdream.com',

                from: 'durgaprasad@flyurdream.com',

                subject: "[Student Self Registration] ${currentBuild.currentResult} - Build #${env.BUILD_NUMBER}",

                mimeType: 'text/html',

                attachLog: false,

                body: """
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<style>

body {
    font-family: Arial, Helvetica, sans-serif;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
    color: #333333;
}

.container {
    width: 640px;
    margin: 20px auto;
    background: #ffffff;
}

.header {
    background-color: #2e7d32;
    color: #ffffff;
    padding: 20px 25px;
    font-size: 22px;
    font-weight: bold;
}

h3 {
    color: #333333;
    border-bottom: 2px solid #eeeeee;
    padding-bottom: 8px;
    margin-top: 28px;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
}

td {
    padding: 10px;
    border: 1px solid #dddddd;
}

.label {
    font-weight: bold;
    width: 180px;
    background-color: #f5f5f7;
}

.status-table th {
    background-color: #333333;
    color: #ffffff;
    padding: 11px;
    text-align: left;
}

.status-table td {
    padding: 11px;
}

.pass {
    color: #2e7d32;
    font-weight: bold;
}

.fail {
    color: #c62828;
    font-weight: bold;
}

.button {
    display: inline-block;
    background-color: #1976d2;
    color: #ffffff !important;
    text-decoration: none;
    padding: 11px 20px;
    margin-right: 8px;
    border-radius: 4px;
    font-weight: bold;
}

.footer {
    margin-top: 30px;
    padding: 18px;
    background-color: #f5f5f7;
    color: #777777;
    font-size: 12px;
}

</style>

</head>


<body>

<div class="container">


    <!-- HEADER -->

    <div class="header">
        🟢 Student Self Registration Report
    </div>


    <!-- BUILD SUMMARY -->

    <h3>Build Summary</h3>

    <table>

        <tr>
            <td class="label">Status</td>

            <td class="${currentBuild.currentResult == 'SUCCESS' ? 'pass' : 'fail'}">

                ${currentBuild.currentResult}

            </td>
        </tr>


        <tr>
            <td class="label">Project</td>
            <td>Student Self Registration</td>
        </tr>


        <tr>
            <td class="label">Build Number</td>
            <td>#${env.BUILD_NUMBER}</td>
        </tr>


        <tr>
            <td class="label">Date & Time</td>

            <td>
                ${new Date().format('dd-MM-yyyy HH:mm:ss')}
            </td>

        </tr>


        <tr>
            <td class="label">Agent</td>
            <td>${env.NODE_NAME}</td>
        </tr>


        <tr>
            <td class="label">Execution Time</td>
            <td>${currentBuild.durationString}</td>
        </tr>

    </table>


    <!-- APPLICATION CREATION RESULTS -->

    <h3>Application Creation Results</h3>

    <table class="status-table">

        <tr>

            <th>Test</th>

            <th>Application ID</th>

            <th>Status</th>

        </tr>


        <tr>

            <td>
                Mahindra — Student Self-Registers (HSC)
            </td>

            <td>
                <b>${env.HSC_APP_ID}</b>
            </td>

            <td class="${env.HSC_APP_ID != 'Not Created' ? 'pass' : 'fail'}">

                ${env.HSC_APP_ID != 'Not Created'
                    ? '🟢 PASS'
                    : '🔴 NOT CREATED'}

            </td>

        </tr>


        <tr>

            <td>
                Mahindra — Student Self-Registers
                (Diploma Thorough)
            </td>

            <td>
                <b>${env.DIPLOMA_APP_ID}</b>
            </td>

            <td class="${env.DIPLOMA_APP_ID != 'Not Created' ? 'pass' : 'fail'}">

                ${env.DIPLOMA_APP_ID != 'Not Created'
                    ? '🟢 PASS'
                    : '🔴 NOT CREATED'}

            </td>

        </tr>

    </table>


    <!-- TESTS -->

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


    <!-- SCHEDULE -->

    <h3>Execution Schedule</h3>

    <p>
        <b>Morning:</b> Around 10:00 AM
    </p>

    <p>
        <b>Evening:</b> Around 06:00 PM
    </p>


    <!-- BUILD LINKS -->

    <h3>Build Links</h3>

    <p>

        <a
            class="button"
            href="${env.BUILD_URL}">
            View Build
        </a>


        <a
            class="button"
            href="${env.BUILD_URL}console">
            Console Output
        </a>

    </p>


    <!-- FOOTER -->

    <div class="footer">

        Generated automatically by Jenkins
        <br>

        Student Self Registration Automation

        <br><br>

        Regards,<br>

        <b>DurgaPrasad</b>

    </div>


</div>

</body>

</html>
"""
            )
        }


        success {

            echo '''
            =====================================================
            SUCCESS
            Student self-registration automation completed.
            Email notification sent.
            =====================================================
            '''
        }


        failure {

            echo '''
            =====================================================
            FAILURE
            One or more student self-registration tests failed.
            Email notification sent.
            =====================================================
            '''
        }


        unstable {

            echo '''
            =====================================================
            UNSTABLE
            Student self-registration automation completed
            with unstable results.
            Email notification sent.
            =====================================================
            '''
        }
    }
}
