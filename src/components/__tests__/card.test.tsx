import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card'

describe('Card Components', () => {
  describe('Card', () => {
    it('should render with default styles', () => {
      render(<Card data-testid="card">Card content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-card')
    })

    it('should accept custom className', () => {
      render(<Card className="custom-card" data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('custom-card')
    })
  })

  describe('CardHeader', () => {
    it('should render with proper spacing', () => {
      render(<CardHeader data-testid="header">Header content</CardHeader>)
      const header = screen.getByTestId('header')
      expect(header).toBeInTheDocument()
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
    })
  })

  describe('CardTitle', () => {
    it('should render as h3 by default', () => {
      render(<CardTitle>Card Title</CardTitle>)
      const title = screen.getByRole('heading', { level: 3 })
      expect(title).toBeInTheDocument()
      expect(title).toHaveTextContent('Card Title')
    })

    it('should have proper typography classes', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>)
      const title = screen.getByTestId('title')
      expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight')
    })
  })

  describe('CardDescription', () => {
    it('should render with muted text', () => {
      render(<CardDescription data-testid="description">Description text</CardDescription>)
      const description = screen.getByTestId('description')
      expect(description).toBeInTheDocument()
      expect(description).toHaveClass('text-sm', 'text-muted-foreground')
    })
  })

  describe('CardContent', () => {
    it('should render with padding', () => {
      render(<CardContent data-testid="content">Content</CardContent>)
      const content = screen.getByTestId('content')
      expect(content).toBeInTheDocument()
      expect(content).toHaveClass('p-6', 'pt-0')
    })
  })

  describe('CardFooter', () => {
    it('should render with flex layout', () => {
      render(<CardFooter data-testid="footer">Footer content</CardFooter>)
      const footer = screen.getByTestId('footer')
      expect(footer).toBeInTheDocument()
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
    })
  })

  describe('Complete Card', () => {
    it('should render all components together', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>This is a test card</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      )

      expect(screen.getByTestId('complete-card')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Test Card' })).toBeInTheDocument()
      expect(screen.getByText('This is a test card')).toBeInTheDocument()
      expect(screen.getByText('Main content goes here')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
    })

    it('should work without all sections', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Simple Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Just title and content</p>
          </CardContent>
        </Card>
      )

      expect(screen.getByRole('heading', { name: 'Simple Card' })).toBeInTheDocument()
      expect(screen.getByText('Just title and content')).toBeInTheDocument()
      expect(screen.queryByText('Description')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      render(
        <Card tabIndex={0} data-testid="focusable-card">
          <CardContent>Focusable card</CardContent>
        </Card>
      )

      const card = screen.getByTestId('focusable-card')
      expect(card).toHaveAttribute('tabIndex', '0')
    })

    it('should support ARIA attributes', () => {
      render(
        <Card aria-label="User profile card" data-testid="aria-card">
          <CardContent>User info</CardContent>
        </Card>
      )

      const card = screen.getByTestId('aria-card')
      expect(card).toHaveAttribute('aria-label', 'User profile card')
    })
  })
})