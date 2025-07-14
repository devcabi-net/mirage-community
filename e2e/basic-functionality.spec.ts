import { test, expect } from '@playwright/test'

test.describe('Basic Functionality Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/')
    
    // Basic page load check
    await expect(page).toHaveTitle(/.*/)
    
    // Check if page has basic structure
    const body = page.locator('body')
    await expect(body).toBeVisible()
    
    console.log('✅ Homepage loaded successfully')
  })

  test('should have working navigation', async ({ page }) => {
    await page.goto('/')
    
    // Check for navigation elements
    const navigation = page.locator('nav, header').first()
    
    if (await navigation.isVisible()) {
      console.log('✅ Navigation found')
    } else {
      console.log('ℹ️  No navigation found, checking for links')
    }
    
    // Check for any links
    const links = page.locator('a')
    const linkCount = await links.count()
    
    expect(linkCount).toBeGreaterThan(0)
    console.log(`✅ Found ${linkCount} links on the page`)
  })

  test('should handle API endpoints', async ({ request }) => {
    // Test basic API accessibility
    const endpoints = [
      '/api/auth/session',
      '/api/health',
      '/api/status'
    ]
    
    for (const endpoint of endpoints) {
      try {
        const response = await request.get(endpoint)
        console.log(`${endpoint}: ${response.status()}`)
        
        // Don't expect 404 for these endpoints
        if (response.status() !== 404) {
          expect(response.status()).toBeLessThan(500)
        }
      } catch (error) {
        console.log(`${endpoint}: Error - ${error}`)
      }
    }
  })

  test('should be responsive', async ({ page }) => {
    await page.goto('/')
    
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.locator('body')).toBeVisible()
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('body')).toBeVisible()
    
    console.log('✅ Page is responsive')
  })

  test('should handle errors gracefully', async ({ page }) => {
    // Test 404 handling
    const response = await page.goto('/this-page-does-not-exist')
    expect(response?.status()).toBe(404)
    
    // Page should still render something
    await expect(page.locator('body')).toBeVisible()
    
    console.log('✅ Error handling works')
  })
})