# Testing Documentation

## Overview

This project uses a comprehensive testing setup with both unit tests and end-to-end tests to ensure code quality and functionality.

## Testing Stack

- **Unit Tests**: [Vitest](https://vitest.dev/) - Fast unit testing framework
- **End-to-End Tests**: [Playwright](https://playwright.dev/) - Browser automation for E2E testing
- **Component Testing**: [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Testing React components
- **Mocking**: [Vitest's built-in mocking](https://vitest.dev/guide/mocking.html) - For mocking dependencies

## Test Structure

```
├── src/
│   ├── components/
│   │   └── __tests__/          # Component unit tests
│   ├── lib/
│   │   └── __tests__/          # Library/utility unit tests
│   └── app/
│       └── api/
│           └── __tests__/      # API unit tests
├── e2e/                        # End-to-end tests
│   ├── global-setup.ts        # Global E2E setup
│   ├── global-teardown.ts     # Global E2E cleanup
│   └── *.spec.ts              # E2E test files
├── tests/
│   └── setup.ts               # Test setup configuration
└── test-results/              # Test output directory
```

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests with verbose output
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only unit tests (src directory)
npm run test:unit

# Run tests with UI
npm run test:ui

# Run tests once (no watch mode)
npm run test:run
```

### End-to-End Tests (Playwright)

```bash
# Run E2E tests with verbose output
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug
```

### All Tests

```bash
# Run both unit and E2E tests
npm run test:all

# Run tests for CI (coverage + E2E)
npm run test:ci
```

## Test Configuration

### Vitest Configuration

The `vitest.config.ts` file includes:

- **Verbose output**: Detailed test reporting
- **Coverage reporting**: V8 coverage with HTML, JSON, and LCOV formats
- **Test results**: JSON and HTML output in `test-results/`
- **Environment**: jsdom for DOM testing
- **Setup file**: `tests/setup.ts` for global test configuration

### Playwright Configuration

The `playwright.config.ts` file includes:

- **Verbose output**: List reporter for detailed console output
- **Multiple browsers**: Chromium, Firefox, Safari, and mobile devices
- **Screenshots**: On failure only
- **Video recording**: On failure only
- **Trace collection**: On retry
- **Test results**: HTML, JSON, and JUnit formats

## Writing Tests

### Unit Tests

```typescript
// src/lib/__tests__/utils.test.ts
import { describe, it, expect } from 'vitest'
import { cn, formatDate } from '../utils'

describe('utils', () => {
  describe('cn (className utility)', () => {
    it('should combine class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })
  })

  describe('formatDate', () => {
    it('should format recent dates correctly', () => {
      const today = new Date()
      const result = formatDate(today)
      expect(result).toBe('Today')
    })
  })
})
```

### Component Tests

```typescript
// src/components/__tests__/Button.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../ui/button'

describe('Button', () => {
  it('should render with default props', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### E2E Tests

```typescript
// e2e/basic-functionality.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Basic Functionality Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/')
    
    await expect(page).toHaveTitle(/Mirage/)
    await expect(page.locator('body')).toBeVisible()
    
    console.log('✅ Homepage loaded successfully')
  })

  test('should handle API endpoints', async ({ request }) => {
    const response = await request.get('/api/auth/session')
    expect(response.status()).toBe(200)
    
    console.log('✅ API endpoint working')
  })
})
```

## Test Categories

### 1. Unit Tests

- **Utils**: Test utility functions (`src/lib/__tests__/`)
- **Components**: Test React components (`src/components/__tests__/`)
- **API**: Test API logic (`src/app/api/__tests__/`)

### 2. Integration Tests

- **Database**: Test database operations with real connections
- **Auth**: Test authentication flows
- **Discord**: Test Discord bot integration

### 3. End-to-End Tests

- **User Flows**: Test complete user journeys
- **API Endpoints**: Test API responses
- **Authentication**: Test login/logout flows
- **Navigation**: Test page navigation
- **Responsive Design**: Test mobile/desktop views

## Test Output

### Console Output (Verbose)

Tests run with verbose output showing:
- Test names and descriptions
- Pass/fail status with timing
- Console.log messages from tests
- Error details for failed tests
- Coverage summary

### File Output

- **HTML Reports**: `test-results/unit-test-results.html`, `test-results/playwright-report/`
- **JSON Reports**: `test-results/unit-test-results.json`, `test-results/playwright-results.json`
- **Coverage Reports**: `test-results/coverage/` (HTML, JSON, LCOV)
- **JUnit Reports**: `test-results/playwright-results.xml`

## Debugging Tests

### Unit Tests

```bash
# Run specific test file
npm run test -- src/lib/__tests__/utils.test.ts

# Run specific test pattern
npm run test -- --grep "formatDate"

# Run tests with debugger
npm run test -- --inspect-brk
```

### E2E Tests

```bash
# Run specific test file
npm run test:e2e -- e2e/basic-functionality.spec.ts

# Run tests with browser visible
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug -- --grep "should load homepage"
```

## Best Practices

### 1. Test Organization

- Group related tests with `describe` blocks
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)

### 2. Mocking

- Mock external dependencies
- Use `vi.fn()` for function mocks
- Mock environment variables in tests

### 3. Assertions

- Use specific assertions (`toBe`, `toContain`, etc.)
- Test both positive and negative cases
- Include edge cases

### 4. Console Logging

- Use `console.log` for test progress indicators
- Include emojis for better readability (✅, ❌, ℹ️)
- Log test results and important values

### 5. Coverage

- Maintain 80% coverage threshold
- Focus on critical business logic
- Don't test implementation details

## CI/CD Integration

The test suite is configured for CI/CD with:

- **GitHub Actions**: Test reports and artifact uploads
- **Coverage reporting**: LCOV format for external tools
- **Parallel execution**: Tests run in parallel where possible
- **Retry logic**: Flaky tests are retried automatically

## Troubleshooting

### Common Issues

1. **Import errors**: Check TypeScript configuration
2. **DOM not available**: Ensure jsdom environment is set
3. **Mock issues**: Verify mock placement and implementation
4. **E2E timeouts**: Increase timeout values or optimize tests

### Performance

- Use `test.concurrent` for independent tests
- Mock heavy dependencies
- Optimize database queries in tests
- Use test.skip() for temporarily broken tests

## Future Enhancements

- [ ] Visual regression testing
- [ ] Performance testing
- [ ] Database migration testing
- [ ] Load testing with Artillery
- [ ] Accessibility testing automation