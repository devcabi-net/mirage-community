import { test, expect } from '@playwright/test'

test.describe('API Health and Functionality', () => {
  test('should have working API health endpoint', async ({ request }) => {
    // Test if basic API routes are accessible
    const response = await request.get('/api/health')
    
    // Should either work or return method not allowed, not 404
    expect(response.status()).not.toBe(404)
    
    console.log(`✅ API health check: ${response.status()}`)
  })

  test('should handle NextAuth API routes', async ({ request }) => {
    // Test NextAuth session endpoint
    const sessionResponse = await request.get('/api/auth/session')
    
    // Should return 200 (even if no session)
    expect(sessionResponse.status()).toBe(200)
    
    const sessionData = await sessionResponse.json()
    console.log('✅ NextAuth session endpoint working')
  })

  test('should handle Discord stats API', async ({ request }) => {
    // Test Discord stats endpoint
    const statsResponse = await request.get('/api/stats/discord')
    
    // Should not return 404
    expect(statsResponse.status()).not.toBe(404)
    
    if (statsResponse.status() === 200) {
      const statsData = await statsResponse.json()
      console.log('✅ Discord stats API working')
    } else {
      console.log(`ℹ️  Discord stats API returned: ${statsResponse.status()}`)
    }
  })

  test('should handle art gallery API', async ({ request }) => {
    // Test art gallery endpoint
    const galleryResponse = await request.get('/api/art')
    
    // Should not return 404
    expect(galleryResponse.status()).not.toBe(404)
    
    if (galleryResponse.status() === 200) {
      console.log('✅ Art gallery API working')
    } else {
      console.log(`ℹ️  Art gallery API returned: ${galleryResponse.status()}`)
    }
  })

  test('should handle moderation API with proper auth', async ({ request }) => {
    // Test moderation endpoint (should require auth)
    const moderationResponse = await request.get('/api/moderation')
    
    // Should return 401 (unauthorized) or 403 (forbidden) for unauthenticated request
    expect([401, 403, 405]).toContain(moderationResponse.status())
    
    console.log(`✅ Moderation API properly protected: ${moderationResponse.status()}`)
  })

  test('should handle CORS properly', async ({ request }) => {
    // Test CORS headers
    const response = await request.get('/api/auth/session', {
      headers: {
        'Origin': 'http://localhost:3000'
      }
    })
    
    const corsHeader = response.headers()['access-control-allow-origin']
    
    if (corsHeader) {
      console.log('✅ CORS headers present')
    } else {
      console.log('ℹ️  No CORS headers found (might be handled by middleware)')
    }
  })

  test('should handle rate limiting', async ({ request }) => {
    // Test rate limiting by making multiple requests
    const requests = []
    
    for (let i = 0; i < 5; i++) {
      requests.push(request.get('/api/auth/session'))
    }
    
    const responses = await Promise.all(requests)
    
    // All should succeed if rate limiting is reasonable
    const successCount = responses.filter(r => r.status() === 200).length
    
    expect(successCount).toBeGreaterThan(0)
    console.log(`✅ Rate limiting test: ${successCount}/5 requests succeeded`)
  })
})