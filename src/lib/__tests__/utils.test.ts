import { describe, it, expect } from 'vitest'
import { cn, formatDate, formatDateTime, formatNumber, formatBytes, getInitials, getDiscordAvatarUrl } from '../utils'

describe('utils', () => {
  describe('cn (className utility)', () => {
    it('should combine class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
    })

    it('should handle undefined and null values', () => {
      expect(cn('base', undefined, null, 'valid')).toBe('base valid')
    })
  })

  describe('formatDate', () => {
    it('should format recent dates correctly', () => {
      const today = new Date()
      const result = formatDate(today)
      expect(result).toBe('Today')
    })

    it('should format yesterday correctly', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const result = formatDate(yesterday)
      expect(result).toBe('Yesterday')
    })

    it('should format old dates with specific format', () => {
      const oldDate = new Date('2020-01-01')
      const result = formatDate(oldDate)
      expect(result).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)
    })
  })

  describe('formatDateTime', () => {
    it('should format dates with time', () => {
      const date = new Date('2023-01-01T12:00:00')
      const result = formatDateTime(date)
      expect(result).toContain('Jan')
      expect(result).toContain('1')
      expect(result).toContain('2023')
    })

    it('should handle string dates', () => {
      const result = formatDateTime('2023-01-01')
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1234567)).toBe('1,234,567')
    })

    it('should handle zero and negative numbers', () => {
      expect(formatNumber(0)).toBe('0')
      expect(formatNumber(-1000)).toBe('-1,000')
    })
  })

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes')
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(1024 * 1024)).toBe('1 MB')
    })

    it('should handle decimals', () => {
      expect(formatBytes(1536, 1)).toBe('1.5 KB')
      expect(formatBytes(1536, 0)).toBe('2 KB')
    })
  })

  describe('getInitials', () => {
    it('should get initials from name', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('Alice')).toBe('AL')
      expect(getInitials('John Michael Doe')).toBe('JD')
    })

    it('should handle edge cases', () => {
      expect(getInitials('')).toBe('')
      expect(getInitials('   ')).toBe('')
      expect(getInitials('A')).toBe('A')
    })
  })

  describe('getDiscordAvatarUrl', () => {
    it('should generate default avatar URL', () => {
      const url = getDiscordAvatarUrl('123456789', null)
      expect(url).toContain('embed/avatars')
      expect(url).toContain('.png')
    })

    it('should generate custom avatar URL', () => {
      const url = getDiscordAvatarUrl('123456789', 'avatar_hash')
      expect(url).toContain('avatars/123456789/avatar_hash')
      expect(url).toContain('.png')
    })

    it('should handle animated avatars', () => {
      const url = getDiscordAvatarUrl('123456789', 'a_animated_hash')
      expect(url).toContain('.gif')
    })

    it('should handle custom sizes', () => {
      const url = getDiscordAvatarUrl('123456789', 'avatar_hash', 256)
      expect(url).toContain('size=256')
    })
  })
})

// Integration test
describe('utils integration', () => {
  it('should work with CSS class combinations', () => {
    const baseClass = 'btn'
    const variantClass = 'btn-primary'
    const combinedClass = cn(baseClass, variantClass)
    
    expect(combinedClass).toBe('btn btn-primary')
  })

  it('should work with formatted data display', () => {
    const user = {
      name: 'John Doe',
      joinDate: new Date('2023-01-01'),
      messageCount: 1234567
    }
    
    const initials = getInitials(user.name)
    const joinDateFormatted = formatDate(user.joinDate)
    const messageCountFormatted = formatNumber(user.messageCount)
    
    expect(initials).toBe('JD')
    expect(typeof joinDateFormatted).toBe('string')
    expect(messageCountFormatted).toBe('1,234,567')
  })
})