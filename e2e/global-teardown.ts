import { FullConfig } from '@playwright/test'
import path from 'path'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests...')
  
  // Clean up test artifacts if needed
  const testResultsDir = path.join(process.cwd(), 'test-results')
  
  try {
    // Clean up auth state file
    const { promises: fs } = require('fs')
    await fs.unlink(path.join(testResultsDir, 'auth-state.json'))
    console.log('✅ Cleaned up auth state file')
  } catch (error) {
    console.log('ℹ️  No auth state file to clean up')
  }
  
  // Any other cleanup tasks...
  
  console.log('✅ Global teardown completed')
}

export default globalTeardown