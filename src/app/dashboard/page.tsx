'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, FolderOpen, Mail, Activity, Settings, Shield } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export default function DashboardPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!session) {
    redirect('/api/auth/signin')
  }

  const quickLinks = [
    {
      title: 'File Manager',
      description: 'Upload and manage your files',
      icon: FolderOpen,
      href: '/dashboard/files',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Mail',
      description: 'Check your messages',
      icon: Mail,
      href: '/dashboard/mail',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Profile',
      description: 'Customize your profile',
      icon: User,
      href: '/dashboard/profile',
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Activity',
      description: 'View your recent activity',
      icon: Activity,
      href: '/dashboard/activity',
      color: 'from-orange-500 to-red-500',
    },
    {
      title: 'Security',
      description: 'Manage SFTP access',
      icon: Shield,
      href: '/dashboard/security',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      title: 'Settings',
      description: 'Account preferences',
      icon: Settings,
      href: '/dashboard/settings',
      color: 'from-gray-500 to-gray-700',
    },
  ]

  return (
    <div className="container py-8 space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold">
          Welcome back, <span className="gradient-text">{session.user.name}</span>
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening in your account today.
        </p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              2.4 GB used of 10 GB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              2 new since yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SFTP Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Active</div>
            <p className="text-xs text-muted-foreground">
              Last login: 2 hours ago
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link, index) => (
            <motion.div
              key={link.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
            >
              <Link href={link.href}>
                <Card className="card-hover cursor-pointer overflow-hidden">
                  <div
                    className={`h-2 bg-gradient-to-r ${link.color}`}
                  />
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${link.color} bg-opacity-10`}>
                        <link.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle>{link.title}</CardTitle>
                        <CardDescription>{link.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Recent Activity</h2>
          <Button variant="outline" asChild>
            <Link href="/dashboard/activity">View All</Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <FolderOpen className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">Uploaded new file</p>
                    <p className="text-sm text-muted-foreground">project-assets.zip</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">2 hours ago</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Mail className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-medium">Received new message</p>
                    <p className="text-sm text-muted-foreground">From: admin@themirage.xxx</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">5 hours ago</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Shield className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">SFTP login</p>
                    <p className="text-sm text-muted-foreground">From IP: 192.168.1.1</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">1 day ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
} 