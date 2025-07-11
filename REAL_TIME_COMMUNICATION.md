# Real-Time Communication Implementation Guide
## WebSocket-Based Live Chat, Notifications, and Collaborative Features

### Executive Summary

This document provides a comprehensive implementation strategy for real-time communication features in The Mirage Community Platform. The focus is on creating a scalable, secure WebSocket-based system that supports live chat, real-time notifications, collaborative editing, and live community features.

**Goal:** Implement enterprise-grade real-time communication with 99.9% uptime, sub-100ms latency, and support for 10,000+ concurrent users.

**Current State:** Basic HTTP-based interactions with no real-time capabilities.

**Next Steps:** Deploy WebSocket infrastructure, implement live chat, notifications, and collaborative features.

---

## 1. WebSocket Infrastructure Setup

### 1.1 Core WebSocket Server Implementation

```typescript
// src/lib/websocket/server.ts
import { Server } from 'socket.io'
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { verifyJWT } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { RateLimiter } from './rate-limiter'
import { MessageHandler } from './message-handler'
import { NotificationHandler } from './notification-handler'

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

export class WebSocketServer {
  private io: Server
  private rateLimiter: RateLimiter
  private messageHandler: MessageHandler
  private notificationHandler: NotificationHandler
  private connectedUsers = new Map<string, Set<string>>()
  private userSockets = new Map<string, string>()

  constructor(server: any) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    })

    this.rateLimiter = new RateLimiter()
    this.messageHandler = new MessageHandler(this.io)
    this.notificationHandler = new NotificationHandler(this.io)
    
    this.setupAuthentication()
    this.setupConnectionHandlers()
    this.setupEventHandlers()
  }

  private setupAuthentication() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token
        if (!token) {
          return next(new Error('Authentication token required'))
        }

        const decoded = verifyJWT(token)
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, username: true, discordId: true }
        })

        if (!user) {
          return next(new Error('User not found'))
        }

        socket.userId = user.id
        socket.username = user.username
        next()
      } catch (error) {
        next(new Error('Authentication failed'))
      }
    })
  }

  private setupConnectionHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`User connected: ${socket.username} (${socket.userId})`)
      
      // Track user connection
      this.trackUserConnection(socket)
      
      // Join user to their personal room
      socket.join(`user:${socket.userId}`)
      
      // Handle room joining
      socket.on('join_room', (roomId) => this.handleJoinRoom(socket, roomId))
      socket.on('leave_room', (roomId) => this.handleLeaveRoom(socket, roomId))
      
      // Handle chat messages
      socket.on('chat_message', (data) => this.handleChatMessage(socket, data))
      
      // Handle typing indicators
      socket.on('typing_start', (data) => this.handleTypingStart(socket, data))
      socket.on('typing_stop', (data) => this.handleTypingStop(socket, data))
      
      // Handle collaborative features
      socket.on('collaborative_edit', (data) => this.handleCollaborativeEdit(socket, data))
      socket.on('cursor_update', (data) => this.handleCursorUpdate(socket, data))
      
      // Handle presence updates
      socket.on('presence_update', (data) => this.handlePresenceUpdate(socket, data))
      
      // Handle disconnection
      socket.on('disconnect', () => this.handleDisconnect(socket))
    })
  }

  private trackUserConnection(socket: any) {
    const userId = socket.userId
    
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set())
    }
    
    this.connectedUsers.get(userId)?.add(socket.id)
    this.userSockets.set(socket.id, userId)
    
    // Broadcast user online status
    this.io.emit('user_online', {
      userId: userId,
      username: socket.username,
      timestamp: new Date()
    })
  }

  private async handleJoinRoom(socket: any, roomId: string) {
    try {
      // Verify user has permission to join room
      const canJoin = await this.verifyRoomPermission(socket.userId, roomId)
      if (!canJoin) {
        socket.emit('error', { message: 'Permission denied' })
        return
      }

      socket.join(roomId)
      socket.emit('joined_room', { roomId })
      
      // Notify others in room
      socket.to(roomId).emit('user_joined_room', {
        userId: socket.userId,
        username: socket.username,
        roomId
      })
      
      // Send recent messages
      const recentMessages = await this.getRecentMessages(roomId)
      socket.emit('recent_messages', { roomId, messages: recentMessages })
      
      logger.info(`User ${socket.username} joined room: ${roomId}`)
    } catch (error) {
      logger.error('Error joining room:', error)
      socket.emit('error', { message: 'Failed to join room' })
    }
  }

  private async handleChatMessage(socket: any, data: any) {
    try {
      // Rate limiting
      const canSend = await this.rateLimiter.checkChatLimit(socket.userId)
      if (!canSend) {
        socket.emit('error', { message: 'Rate limit exceeded' })
        return
      }

      // Validate message
      const validation = await this.messageHandler.validateMessage(data)
      if (!validation.isValid) {
        socket.emit('error', { message: validation.error })
        return
      }

      // Process message
      const message = await this.messageHandler.processMessage({
        userId: socket.userId,
        username: socket.username,
        content: data.content,
        roomId: data.roomId,
        type: data.type || 'text',
        metadata: data.metadata || {}
      })

      // Broadcast to room
      this.io.to(data.roomId).emit('chat_message', message)
      
      // Store in database
      await this.messageHandler.storeMessage(message)
      
      logger.info(`Message sent by ${socket.username} in room ${data.roomId}`)
    } catch (error) {
      logger.error('Error handling chat message:', error)
      socket.emit('error', { message: 'Failed to send message' })
    }
  }

  private handleTypingStart(socket: any, data: any) {
    socket.to(data.roomId).emit('typing_start', {
      userId: socket.userId,
      username: socket.username,
      roomId: data.roomId
    })
  }

  private handleTypingStop(socket: any, data: any) {
    socket.to(data.roomId).emit('typing_stop', {
      userId: socket.userId,
      username: socket.username,
      roomId: data.roomId
    })
  }

  private async handleCollaborativeEdit(socket: any, data: any) {
    try {
      // Validate edit permissions
      const canEdit = await this.verifyEditPermission(socket.userId, data.documentId)
      if (!canEdit) {
        socket.emit('error', { message: 'Edit permission denied' })
        return
      }

      // Process collaborative edit
      const editResult = await this.processCollaborativeEdit(data)
      
      // Broadcast to collaborators
      socket.to(`doc:${data.documentId}`).emit('collaborative_edit', editResult)
      
      logger.info(`Collaborative edit by ${socket.username} on document ${data.documentId}`)
    } catch (error) {
      logger.error('Error handling collaborative edit:', error)
      socket.emit('error', { message: 'Failed to process edit' })
    }
  }

  private handleDisconnect(socket: any) {
    const userId = this.userSockets.get(socket.id)
    if (userId) {
      const userSockets = this.connectedUsers.get(userId)
      if (userSockets) {
        userSockets.delete(socket.id)
        
        // If user has no more connections, mark as offline
        if (userSockets.size === 0) {
          this.connectedUsers.delete(userId)
          this.io.emit('user_offline', {
            userId: userId,
            username: socket.username,
            timestamp: new Date()
          })
        }
      }
      
      this.userSockets.delete(socket.id)
    }
    
    logger.info(`User disconnected: ${socket.username} (${socket.userId})`)
  }

  // Public methods for external use
  public async sendNotification(userId: string, notification: any) {
    return this.notificationHandler.sendToUser(userId, notification)
  }

  public async broadcastToRoom(roomId: string, event: string, data: any) {
    this.io.to(roomId).emit(event, data)
  }

  public getConnectedUsers(): Map<string, Set<string>> {
    return this.connectedUsers
  }
}
```

