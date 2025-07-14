import { chromium, FullConfig } from '@playwright/test'
import path from 'path'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...')
  
  // Create test results directory
  const testResultsDir = path.join(process.cwd(), 'test-results')
  const { promises: fs } = require('fs')
  
  try {
    await fs.mkdir(testResultsDir, { recursive: true })
    console.log('✅ Created test-results directory')
  } catch (error) {
    console.log('ℹ️  test-results directory already exists or couldn\'t be created')
  }

  // Launch browser for auth state setup
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  // Set up authentication state (if needed)
  // This is where you'd typically log in a test user
  try {
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:3000')
    
    // Store auth state for tests
    await page.context().storageState({ path: 'test-results/auth-state.json' })
    console.log('✅ Auth state saved for E2E tests')
  } catch (error) {
    console.log('⚠️  Could not set up auth state:', error)
  }
  
  await browser.close()
  console.log('✅ Global setup completed')
}

export default globalSetup