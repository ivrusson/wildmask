export type Platform = 'darwin' | 'linux' | 'win32';

export interface PlatformInfo {
  platform: Platform;
  arch: string;
  version: string;
  canElevate: boolean;
}

export interface ResolverConfig {
  platform: Platform;
  configPath: string;
  serviceName: string;
  serviceConfig: string;
}

export interface InstallResult {
  success: boolean;
  message: string;
  requiresElevation?: boolean;
  rollback?: () => Promise<void>;
}