### 1.2 Message Handler Implementation

```typescript
// src/lib/websocket/message-handler.ts
import { moderateContent } from '@/lib/moderation'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export class MessageHandler {
  constructor(private io: any) {}

  async validateMessage(data: any): Promise<{ isValid: boolean; error?: string }> {
    if (!data.content || typeof data.content !== 'string') {
      return { isValid: false, error: 'Message content is required' }
    }

    if (data.content.length > 2000) {
      return { isValid: false, error: 'Message too long' }
    }

    if (!data.roomId) {
      return { isValid: false, error: 'Room ID is required' }
    }

    // Content moderation
    if (process.env.ENABLE_MODERATION_API === 'true') {
      const moderation = await moderateContent(data.content)
      if (moderation.flagged) {
        return { isValid: false, error: 'Message violates community guidelines' }
      }
    }

    return { isValid: true }
  }

  async processMessage(messageData: any) {
    const message = {
      id: this.generateMessageId(),
      userId: messageData.userId,
      username: messageData.username,
      content: messageData.content,
      roomId: messageData.roomId,
      type: messageData.type,
      metadata: messageData.metadata,
      timestamp: new Date(),
      edited: false,
      reactions: []
    }

    // Process mentions
    message.content = await this.processMentions(message.content, messageData.roomId)
    
    // Process emoji
    message.content = await this.processEmoji(message.content)
    
    return message
  }

  async storeMessage(message: any) {
    try {
      await prisma.chatMessage.create({
        data: {
          id: message.id,
          userId: message.userId,
          content: message.content,
          roomId: message.roomId,
          type: message.type,
          metadata: message.metadata,
          timestamp: message.timestamp
        }
      })
    } catch (error) {
      logger.error('Error storing message:', error)
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async processMentions(content: string, roomId: string): Promise<string> {
    // Process @username mentions
    const mentionRegex = /@(\w+)/g
    const mentions = content.match(mentionRegex)
    
    if (mentions) {
      for (const mention of mentions) {
        const username = mention.slice(1)
        const user = await prisma.user.findFirst({
          where: { username: { equals: username, mode: 'insensitive' } },
          select: { id: true, username: true }
        })
        
        if (user) {
          // Send notification to mentioned user
          this.io.to(`user:${user.id}`).emit('mention', {
            roomId,
            mentionedBy: username,
            content: content.substring(0, 100) + '...'
          })
        }
      }
    }
    
    return content
  }

  private async processEmoji(content: string): Promise<string> {
    // Process custom emoji :emoji_name:
    const emojiRegex = /:(\w+):/g
    return content.replace(emojiRegex, (match, emojiName) => {
      // Look up custom emoji in database
      // For now, return the original text
      return match
    })
  }
}
```

