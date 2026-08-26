```groovy
pipeline {
    agent any

    // Run twice every day:
    // Morning  - around 10:00 AM
    // Evening  - around 6:00 PM
    triggers {
        cron('H 10 * * *\nH 18 * * *')
    }

    options {
        timestamps()

        // Prevent two scheduled runs from executing at the same time.
        disableConcurrentBuilds()

        // Maximum time allowed for the complete pipeline.
        timeout(time: 90, unit: 'MINUTES')
    }

    stages {

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
                sh 'npx playwright install --with-deps chromium'
            }
        }

    

        stage('Mahindra — Student Self-Registers (Diploma)') {
            steps {
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    sh '''
                        npx playwright test \
                        tests/Daily_Jobs/mahindra-student-self-register-hsc.spec.ts \
                        --project=chromium
                    '''
                }
            }
        }

        stage('Mahindra — Student Self-Registers (Diploma Thorough)') {
            steps {
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    sh '''
                        npx playwright test \
                        tests/Daily_Jobs/mahindra-student-self-register-diploma-thorough.spec.ts \
                        --project=chromium
                    '''
                }
            }
        }
    }

    post {
        always {
            echo 'Publishing Playwright reports and test results...'

            archiveArtifacts(
                artifacts: 'playwright-report/**, test-results/**',
                allowEmptyArchive: true
            )

            junit(
                testResults: 'test-results/**/*.xml',
                allowEmptyResults: true
            )
        }

        success {
            echo 'All Daily_Jobs tests completed successfully.'
        }

        failure {
            echo 'One or more Daily_Jobs tests failed. Check the stage results and Playwright reports.'
        }
    }
}
```
