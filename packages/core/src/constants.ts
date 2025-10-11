import { homedir } from 'node:os';
import { join } from 'node:path';

export const CONFIG_DIR = join(homedir(), '.wildmask');
export const CONFIG_FILE = join(CONFIG_DIR, 'config.yaml');
export const LOGS_DIR = join(CONFIG_DIR, 'logs');
export const LOG_FILE = join(LOGS_DIR, 'wildmask.log');
export const DAEMON_PID_FILE = join(CONFIG_DIR, 'daemon.pid');
export const DAEMON_SOCKET = join(CONFIG_DIR, 'daemon.sock');

export const DEFAULT_DNS_PORT = 5353;
export const DEFAULT_UPSTREAM_DNS = ['8.8.8.8', '1.1.1.1'];
export const DEFAULT_TTL = 60;