### 1.3 Notification Handler

```typescript
// src/lib/websocket/notification-handler.ts
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export class NotificationHandler {
  constructor(private io: any) {}

  async sendToUser(userId: string, notification: any) {
    try {
      // Store notification in database
      const storedNotification = await prisma.notification.create({
        data: {
          userId,
          title: notification.title,
          content: notification.content,
          type: notification.type,
          metadata: notification.metadata || {},
          read: false
        }
      })

      // Send real-time notification
      this.io.to(`user:${userId}`).emit('notification', {
        id: storedNotification.id,
        title: notification.title,
        content: notification.content,
        type: notification.type,
        metadata: notification.metadata || {},
        timestamp: storedNotification.createdAt,
        read: false
      })

      logger.info(`Notification sent to user ${userId}: ${notification.title}`)
      return storedNotification
    } catch (error) {
      logger.error('Error sending notification:', error)
      throw error
    }
  }

  async sendToRoom(roomId: string, notification: any) {
    try {
      // Get all users in room
      const roomUsers = await this.getRoomUsers(roomId)
      
      // Send notification to each user
      for (const userId of roomUsers) {
        await this.sendToUser(userId, notification)
      }
    } catch (error) {
      logger.error('Error sending room notification:', error)
    }
  }

  async markAsRead(notificationId: string, userId: string) {
    try {
      await prisma.notification.update({
        where: { id: notificationId, userId },
        data: { read: true, readAt: new Date() }
      })

      this.io.to(`user:${userId}`).emit('notification_read', {
        notificationId
      })
    } catch (error) {
      logger.error('Error marking notification as read:', error)
    }
  }

  private async getRoomUsers(roomId: string): Promise<string[]> {
    // Implementation depends on your room structure
    // This is a placeholder
    return []
  }
}
```

---

## 2. Live Chat Implementation

### 2.1 Chat Component

