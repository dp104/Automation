pipeline {
    agent any

    triggers {
        // Runs every day around 10:00 AM and 6:00 PM
        cron('H 10,18 * * *')
    }

    options {
        timestamps()
        timeout(time: 60, unit: 'MINUTES')
    }

    stages {

        stage('Install Dependencies') {
            steps {
                echo 'Installing Node.js dependencies...'
                sh '''
                    npm ci
                    npx playwright install chromium
                '''
            }
        }

        stage('Mahindra — Student Self-Registers (HSC)') {
            steps {
                sh '''
                    npx playwright test \
                    tests/Daily_Jobs/mahindra-student-self-register-hsc.spec.ts \
                    --project=chromium
                '''
            }
        }

        stage('Mahindra — Student Self-Registers (Diploma Thorough)') {
            steps {
                sh '''
                    npx playwright test \
                    tests/Daily_Jobs/mahindra-student-self-register-diploma-thorough.spec.ts \
                    --project=chromium
                '''
            }
        }
    }

    post {
        always {
            echo 'Publishing Playwright reports...'

            archiveArtifacts(
                artifacts: 'playwright-report/**, test-results/**',
                allowEmptyArchive: true
            )

            // Do not fail the Jenkins build if XML results are not found
            junit(
                testResults: 'test-results/**/*.xml',
                allowEmptyResults: true
            )
        }

        success {
            emailext(
                to: 'durgaprasad@flyurdream.com,gopikrishna@excellait.co.uk,manikannta@flyurdream.com',
                subject: '[Student Self Registration] SUCCESS - Build #${BUILD_NUMBER}',
                mimeType: 'text/html',
                body: """
<!DOCTYPE html>
<html>
<head>
<style>
    body {
        font-family: Arial, sans-serif;
        background-color: #f5f5f5;
        margin: 0;
        padding: 0;
    }

    .container {
        width: 600px;
        margin: 30px auto;
        background-color: #ffffff;
    }

    .header {
        background-color: #2e6b32;
        color: #ffffff;
        padding: 22px 25px;
        font-size: 22px;
        font-weight: bold;
    }

    .content {
        padding: 25px;
    }

    h3 {
        color: #444444;
        border-bottom: 1px solid #dddddd;
        padding-bottom: 10px;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
    }

    th {
        background-color: #333333;
        color: #ffffff;
        padding: 12px;
        text-align: left;
    }

    td {
        border: 1px solid #dddddd;
        padding: 11px;
    }

    .label {
        font-weight: bold;
        width: 35%;
    }

    .success {
        color: #2e6b32;
        font-weight: bold;
    }

    .footer {
        padding: 20px 25px;
        border-top: 1px solid #dddddd;
        color: #777777;
        font-size: 12px;
    }

    .button {
        display: inline-block;
        padding: 10px 18px;
        background-color: #2f66b3;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 3px;
        margin-right: 10px;
    }
</style>
</head>

<body>
    <div class="container">

        <div class="header">
            🟢 Student Self Registration Report
        </div>

        <div class="content">

            <h3>Build Summary</h3>

            <table>
                <tr>
                    <td class="label">Status</td>
                    <td class="success">SUCCESS</td>
                </tr>
                <tr>
                    <td class="label">Project</td>
                    <td>Student Self Registration</td>
                </tr>
                <tr>
                    <td class="label">Build Number</td>
                    <td>#${BUILD_NUMBER}</td>
                </tr>
                <tr>
                    <td class="label">Date & Time</td>
                    <td>${new Date().format('dd-MM-yyyy HH:mm:ss')}</td>
                </tr>
                <tr>
                    <td class="label">Agent</td>
                    <td>${NODE_NAME}</td>
                </tr>
                <tr>
                    <td class="label">Execution Time</td>
                    <td>${currentBuild.durationString}</td>
                </tr>
            </table>

            <h3>Application Creation Results</h3>

            <table>
                <tr>
                    <th>Test</th>
                    <th>Application ID</th>
                    <th>Status</th>
                </tr>

                <tr>
                    <td>Mahindra — Student Self-Registers (HSC)</td>
                    <td>Check Jenkins Console / Test Report</td>
                    <td class="success">🟢 PASS</td>
                </tr>

                <tr>
                    <td>Mahindra — Student Self-Registers (Diploma Thorough)</td>
                    <td>Check Jenkins Console / Test Report</td>
                    <td class="success">🟢 PASS</td>
                </tr>
            </table>

            <h3>Tests Executed</h3>

            <ul>
                <li>Mahindra — Student Self-Registers (HSC)</li>
                <li>Mahindra — Student Self-Registers (Diploma Thorough)</li>
            </ul>

            <h3>Execution Schedule</h3>

            <p><b>Morning:</b> Around 10:00 AM</p>
            <p><b>Evening:</b> Around 06:00 PM</p>

            <h3>Build Links</h3>

            <p>
                <a class="button" href="${BUILD_URL}">View Build</a>
                <a class="button" href="${BUILD_URL}console">Console Output</a>
            </p>

        </div>

        <div class="footer">
            Generated automatically by Jenkins<br>
            Student Self Registration Automation
        </div>

    </div>
</body>
</html>
                """
            )
        }

        failure {
            emailext(
                to: 'durgaprasad@flyurdream.com,gopikrishna@excellait.co.uk,manikannta@flyurdream.com',
                subject: '[Student Self Registration] FAILURE - Build #${BUILD_NUMBER}',
                mimeType: 'text/html',
                body: """
<!DOCTYPE html>
<html>
<head>
<style>
    body {
        font-family: Arial, sans-serif;
        background-color: #f5f5f5;
        margin: 0;
        padding: 0;
    }

    .container {
        width: 600px;
        margin: 30px auto;
        background-color: #ffffff;
    }

    .header {
        background-color: #2e6b32;
        color: #ffffff;
        padding: 22px 25px;
        font-size: 22px;
        font-weight: bold;
    }

    .content {
        padding: 25px;
    }

    h3 {
        color: #444444;
        border-bottom: 1px solid #dddddd;
        padding-bottom: 10px;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
    }

    td {
        border: 1px solid #dddddd;
        padding: 11px;
    }

    .label {
        font-weight: bold;
        width: 35%;
    }

    .failure {
        color: #c0392b;
        font-weight: bold;
    }

    .footer {
        padding: 20px 25px;
        border-top: 1px solid #dddddd;
        color: #777777;
        font-size: 12px;
    }

    .button {
        display: inline-block;
        padding: 10px 18px;
        background-color: #2f66b3;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 3px;
    }
</style>
</head>

<body>
    <div class="container">

        <div class="header">
            🔴 Student Self Registration Report
        </div>

        <div class="content">

            <h3>Build Summary</h3>

            <table>
                <tr>
                    <td class="label">Status</td>
                    <td class="failure">FAILURE</td>
                </tr>
                <tr>
                    <td class="label">Project</td>
                    <td>Student Self Registration</td>
                </tr>
                <tr>
                    <td class="label">Build Number</td>
                    <td>#${BUILD_NUMBER}</td>
                </tr>
                <tr>
                    <td class="label">Date & Time</td>
                    <td>${new Date().format('dd-MM-yyyy HH:mm:ss')}</td>
                </tr>
                <tr>
                    <td class="label">Agent</td>
                    <td>${NODE_NAME}</td>
                </tr>
            </table>

            <h3>Result</h3>

            <p class="failure">
                One or more automation steps failed. Please check the Jenkins Console Output and Playwright reports for details.
            </p>

            <h3>Build Links</h3>

            <p>
                <a class="button" href="${BUILD_URL}">View Build & Console Output</a>
            </p>

        </div>

        <div class="footer">
            Generated automatically by Jenkins<br>
            Student Self Registration Automation
        </div>

    </div>
</body>
</html>
                """
            )
        }
    }
}
