'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Upload, 
  Download, 
  FolderOpen, 
  File, 
  Trash2, 
  Share2, 
  Search,
  Grid,
  List,
  MoreVertical
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatBytes, formatDate } from '@/lib/utils'

interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  size: number
  modified: Date
  shared: boolean
}

export default function FilesPage() {
  const { data: session, status } = useSession()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!session) {
    redirect('/api/auth/signin')
  }

  // Mock data - replace with actual API calls
  const files: FileItem[] = [
    {
      id: '1',
      name: 'project-assets.zip',
      type: 'file',
      size: 15728640, // 15MB
      modified: new Date('2024-01-15'),
      shared: true,
    },
    {
      id: '2',
      name: 'Documents',
      type: 'folder',
      size: 0,
      modified: new Date('2024-01-14'),
      shared: false,
    },
    {
      id: '3',
      name: 'avatar.png',
      type: 'file',
      size: 524288, // 512KB
      modified: new Date('2024-01-13'),
      shared: false,
    },
    {
      id: '4',
      name: 'Music',
      type: 'folder',
      size: 0,
      modified: new Date('2024-01-12'),
      shared: true,
    },
  ]

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const FileIcon = ({ type, name }: { type: string; name: string }) => {
    if (type === 'folder') return <FolderOpen className="h-8 w-8 text-blue-500" />
    
    const extension = name.split('.').pop()?.toLowerCase()
    const iconColor = {
      'zip': 'text-yellow-500',
      'png': 'text-green-500',
      'jpg': 'text-green-500',
      'jpeg': 'text-green-500',
      'pdf': 'text-red-500',
      'doc': 'text-blue-500',
      'docx': 'text-blue-500',
    }[extension || ''] || 'text-gray-500'
    
    return <File className={`h-8 w-8 ${iconColor}`} />
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">File Manager</h1>
          <p className="text-muted-foreground">
            2.4 GB used of 10 GB ({Math.round(2.4 / 10 * 100)}%)
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleFileUpload}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <Button variant="outline">
            <FolderOpen className="h-4 w-4 mr-2" />
            New Folder
          </Button>
        </div>
      </div>

      {/* Storage Usage Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Storage Usage</span>
              <span className="font-medium">2.4 GB / 10 GB</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all"
                style={{ width: '24%' }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* File List/Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredFiles.map((file, index) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Card 
                className={`cursor-pointer card-hover ${
                  selectedFiles.includes(file.id) ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleFileSelect(file.id)}
              >
                <CardContent className="p-4 text-center space-y-2">
                  <div className="flex justify-center">
                    <FileIcon type={file.type} name={file.name} />
                  </div>
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.type === 'file' ? formatBytes(file.size) : `${Math.floor(Math.random() * 10 + 1)} items`}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium">Modified</th>
                  <th className="text-left p-4 font-medium">Size</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file, index) => (
                  <motion.tr
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className={`border-b hover:bg-muted/50 cursor-pointer ${
                      selectedFiles.includes(file.id) ? 'bg-muted' : ''
                    }`}
                    onClick={() => handleFileSelect(file.id)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <FileIcon type={file.type} name={file.name} />
                        <span className="font-medium">{file.name}</span>
                        {file.shared && (
                          <Share2 className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {formatDate(file.modified)}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {file.type === 'file' ? formatBytes(file.size) : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          // Handle file upload
          console.log('Files selected:', e.target.files)
        }}
      />

      {/* Selected files actions */}
      {selectedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-background border rounded-lg shadow-lg p-4"
        >
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFiles([])}
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
} 