```typescript
// src/components/chat/LiveChat.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Send, Smile, Paperclip, Users } from 'lucide-react'

interface Message {
  id: string
  userId: string
  username: string
  content: string
  timestamp: Date
  type: 'text' | 'image' | 'file'
  edited: boolean
  reactions: Array<{ emoji: string; count: number; users: string[] }>
}

interface LiveChatProps {
  roomId: string
  roomName: string
}

export default function LiveChat({ roomId, roomName }: LiveChatProps) {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!session?.user) return

    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
      auth: {
        token: session.accessToken
      }
    })

    newSocket.on('connect', () => {
      setIsConnected(true)
      newSocket.emit('join_room', roomId)
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
    })

    newSocket.on('chat_message', (message: Message) => {
      setMessages(prev => [...prev, message])
    })

    newSocket.on('recent_messages', (data: { messages: Message[] }) => {
      setMessages(data.messages)
    })

    newSocket.on('typing_start', (data: { username: string }) => {
      setTypingUsers(prev => [...prev.filter(u => u !== data.username), data.username])
    })

    newSocket.on('typing_stop', (data: { username: string }) => {
      setTypingUsers(prev => prev.filter(u => u !== data.username))
    })

    newSocket.on('user_joined_room', (data: { username: string }) => {
      setOnlineUsers(prev => [...prev.filter(u => u !== data.username), data.username])
    })

    newSocket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [session, roomId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = () => {
    if (!socket || !newMessage.trim()) return

    socket.emit('chat_message', {
      content: newMessage,
      roomId,
      type: 'text'
    })

    setNewMessage('')
    handleStopTyping()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    } else if (e.key !== 'Enter') {
      handleStartTyping()
    }
  }

  const handleStartTyping = () => {
    if (!socket || isTyping) return

    setIsTyping(true)
    socket.emit('typing_start', { roomId })

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping()
    }, 3000)
  }

  const handleStopTyping = () => {
    if (!socket || !isTyping) return

    setIsTyping(false)
    socket.emit('typing_stop', { roomId })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {roomName}
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="text-sm text-muted-foreground">
              {onlineUsers.length} online
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={`/api/avatar/${message.userId}`} />
                  <AvatarFallback>
                    {message.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{message.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(message.timestamp)}
                    </span>
                    {message.edited && (
                      <Badge variant="secondary" className="text-xs">
                        edited
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm break-words">{message.content}</div>
                  {message.reactions.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {message.reactions.map((reaction, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {reaction.emoji} {reaction.count}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span>
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${roomName}...`}
              className="flex-1"
              disabled={!isConnected}
            />
            <Button
              size="sm"
              variant="outline"
              className="flex-shrink-0"
              disabled={!isConnected}
            >
              <Smile className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-shrink-0"
              disabled={!isConnected}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleSendMessage}
              size="sm"
              className="flex-shrink-0"
              disabled={!isConnected || !newMessage.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 3. Real-time Notifications System

### 3.1 Notification Center

```typescript
// src/components/notifications/NotificationCenter.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bell, Check, X, MessageSquare, Heart, UserPlus } from 'lucide-react'

interface Notification {
  id: string
  title: string
  content: string
  type: 'message' | 'like' | 'follow' | 'system' | 'mention'
  timestamp: Date
  read: boolean
  metadata?: Record<string, any>
}

export default function NotificationCenter() {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!session?.user) return

    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
      auth: {
        token: session.accessToken
      }
    })

    newSocket.on('connect', () => {
      // Request existing notifications
      newSocket.emit('get_notifications')
    })

    newSocket.on('notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev])
      if (!notification.read) {
        setUnreadCount(prev => prev + 1)
      }
    })

    newSocket.on('notifications_list', (data: { notifications: Notification[] }) => {
      setNotifications(data.notifications)
      setUnreadCount(data.notifications.filter(n => !n.read).length)
    })

    newSocket.on('notification_read', (data: { notificationId: string }) => {
      setNotifications(prev =>
        prev.map(n =>
          n.id === data.notificationId ? { ...n, read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [session])

  const markAsRead = (notificationId: string) => {
    if (!socket) return

    socket.emit('mark_notification_read', { notificationId })
  }

  const markAllAsRead = () => {
    if (!socket) return

    const unreadNotifications = notifications.filter(n => !n.read)
    unreadNotifications.forEach(n => {
      socket.emit('mark_notification_read', { notificationId: n.id })
    })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
      case 'mention':
        return <MessageSquare className="w-4 h-4" />
      case 'like':
        return <Heart className="w-4 h-4" />
      case 'follow':
        return <UserPlus className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-80 max-h-96 shadow-lg z-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-muted/50 cursor-pointer border-l-2 ${
                        notification.read ? 'border-l-transparent' : 'border-l-primary'
                      }`}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id)
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {notification.title}
                            </span>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {notification.content}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

