import { platform as osPlatform, arch as osArch, release } from 'node:os';
import type { Platform, PlatformInfo } from '@wildmask/types';

/**
 * Gets current platform information
 */
export function getPlatformInfo(): PlatformInfo {
  const platform = osPlatform() as Platform;
  const arch = osArch();
  const version = release();

  return {
    platform,
    arch,
    version,
    canElevate: platform === 'darwin' || platform === 'linux' || platform === 'win32',
  };
}

/**
 * Checks if a port is valid
 */
export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

/**
 * Checks if a hostname is valid
 */
export function isValidHostname(hostname: string): boolean {
  const pattern = /^[a-zA-Z0-9\-\*\.]+$/;
  return pattern.test(hostname);
}

/**
 * Checks if a hostname is a wildcard pattern
 */
export function isWildcard(hostname: string): boolean {
  return hostname.includes('*');
}

/**
 * Converts wildcard pattern to regex
 */
export function wildcardToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  const regex = escaped.replace(/\*/g, '.*');
  return new RegExp(`^${regex}$`, 'i');
}

/**
 * Formats bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Parses size string like "10mb" to bytes
 */
export function parseSize(size: string): number {
  const match = size.match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb|tb)?$/i);
  if (!match) throw new Error(`Invalid size format: ${size}`);

  const value = parseFloat(match[1]);
  const unit = (match[2] || 'b').toLowerCase();

  const multipliers: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
    tb: 1024 * 1024 * 1024 * 1024,
  };

  return Math.floor(value * multipliers[unit]);
}

/**
 * Formats uptime in seconds to human-readable string
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}


