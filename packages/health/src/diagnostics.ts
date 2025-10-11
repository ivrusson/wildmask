import { existsSync } from 'node:fs';
import { platform } from 'node:os';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { DiagnosticCheck, DiagnosticReport } from '@wildmask/types';

const execAsync = promisify(exec);

export class Diagnostics {
  /**
   * Checks if daemon process is running
   */
  async checkDaemonRunning(pidFile: string): Promise<DiagnosticCheck> {
    const check: DiagnosticCheck = {
      name: 'Daemon Process',
      status: 'pass',
      message: 'Daemon is running',
    };

    if (!existsSync(pidFile)) {
      check.status = 'fail';
      check.message = 'Daemon PID file not found';
      return check;
    }

    try {
      const { readFileSync } = await import('node:fs');
      const pid = parseInt(readFileSync(pidFile, 'utf-8').trim(), 10);

      // Check if process exists
      try {
        process.kill(pid, 0); // Signal 0 checks if process exists
        check.status = 'pass';
        check.message = `Daemon is running (PID: ${pid})`;
      } catch {
        check.status = 'fail';
        check.message = `Daemon not running (stale PID file)`;
      }
    } catch (error) {
      check.status = 'fail';
      check.message = 'Failed to read PID file';
    }

    return check;
  }

  /**
   * Checks if port is available or in use by our daemon
   */
  async checkPortAvailable(port: number): Promise<DiagnosticCheck> {
    const check: DiagnosticCheck = {
      name: `Port ${port} Available`,
      status: 'pass',
      message: `Port ${port} is available`,
    };

    try {
      const os = platform();
      let command: string;

      if (os === 'darwin' || os === 'linux') {
        command = `lsof -i :${port} -t`;
      } else if (os === 'win32') {
        command = `netstat -ano | findstr :${port}`;
      } else {
        check.status = 'warn';
        check.message = 'Port check not supported on this platform';
        return check;
      }

      try {
        const { stdout } = await execAsync(command);
        if (stdout.trim()) {
          check.status = 'warn';
          check.message = `Port ${port} is in use`;
        }
      } catch {
        // Command failed, port is likely available
        check.status = 'pass';
      }
    } catch (error) {
      check.status = 'warn';
      check.message = `Could not check port ${port}`;
    }

    return check;
  }

  /**
   * Checks if system resolver is configured
   */
  async checkResolverConfigured(domain: string): Promise<DiagnosticCheck> {
    const check: DiagnosticCheck = {
      name: 'System Resolver',
      status: 'pass',
      message: 'Resolver is configured',
    };

    const os = platform();

    try {
      if (os === 'darwin') {
        const resolverFile = `/etc/resolver/${domain}`;
        if (!existsSync(resolverFile)) {
          check.status = 'fail';
          check.message = `Resolver not configured: ${resolverFile}`;
        }
      } else if (os === 'linux') {
        // Check systemd-resolved or NetworkManager
        check.status = 'warn';
        check.message = 'Resolver configuration check not fully implemented for Linux';
      } else if (os === 'win32') {
        check.status = 'warn';
        check.message = 'Resolver configuration check not fully implemented for Windows';
      }
    } catch (error) {
      check.status = 'warn';
      check.message = 'Could not verify resolver configuration';
    }

    return check;
  }

  /**
   * Checks if config file is valid
   */
  async checkConfigValid(configPath: string): Promise<DiagnosticCheck> {
    const check: DiagnosticCheck = {
      name: 'Configuration File',
      status: 'pass',
      message: 'Config file is valid',
    };

    if (!existsSync(configPath)) {
      check.status = 'fail';
      check.message = 'Config file not found';
      return check;
    }

    try {
      // Dynamic import to avoid circular dependency
      const { readFileSync } = await import('node:fs');
      const { parse } = await import('yaml');
      
      const content = readFileSync(configPath, 'utf-8');
      const data = parse(content);
      
      if (!data || typeof data !== 'object') {
        check.status = 'fail';
        check.message = 'Invalid config format';
      }
    } catch (error) {
      check.status = 'fail';
      check.message = `Config validation error: ${error instanceof Error ? error.message : 'Unknown'}`;
    }

    return check;
  }

  /**
   * Runs all diagnostics
   */
  async runAll(options: {
    pidFile: string;
    port: number;
    domain: string;
    configPath: string;
  }): Promise<DiagnosticReport> {
    const checks: DiagnosticCheck[] = [];

    checks.push(await this.checkDaemonRunning(options.pidFile));
    checks.push(await this.checkPortAvailable(options.port));
    checks.push(await this.checkResolverConfigured(options.domain));
    checks.push(await this.checkConfigValid(options.configPath));

    const summary = {
      passed: checks.filter((c) => c.status === 'pass').length,
      failed: checks.filter((c) => c.status === 'fail').length,
      warnings: checks.filter((c) => c.status === 'warn').length,
    };

    return {
      timestamp: new Date(),
      checks,
      summary,
    };
  }
}


