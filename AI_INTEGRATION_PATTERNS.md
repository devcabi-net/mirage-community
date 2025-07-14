# AI Integration Patterns

## Overview

This document describes the AI integration patterns implemented in the Mirage Community Platform, focusing on content moderation and automated community management.

## Current AI Implementation

### Content Moderation System

The platform implements a multi-layered AI-powered content moderation system:

#### OpenAI Integration (Primary)

**Implementation Location**: `/src/lib/moderation/index.ts`

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function moderateContent(content: string): Promise<ModerationResult> {
  try {
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
    
    // Process flagged content
    return processOpenAIResult(result)
  } catch (error) {
    logger.error('Error in OpenAI moderation:', error)
    return fallbackModeration(content)
  }
}
```

**Categories Detected**:
- Hate speech
- Harassment/threatening
- Self-harm content
- Sexual content
- Violence/graphic content

**Usage Areas**:
- Art description moderation
- User-generated content filtering
- Comment moderation
- Profile content validation

#### Perspective API Integration (Fallback)

**Implementation**: Backup moderation system when OpenAI is unavailable

```typescript
export async function moderateContentWithPerspective(content: string): Promise<ModerationResult> {
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
        },
      }),
    }
  )
  
  const data = await response.json()
  return processPerspectiveResult(data)
}
```

**Attributes Analyzed**:
- Toxicity levels
- Identity attacks
- Threats
- Profanity
- Sexual content
- Insults

#### Basic Word Filtering (Final Fallback)

**Implementation**: Simple pattern matching for offline capability

```typescript
function fallbackModeration(content: string): ModerationResult {
  const lowerContent = content.toLowerCase()
  
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
```

### Integration Points

#### Art Upload Moderation

**Location**: `/src/app/api/art/upload/route.ts`

```typescript
// Moderate content if description provided
if (description && process.env.ENABLE_MODERATION_API === 'true') {
  const moderation = await moderateContent(description)
  if (moderation.flagged) {
    return NextResponse.json({ 
      error: 'Content violates community guidelines',
      category: moderation.category 
    }, { status: 400 })
  }
}
```

#### Discord Bot Integration

**Auto-moderation**: Planned for message content analysis
**Command responses**: Enhanced moderation context
**User warnings**: AI-assisted severity assessment

### Response Structure

```typescript
interface ModerationResult {
  flagged: boolean
  category: FlagType
  severity: number // 0-1 scale
  raw: any // Original API response
}

enum FlagType {
  HATE_SPEECH = 'HATE_SPEECH',
  HARASSMENT = 'HARASSMENT',
  SELF_HARM = 'SELF_HARM',
  NSFW = 'NSFW',
  VIOLENCE = 'VIOLENCE',
  SPAM = 'SPAM',
  OTHER = 'OTHER'
}
```

## Performance Considerations

### Caching Strategy

**Current**: No caching implemented
**Planned**: Redis-based result caching for repeated content

### Rate Limiting

**OpenAI API**: Built-in rate limiting
**Perspective API**: 1000 requests/minute (configurable)
**Fallback**: No limits (local processing)

### Error Handling

```typescript
export async function moderateContent(content: string): Promise<ModerationResult> {
  try {
    // OpenAI API attempt
    return await moderateWithOpenAI(content)
  } catch (openAIError) {
    logger.warn('OpenAI moderation failed, trying Perspective API')
    
    try {
      // Perspective API fallback
      return await moderateWithPerspective(content)
    } catch (perspectiveError) {
      logger.error('All AI moderation failed, using basic filter')
      
      // Basic word filtering fallback
      return fallbackModeration(content)
    }
  }
}
```

## Configuration

### Environment Variables

```bash
# OpenAI Configuration
OPENAI_API_KEY=your-openai-key
ENABLE_MODERATION_API=true

# Perspective API Configuration
PERSPECTIVE_API_KEY=your-perspective-key

# Moderation Settings
MODERATION_THRESHOLD=0.5
ENABLE_FALLBACK_MODERATION=true
```

### Moderation Thresholds

```typescript
const MODERATION_THRESHOLDS = {
  HATE_SPEECH: 0.5,
  HARASSMENT: 0.6,
  SELF_HARM: 0.3,
  NSFW: 0.7,
  VIOLENCE: 0.5,
  SPAM: 0.8,
}
```

## Database Integration

### Moderation Flags

```prisma
model ModerationFlag {
  id          String    @id @default(cuid())
  contentId   String    // ID of flagged content
  contentType String    // 'artwork', 'comment', 'profile'
  flagType    FlagType
  severity    Float
  aiResult    Json      // Raw AI response
  reviewed    Boolean   @default(false)
  approved    Boolean?
  reviewedBy  String?
  reviewedAt  DateTime?
  createdAt   DateTime  @default(now())
}
```

### Moderation Logs

```prisma
model ModerationLog {
  id          String    @id @default(cuid())
  guildId     String
  userId      String
  moderatorId String
  action      ModAction
  reason      String
  aiAssisted  Boolean   @default(false) // Was AI used in decision?
  aiCategory  FlagType?
  duration    Int?
  createdAt   DateTime  @default(now())
}
```

## Security Considerations

### API Key Management

- Store API keys in environment variables
- Use separate keys for development/production
- Rotate keys regularly
- Monitor API usage and costs

### Data Privacy

- Don't log sensitive content
- Hash or anonymize stored moderation data
- Comply with data retention policies
- Allow users to request data deletion

### Rate Limiting

- Implement client-side rate limiting
- Use exponential backoff for API failures
- Monitor API quotas and usage
- Implement graceful degradation

## Testing Strategy

### Unit Tests

```typescript
// Test moderation function
describe('moderateContent', () => {
  it('should flag hate speech', async () => {
    const result = await moderateContent('hate speech example')
    expect(result.flagged).toBe(true)
    expect(result.category).toBe(FlagType.HATE_SPEECH)
  })
  
  it('should handle API failures gracefully', async () => {
    // Mock API failure
    const result = await moderateContent('normal content')
    expect(result).toBeDefined()
  })
})
```

### Integration Tests

```typescript
// Test API endpoint
describe('Art Upload API', () => {
  it('should reject inappropriate content', async () => {
    const response = await request(app)
      .post('/api/art/upload')
      .field('description', 'inappropriate content')
      .attach('file', 'test-image.jpg')
    
    expect(response.status).toBe(400)
    expect(response.body.error).toContain('community guidelines')
  })
})
```

## Monitoring and Analytics

### Metrics Collection

```typescript
// Track moderation metrics
export class ModerationMetrics {
  static async logModerationResult(result: ModerationResult, contentType: string) {
    await prisma.moderationMetric.create({
      data: {
        contentType,
        flagged: result.flagged,
        category: result.category,
        severity: result.severity,
        apiUsed: result.raw.apiUsed || 'openai',
        timestamp: new Date(),
      }
    })
  }
}
```

### Key Metrics

- Moderation requests per day
- False positive/negative rates
- API response times
- Cost per moderation request
- Content category distribution

## Cost Optimization

### API Usage Optimization

```typescript
// Implement content caching
const moderationCache = new Map<string, ModerationResult>()

export async function moderateContentCached(content: string): Promise<ModerationResult> {
  const contentHash = crypto.createHash('sha256').update(content).digest('hex')
  
  // Check cache first
  const cached = moderationCache.get(contentHash)
  if (cached) {
    return cached
  }
  
  // Moderate and cache result
  const result = await moderateContent(content)
  moderationCache.set(contentHash, result)
  
  return result
}
```

### Batch Processing

```typescript
// Batch moderate multiple items
export async function moderateContentBatch(contents: string[]): Promise<ModerationResult[]> {
  const results = []
  
  for (const content of contents) {
    results.push(await moderateContent(content))
    
    // Add delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return results
}
```

## Future Enhancements

### Planned AI Features

1. **Enhanced Content Analysis**
   - Image content moderation
   - Audio content analysis
   - Multi-language support

2. **Automated Moderation Actions**
   - Auto-warn users for minor violations
   - Automatic content quarantine
   - Escalation to human moderators

3. **Community Insights**
   - Content trend analysis
   - User behavior patterns
   - Community health metrics

4. **Personalization**
   - User-specific content filters
   - Adaptive moderation thresholds
   - Cultural sensitivity adjustments

### Technical Improvements

1. **Performance**
   - Redis caching layer
   - Parallel processing
   - Result prediction

2. **Accuracy**
   - Custom model training
   - Feedback loop integration
   - Context-aware moderation

3. **Scalability**
   - Microservice architecture
   - Load balancing
   - Auto-scaling

## Best Practices

### Implementation Guidelines

1. **Always provide fallbacks** for AI service failures
2. **Log moderation decisions** for audit trails
3. **Respect user privacy** in AI processing
4. **Monitor costs** and usage patterns
5. **Test thoroughly** with diverse content
6. **Regular model updates** and threshold tuning

### Error Handling

```typescript
// Comprehensive error handling
export async function safeModerateContent(content: string): Promise<ModerationResult> {
  try {
    const result = await moderateContent(content)
    
    // Log successful moderation
    logger.info('Content moderated successfully', {
      flagged: result.flagged,
      category: result.category,
      severity: result.severity
    })
    
    return result
  } catch (error) {
    logger.error('Moderation failed completely', error)
    
    // Return safe default
    return {
      flagged: false,
      category: FlagType.OTHER,
      severity: 0,
      raw: { error: true }
    }
  }
}
```

This AI integration provides robust content moderation while maintaining system reliability and performance. The multi-layered approach ensures consistent moderation even when external services are unavailable.