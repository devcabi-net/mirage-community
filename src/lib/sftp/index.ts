import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { mkdir, writeFile, chmod, chown } from 'fs/promises'
import { join } from 'path'
import { execSync } from 'child_process'
import bcrypt from 'bcryptjs'

const SFTP_BASE_PATH = process.env.SFTP_BASE_PATH || '/var/www/uploads'
const SFTP_AUTHORIZED_KEYS_PATH = '/home/sftp/.ssh/authorized_keys'

export interface SftpUserConfig {
  userId: string
  username: string
  publicKey?: string
  password?: string
  permissions: {
    read: boolean
    write: boolean
    delete: boolean
  }
}

export class SftpManager {
  /**
   * Create or update SFTP access for a user
   */
  static async createUserAccess(config: SftpUserConfig): Promise<void> {
    const { userId, username, publicKey, password, permissions } = config
    
    // Validate username (alphanumeric and underscore only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new Error('Username must be alphanumeric with underscores only')
    }
    
    // Create user home directory
    const homeDirectory = join(SFTP_BASE_PATH, userId)
    await mkdir(homeDirectory, { recursive: true })
    
    // Set directory permissions (755)
    await chmod(homeDirectory, 0o755)
    
    // Create or update database record
    const passwordHash = password ? await bcrypt.hash(password, 10) : undefined
    
    await prisma.sftpAccess.upsert({
      where: { userId },
      create: {
        userId,
        username,
        publicKey,
        passwordHash,
        homeDirectory,
        permissions: permissions as any,
        enabled: true,
      },
      update: {
        username,
        publicKey,
        passwordHash: passwordHash || undefined,
        permissions: permissions as any,
      },
    })
    
    // Update system configuration
    await this.updateSystemConfig()
  }
  
  /**
   * Generate SSH key pair for a user
   */
  static async generateSSHKeyPair(userId: string): Promise<{ publicKey: string; privateKey: string }> {
    const keyPath = `/tmp/sftp_key_${userId}_${Date.now()}`
    
    try {
      // Generate SSH key pair
      execSync(`ssh-keygen -t rsa -b 4096 -f ${keyPath} -N "" -C "sftp@themirage.xxx"`)
      
      // Read the keys
      const publicKey = execSync(`cat ${keyPath}.pub`).toString().trim()
      const privateKey = execSync(`cat ${keyPath}`).toString()
      
      // Clean up temporary files
      execSync(`rm -f ${keyPath} ${keyPath}.pub`)
      
      return { publicKey, privateKey }
    } catch (error) {
      // Clean up on error
      try {
        execSync(`rm -f ${keyPath} ${keyPath}.pub`)
      } catch {}
      throw new Error('Failed to generate SSH key pair')
    }
  }
  
  /**
   * Enable/disable SFTP access for a user
   */
  static async toggleUserAccess(userId: string, enabled: boolean): Promise<void> {
    await prisma.sftpAccess.update({
      where: { userId },
      data: { enabled },
    })
    
    await this.updateSystemConfig()
  }
  
  /**
   * Remove SFTP access for a user
   */
  static async removeUserAccess(userId: string): Promise<void> {
    await prisma.sftpAccess.delete({
      where: { userId },
    })
    
    await this.updateSystemConfig()
  }
  
  /**
   * Update SSH authorized_keys file with all enabled users
   */
  private static async updateSystemConfig(): Promise<void> {
    const enabledUsers = await prisma.sftpAccess.findMany({
      where: { enabled: true },
      select: {
        username: true,
        publicKey: true,
        homeDirectory: true,
        permissions: true,
      },
    })
    
    // Build authorized_keys content
    const authorizedKeys = enabledUsers
      .filter(user => user.publicKey)
      .map(user => {
        const restrictions = [
          'no-agent-forwarding',
          'no-X11-forwarding',
          'no-port-forwarding',
          'no-pty',
        ]
        
        // Add command restrictions based on permissions
        const commands = []
        const perms = user.permissions as any
        if (perms?.read) commands.push('scp')
        if (perms?.write) commands.push('sftp')
        
        const command = commands.length > 0 
          ? `command="${commands.join(',')}"` 
          : 'command="/bin/false"'
        
        return `${restrictions.join(',')}","${command} ${user.publicKey}`
      })
      .join('\n')
    
    // Write to authorized_keys file
    await writeFile(SFTP_AUTHORIZED_KEYS_PATH, authorizedKeys)
    await chmod(SFTP_AUTHORIZED_KEYS_PATH, 0o600)
    
    // Reload SSH service
    try {
      execSync('systemctl reload sshd')
    } catch (error) {
      console.error('Failed to reload SSH service:', error)
    }
  }
  
  /**
   * Get SFTP connection details for a user
   */
  static async getUserConnectionInfo(userId: string): Promise<{
    host: string
    port: number
    username: string
    path: string
  } | null> {
    const access = await prisma.sftpAccess.findUnique({
      where: { userId, enabled: true },
    })
    
    if (!access) return null
    
    return {
      host: process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '').replace('http://', '') || 'themirage.xxx',
      port: parseInt(process.env.SFTP_PORT || '2222'),
      username: access.username,
      path: access.homeDirectory,
    }
  }
  
  /**
   * Map Discord roles to SFTP permissions
   */
  static getPermissionsFromRoles(roles: string[]): SftpUserConfig['permissions'] {
    const permissions = {
      read: true, // Everyone can read by default
      write: false,
      delete: false,
    }
    
    // Check for specific roles
    const roleNames = roles.map(r => r.toLowerCase())
    
    if (roleNames.some(r => r.includes('admin') || r.includes('mod'))) {
      permissions.write = true
      permissions.delete = true
    } else if (roleNames.some(r => r.includes('artist') || r.includes('creator'))) {
      permissions.write = true
    }
    
    return permissions
  }
} 