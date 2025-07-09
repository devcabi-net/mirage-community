import OpenAI from 'openai'
import { logger } from '@/lib/logger'
import { FlagType } from '@prisma/client'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ModerationResult {
  flagged: boolean
  category: FlagType
  severity: number
  raw: any
}

export async function moderateContent(content: string): Promise<ModerationResult> {
  try {
    // Use OpenAI's moderation API
    const response = await openai.moderations.create({
      input: content,
    })
    
    const result = response.results[0]
    
    if (!result.flagged) {
      return {
        flagged: false,
        category: FlagType.OTHER,
        severity: 0,
        raw: result,
      }
    }
    
    // Determine the primary category and severity
    let category: FlagType = FlagType.OTHER
    let maxScore = 0
    
    const categoryMapping: Record<string, FlagType> = {
      'hate': FlagType.HATE_SPEECH,
      'hate/threatening': FlagType.HATE_SPEECH,
      'harassment': FlagType.HARASSMENT,
      'harassment/threatening': FlagType.HARASSMENT,
      'self-harm': FlagType.SELF_HARM,
      'self-harm/intent': FlagType.SELF_HARM,
      'self-harm/instructions': FlagType.SELF_HARM,
      'sexual': FlagType.NSFW,
      'sexual/minors': FlagType.NSFW,
      'violence': FlagType.VIOLENCE,
      'violence/graphic': FlagType.VIOLENCE,
    }
    
    // Find the category with the highest score
    for (const [key, score] of Object.entries(result.category_scores)) {
      if (score > maxScore && result.categories[key as keyof typeof result.categories]) {
        maxScore = score
        category = categoryMapping[key] || FlagType.OTHER
      }
    }
    
    return {
      flagged: true,
      category,
      severity: maxScore,
      raw: result,
    }
  } catch (error) {
    logger.error('Error in OpenAI moderation:', error)
    
    // Fallback to basic content filtering
    return fallbackModeration(content)
  }
}

function fallbackModeration(content: string): ModerationResult {
  const lowerContent = content.toLowerCase()
  
  // Basic word filter (you should expand this)
  const filters = {
    [FlagType.HATE_SPEECH]: ['hate', 'racist', 'sexist'],
    [FlagType.HARASSMENT]: ['kys', 'kill yourself', 'die'],
    [FlagType.SPAM]: ['discord.gg/', 'bit.ly/', 'tinyurl.com/'],
  }
  
  for (const [category, words] of Object.entries(filters)) {
    for (const word of words) {
      if (lowerContent.includes(word)) {
        return {
          flagged: true,
          category: category as FlagType,
          severity: 0.8,
          raw: { fallback: true, matched: word },
        }
      }
    }
  }
  
  return {
    flagged: false,
    category: FlagType.OTHER,
    severity: 0,
    raw: { fallback: true },
  }
}

// Alternative: Google Perspective API implementation
export async function moderateContentWithPerspective(content: string): Promise<ModerationResult> {
  if (!process.env.PERSPECTIVE_API_KEY) {
    return moderateContent(content) // Fall back to OpenAI
  }
  
  try {
    const response = await fetch(
      `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${process.env.PERSPECTIVE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: { text: content },
          requestedAttributes: {
            TOXICITY: {},
            SEVERE_TOXICITY: {},
            IDENTITY_ATTACK: {},
            INSULT: {},
            PROFANITY: {},
            THREAT: {},
            SEXUALLY_EXPLICIT: {},
            FLIRTATION: {},
          },
        }),
      }
    )
    
    if (!response.ok) {
      throw new Error(`Perspective API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    const scores = data.attributeScores
    
    let flagged = false
    let category: FlagType = FlagType.OTHER
    let maxScore = 0
    
    const thresholds: Record<string, { threshold: number; category: FlagType }> = {
      SEVERE_TOXICITY: { threshold: 0.5, category: FlagType.HARASSMENT },
      IDENTITY_ATTACK: { threshold: 0.5, category: FlagType.HATE_SPEECH },
      THREAT: { threshold: 0.5, category: FlagType.VIOLENCE },
      SEXUALLY_EXPLICIT: { threshold: 0.7, category: FlagType.NSFW },
      INSULT: { threshold: 0.7, category: FlagType.HARASSMENT },
      PROFANITY: { threshold: 0.8, category: FlagType.OTHER },
    }
    
    for (const [attr, config] of Object.entries(thresholds)) {
      const score = scores[attr]?.summaryScore?.value || 0
      if (score > config.threshold) {
        flagged = true
        if (score > maxScore) {
          maxScore = score
          category = config.category
        }
      }
    }
    
    return {
      flagged,
      category,
      severity: maxScore,
      raw: data,
    }
  } catch (error) {
    logger.error('Error in Perspective API moderation:', error)
    return moderateContent(content) // Fall back to OpenAI
  }
} 