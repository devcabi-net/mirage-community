import { test, expect } from '@playwright/test'

test.describe('Navigation and Page Loading', () => {
  test('should load home page correctly', async ({ page }) => {
    await page.goto('/')
    
    // Check page title
    await expect(page).toHaveTitle(/Mirage/i)
    
    // Check for main navigation elements
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
    
    console.log('✅ Home page loaded successfully')
  })

  test('should navigate to gallery page', async ({ page }) => {
    await page.goto('/')
    
    // Look for gallery link
    const galleryLink = page.locator('text=/gallery|art/i').first()
    
    if (await galleryLink.isVisible()) {
      await galleryLink.click()
      
      // Check if gallery page loads
      await expect(page).toHaveURL(/\/gallery/)
      
      console.log('✅ Gallery navigation working')
    } else {
      console.log('ℹ️  Gallery link not found on home page')
    }
  })

  test('should navigate to dashboard (if authenticated)', async ({ page }) => {
    await page.goto('/')
    
    // Look for dashboard link
    const dashboardLink = page.locator('text=/dashboard/i').first()
    
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click()
      
      // Should either load dashboard or redirect to auth
      await page.waitForLoadState('networkidle')
      
      const currentUrl = page.url()
      expect(currentUrl).toMatch(/\/dashboard|\/auth/)
      
      console.log('✅ Dashboard navigation working')
    } else {
      console.log('ℹ️  Dashboard link not found (user not authenticated)')
    }
  })

  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/non-existent-page')
    
    // Should get 404 status
    expect(response?.status()).toBe(404)
    
    // Should display 404 page content
    await expect(page.locator('text=/404|not found/i')).toBeVisible()
    
    console.log('✅ 404 page handling working')
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check if navigation is responsive
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
    
    // Check for mobile menu button
    const mobileMenuButton = page.locator('button[aria-label*="menu"], button[aria-label*="navigation"]').first()
    
    if (await mobileMenuButton.isVisible()) {
      console.log('✅ Mobile navigation detected')
    } else {
      console.log('ℹ️  No mobile menu button found')
    }
    
    console.log('✅ Mobile responsiveness test completed')
  })
})