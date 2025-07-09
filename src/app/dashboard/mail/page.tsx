'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Mail, 
  Send, 
  Inbox, 
  Archive,
  Trash2,
  Star,
  Reply,
  Forward,
  Search,
  Pencil,
  Paperclip
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDate } from '@/lib/utils'

interface EmailItem {
  id: string
  from: string
  to: string
  subject: string
  preview: string
  date: Date
  read: boolean
  starred: boolean
  category: 'inbox' | 'sent' | 'archive' | 'trash'
}

export default function MailPage() {
  const { data: session, status } = useSession()
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null)
  const [activeTab, setActiveTab] = useState('inbox')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCompose, setShowCompose] = useState(false)

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!session) {
    redirect('/api/auth/signin')
  }

  // Mock data - replace with actual API calls
  const emails: EmailItem[] = [
    {
      id: '1',
      from: 'admin@themirage.xxx',
      to: session.user?.email || 'user@themirage.xxx',
      subject: 'Welcome to The Mirage Community!',
      preview: 'Thank you for joining our community. We\'re excited to have you here...',
      date: new Date('2024-01-15T10:30:00'),
      read: false,
      starred: true,
      category: 'inbox',
    },
    {
      id: '2',
      from: 'noreply@themirage.xxx',
      to: session.user?.email || 'user@themirage.xxx',
      subject: 'Your SFTP access is now active',
      preview: 'Your SFTP credentials have been generated. You can now upload files...',
      date: new Date('2024-01-14T15:45:00'),
      read: true,
      starred: false,
      category: 'inbox',
    },
    {
      id: '3',
      from: session.user?.email || 'user@themirage.xxx',
      to: 'support@themirage.xxx',
      subject: 'Question about file storage limits',
      preview: 'Hi, I wanted to ask about the storage limits for my account...',
      date: new Date('2024-01-13T09:15:00'),
      read: true,
      starred: false,
      category: 'sent',
    },
  ]

  const filteredEmails = emails
    .filter(email => email.category === activeTab)
    .filter(email => 
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.preview.toLowerCase().includes(searchQuery.toLowerCase())
    )

  const unreadCount = emails.filter(e => e.category === 'inbox' && !e.read).length

  return (
    <div className="container py-8">
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
        {/* Sidebar */}
        <div className="col-span-3 space-y-4">
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => setShowCompose(true)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Compose
          </Button>

          <Card>
            <CardContent className="p-4 space-y-1">
              <button
                onClick={() => setActiveTab('inbox')}
                className={`w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors ${
                  activeTab === 'inbox' ? 'bg-muted' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <Inbox className="h-4 w-4" />
                  <span>Inbox</span>
                </div>
                {unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('sent')}
                className={`w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors ${
                  activeTab === 'sent' ? 'bg-muted' : ''
                }`}
              >
                <Send className="h-4 w-4" />
                <span>Sent</span>
              </button>

              <button
                onClick={() => setActiveTab('archive')}
                className={`w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors ${
                  activeTab === 'archive' ? 'bg-muted' : ''
                }`}
              >
                <Archive className="h-4 w-4" />
                <span>Archive</span>
              </button>

              <button
                onClick={() => setActiveTab('trash')}
                className={`w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors ${
                  activeTab === 'trash' ? 'bg-muted' : ''
                }`}
              >
                <Trash2 className="h-4 w-4" />
                <span>Trash</span>
              </button>
            </CardContent>
          </Card>

          {/* Storage Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Mail Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Used</span>
                  <span>125 MB / 1 GB</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all"
                    style={{ width: '12.5%' }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email List */}
        <div className="col-span-4 border-r">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search mail..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="overflow-y-auto h-[calc(100%-5rem)]">
            {filteredEmails.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No emails found
              </div>
            ) : (
              filteredEmails.map((email, index) => (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  onClick={() => setSelectedEmail(email)}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedEmail?.id === email.id ? 'bg-muted' : ''
                  } ${!email.read ? 'font-semibold' : ''}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm truncate flex-1">
                      {activeTab === 'sent' ? email.to : email.from}
                    </span>
                    <div className="flex items-center gap-1">
                      {email.starred && (
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(email.date)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm mb-1">{email.subject}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {email.preview}
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Email Content */}
        <div className="col-span-5">
          {selectedEmail ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold">{selectedEmail.subject}</h2>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Star className={`h-4 w-4 ${selectedEmail.starred ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>From: {selectedEmail.from}</span>
                  <span>{selectedEmail.date.toLocaleString()}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  To: {selectedEmail.to}
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                <p className="whitespace-pre-wrap">
                  {/* This would be the full email content */}
                  {selectedEmail.preview}
                  {'\n\n'}
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  {'\n\n'}
                  Best regards,
                  {'\n'}
                  {selectedEmail.from.split('@')[0]}
                </p>
              </div>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                  <Button variant="outline" size="sm">
                    <Forward className="h-4 w-4 mr-2" />
                    Forward
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select an email to read</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCompose(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-background border rounded-lg shadow-lg w-full max-w-2xl"
          >
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">New Message</h3>
            </div>
            <div className="p-4 space-y-4">
              <Input placeholder="To" type="email" />
              <Input placeholder="Subject" />
              <textarea
                placeholder="Write your message..."
                className="w-full h-64 p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex justify-between items-center">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attach
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowCompose(false)}>
                    Cancel
                  </Button>
                  <Button>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
} 