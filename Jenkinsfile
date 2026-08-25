pipeline {
    agent any

    // Runs once a day. Adjust the hour to whatever off-peak window fits —
    // this tenant's server is known to occasionally freeze for minutes, so
    // avoid scheduling this back-to-back with other automation against the
    // same tenant.
    triggers {
        cron('H 3 * * *')
    }

    options {
        timestamps()
        // Each spec already carries its own generous internal
        // test.setTimeout (15 min) for the slow wizard flow — this is just
        // a hard backstop for the whole build across all 4 stages.
        timeout(time: 60, unit: 'MINUTES')
    }

    stages {
        stage('Install dependencies') {
            steps {
                sh 'npm ci'
                sh 'npx playwright install --with-deps chromium'
            }
        }

        stage('Mahindra — Partner adds student (Diploma)') {
            steps {
                sh 'npx playwright test tests/Daily_Jobs/mahindra-partner-add-student.spec.ts --project=chromium'
            }
        }

        stage('Mahindra — Student self-registers (Undergraduate)') {
            steps {
                sh 'npx playwright test tests/Daily_Jobs/mahindra-student-self-register.spec.ts --project=chromium'
            }
        }

        stage('Mahindra — Student self-registers (Undergraduate, HSC)') {
            steps {
                sh 'npx playwright test tests/Daily_Jobs/mahindra-student-self-register-diploma.spec.ts --project=chromium'
            }
        }

        stage('Mahindra — Student self-registers (Undergraduate, thorough)') {
            steps {
                sh 'npx playwright test tests/Daily_Jobs/mahindra-student-self-register-diploma-thorough.spec.ts --project=chromium'
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'playwright-report/**, test-results/**', allowEmptyArchive: true
        }
    }
}
