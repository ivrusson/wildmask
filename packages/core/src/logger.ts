import { appendFileSync, existsSync, mkdirSync, statSync, unlinkSync, renameSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Logger, LogLevel, LogEntry } from '@wildmask/types';

export class FileLogger implements Logger {
  private logFile: string;
  private level: LogLevel;
  private maxSize: number;
  private maxFiles: number;

  constructor(
    logFile: string,
    level: LogLevel = 'info',
    maxSize: number = 10 * 1024 * 1024, // 10MB
    maxFiles: number = 5
  ) {
    this.logFile = logFile;
    this.level = level;
    this.maxSize = maxSize;
    this.maxFiles = maxFiles;
    this.ensureLogDir();
  }

  private ensureLogDir() {
    const dir = dirname(this.logFile);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevel = levels.indexOf(this.level);
    const messageLevel = levels.indexOf(level);
    return messageLevel >= currentLevel;
  }

  private rotate() {
    if (!existsSync(this.logFile)) return;

    const stats = statSync(this.logFile);
    if (stats.size < this.maxSize) return;

    // Rotate logs
    const base = this.logFile;

    // Delete oldest log
    const oldestLog = `${base}.${this.maxFiles}`;
    if (existsSync(oldestLog)) {
      unlinkSync(oldestLog);
    }

    // Shift logs
    for (let i = this.maxFiles - 1; i >= 1; i--) {
      const src = i === 1 ? base : `${base}.${i}`;
      const dest = `${base}.${i + 1}`;
      if (existsSync(src)) {
        try {
          renameSync(src, dest);
        } catch {
          // Ignore errors during rotation
        }
      }
    }
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
    if (!this.shouldLog(level)) return;

    this.rotate();

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      metadata,
    };

    const logLine = `[${entry.timestamp.toISOString()}] ${level.toUpperCase()}: ${message}${
      metadata ? ' ' + JSON.stringify(metadata) : ''
    }\n`;

    try {
      appendFileSync(this.logFile, logLine, 'utf-8');
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.log('error', message, metadata);
  }
}

export class ConsoleLogger implements Logger {
  private level: LogLevel;

  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevel = levels.indexOf(this.level);
    const messageLevel = levels.indexOf(level);
    return messageLevel >= currentLevel;
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog('debug')) return;
    console.debug(`[DEBUG] ${message}`, metadata || '');
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog('info')) return;
    console.info(`[INFO] ${message}`, metadata || '');
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog('warn')) return;
    console.warn(`[WARN] ${message}`, metadata || '');
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog('error')) return;
    console.error(`[ERROR] ${message}`, metadata || '');
  }
}


