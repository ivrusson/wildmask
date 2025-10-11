export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface HealthCheckResult {
  status: HealthStatus;
  latency?: number;
  error?: string;
  timestamp: Date;
  message?: string;
}

export interface MappingHealth {
  mappingId: string;
  host: string;
  result: HealthCheckResult;
}

export interface DiagnosticCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  fixable?: boolean;
  fix?: () => Promise<void>;
}

export interface DiagnosticReport {
  timestamp: Date;
  checks: DiagnosticCheck[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
  };
}