---

## 4. Database Schema Updates

```sql
-- Add to prisma/schema.prisma

model ChatMessage {
  id        String   @id @default(cuid())
  userId    String
  content   String   @db.Text
  roomId    String
  type      String   @default("text")
  metadata  Json?
  edited    Boolean  @default(false)
  editedAt  DateTime?
  timestamp DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([roomId, timestamp])
  @@index([userId])
}

model Notification {
  id        String    @id @default(cuid())
  userId    String
  title     String
  content   String    @db.Text
  type      String
  metadata  Json?
  read      Boolean   @default(false)
  readAt    DateTime?
  createdAt DateTime  @default(now())
  
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, read])
  @@index([createdAt])
}

model ChatRoom {
  id          String   @id @default(cuid())
  name        String
  description String?
  type        String   @default("public")
  metadata    Json?
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  creator     User     @relation(fields: [createdBy], references: [id])
  members     ChatRoomMember[]
  
  @@index([type])
  @@index([createdBy])
}

model ChatRoomMember {
  id       String   @id @default(cuid())
  roomId   String
  userId   String
  role     String   @default("member")
  joinedAt DateTime @default(now())
  
  room     ChatRoom @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([roomId, userId])
  @@index([userId])
}

model PresenceStatus {
  id        String   @id @default(cuid())
  userId    String   @unique
  status    String   @default("offline")
  lastSeen  DateTime @default(now())
  metadata  Json?
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([status])
  @@index([lastSeen])
}
```

---

## 5. Server Configuration

### 5.1 Next.js Custom Server

```typescript
// server.js
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { WebSocketServer } = require('./src/lib/websocket/server')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true)
    await handle(req, res, parsedUrl)
  })

  // Initialize WebSocket server
  const wsServer = new WebSocketServer(server)

  server.listen(3001, (err) => {
    if (err) throw err
    console.log('> Ready on http://localhost:3001')
  })
})
```

### 5.2 Environment Variables

```env
# WebSocket Configuration
NEXT_PUBLIC_WS_URL=ws://localhost:3001
WS_CORS_ORIGIN=http://localhost:3000

# Real-time Features
ENABLE_REAL_TIME_CHAT=true
ENABLE_NOTIFICATIONS=true
ENABLE_COLLABORATIVE_EDITING=true

# Rate Limiting
CHAT_RATE_LIMIT=30
NOTIFICATION_RATE_LIMIT=10
```

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Set up WebSocket server infrastructure
- [ ] Implement authentication and connection management
- [ ] Create basic message handling system
- [ ] Deploy real-time notification system

### Phase 2: Chat Features (Week 2)
- [ ] Implement live chat with typing indicators
- [ ] Add message persistence and history
- [ ] Create chat rooms and permission system
- [ ] Deploy emoji and mention support

### Phase 3: Advanced Features (Week 3)
- [ ] Implement collaborative editing
- [ ] Add presence and status system
- [ ] Create advanced notification types
- [ ] Deploy mobile-optimized interfaces

### Phase 4: Optimization (Week 4)
- [ ] Implement message caching and optimization
- [ ] Add connection pooling and load balancing
- [ ] Deploy monitoring and analytics
- [ ] Optimize for 10,000+ concurrent users

---

## 7. Success Metrics

### Performance Targets
- **Latency**: <100ms for message delivery
- **Concurrent Users**: Support 10,000+ active connections
- **Uptime**: 99.9% availability
- **Message Throughput**: 1,000+ messages/second

### User Experience
- **Real-time Updates**: Instant message delivery
- **Typing Indicators**: <500ms response time
- **Notification Delivery**: <200ms for urgent notifications
- **Connection Stability**: Auto-reconnection on network issues

This implementation provides a comprehensive real-time communication system that scales with your community growth while maintaining high performance and reliability.