import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import type { DaemonStatus } from '@wildmask/types';
import { DAEMON_PID_FILE } from '@wildmask/core';

export class DaemonManager {
  private pidFile: string;

  constructor(pidFile: string = DAEMON_PID_FILE) {
    this.pidFile = pidFile;
  }

  /**
   * Gets the daemon status
   */
  getStatus(): DaemonStatus {
    if (!existsSync(this.pidFile)) {
      return { running: false };
    }

    try {
      const pid = parseInt(readFileSync(this.pidFile, 'utf-8').trim(), 10);

      // Check if process exists
      try {
        process.kill(pid, 0); // Signal 0 just checks if process exists
        return {
          running: true,
          pid,
        };
      } catch {
        // Process doesn't exist, clean up stale PID file
        unlinkSync(this.pidFile);
        return { running: false };
      }
    } catch (error) {
      return { running: false };
    }
  }

  /**
   * Writes PID file
   */
  writePid(pid: number): void {
    writeFileSync(this.pidFile, pid.toString(), 'utf-8');
  }

  /**
   * Removes PID file
   */
  removePid(): void {
    if (existsSync(this.pidFile)) {
      unlinkSync(this.pidFile);
    }
  }

  /**
   * Stops the daemon
   */
  async stop(): Promise<boolean> {
    const status = this.getStatus();

    if (!status.running || !status.pid) {
      return false;
    }

    try {
      process.kill(status.pid, 'SIGTERM');
      
      // Wait for process to exit
      await this.waitForExit(status.pid, 5000);
      
      this.removePid();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Waits for a process to exit
   */
  private waitForExit(pid: number, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const interval = setInterval(() => {
        try {
          process.kill(pid, 0);
          
          if (Date.now() - startTime > timeout) {
            clearInterval(interval);
            reject(new Error('Timeout waiting for daemon to stop'));
          }
        } catch {
          // Process doesn't exist anymore
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Restarts the daemon
   */
  async restart(): Promise<boolean> {
    await this.stop();
    // The actual start logic should be handled by the CLI/daemon process
    return true;
  }
}


