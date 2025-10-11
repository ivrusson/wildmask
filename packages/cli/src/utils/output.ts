import chalk from 'chalk';
import Table from 'cli-table3';
import type { Mapping, DaemonStatus, DiagnosticReport } from '@wildmask/types';

export function success(message: string): void {
  console.log(chalk.green('✓'), message);
}

export function error(message: string): void {
  console.error(chalk.red('✗'), message);
}

export function warn(message: string): void {
  console.warn(chalk.yellow('⚠'), message);
}

export function info(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

export function printMappings(mappings: Mapping[]): void {
  if (mappings.length === 0) {
    info('No mappings configured');
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan('ID'),
      chalk.cyan('FQDN'),
      chalk.cyan('Target'),
      chalk.cyan('Port'),
      chalk.cyan('Protocol'),
      chalk.cyan('Status'),
    ],
    style: {
      head: [],
      border: [],
    },
  });

  for (const mapping of mappings) {
    // Build FQDN (Fully Qualified Domain Name)
    const fqdn = mapping.domain ? `${mapping.host}.${mapping.domain}` : mapping.host;
    
    table.push([
      mapping.id.slice(0, 8),
      fqdn,
      mapping.target,
      mapping.port.toString(),
      mapping.protocol,
      mapping.enabled ? chalk.green('✓ Enabled') : chalk.gray('○ Disabled'),
    ]);
  }

  console.log(table.toString());
}

export function printStatus(status: DaemonStatus): void {
  console.log(chalk.bold('\n🎭 WildMask Daemon Status\n'));

  const table = new Table({
    style: {
      head: [],
      border: [],
    },
  });

  table.push(
    ['Status', status.running ? chalk.green('● Running') : chalk.red('○ Stopped')],
    ['PID', status.pid?.toString() || chalk.gray('N/A')],
    ['Port', status.port?.toString() || chalk.gray('N/A')],
    ['Uptime', status.uptime ? formatUptime(status.uptime) : chalk.gray('N/A')]
  );

  console.log(table.toString());
}

export function printDiagnostics(report: DiagnosticReport): void {
  console.log(chalk.bold('\n🔍 Diagnostic Report\n'));

  for (const check of report.checks) {
    let icon: string;
    let color: typeof chalk.green;

    switch (check.status) {
      case 'pass':
        icon = '✓';
        color = chalk.green;
        break;
      case 'fail':
        icon = '✗';
        color = chalk.red;
        break;
      case 'warn':
        icon = '⚠';
        color = chalk.yellow;
        break;
    }

    console.log(color(icon), chalk.bold(check.name), '-', check.message);
  }

  console.log(
    chalk.bold('\nSummary:'),
    chalk.green(`${report.summary.passed} passed`),
    '·',
    chalk.red(`${report.summary.failed} failed`),
    '·',
    chalk.yellow(`${report.summary.warnings} warnings`)
  );
}

function formatUptime(seconds: number): string {
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


