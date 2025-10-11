import { z } from 'zod';

// Health check schema
export const HealthCheckSchema = z.object({
  enabled: z.boolean().default(true),
  path: z.string().optional(),
  interval: z.number().min(5).max(3600).default(30),
  timeout: z.number().min(1).max(60).default(5),
});

export type HealthCheck = z.infer<typeof HealthCheckSchema>;

// Mapping schema
export const MappingSchema = z.object({
  id: z.string(),
  host: z.string().min(1).regex(/^[a-zA-Z0-9\-\*\.]+$/),
  domain: z.string().optional(), // Optional domain override (e.g., 'local', 'dev', 'myapp')
  target: z.string().ip().or(z.literal('localhost')),
  port: z.number().min(1).max(65535),
  protocol: z.enum(['http', 'https', 'tcp']).default('http'),
  health: HealthCheckSchema.optional(),
  enabled: z.boolean().default(true),
  description: z.string().optional(),
});

export type Mapping = z.infer<typeof MappingSchema>;

// Resolver schema
export const ResolverSchema = z.object({
  method: z.enum(['dns-daemon', 'hosts', 'auto']).default('dns-daemon'),
  port: z.number().min(1024).max(65535).default(5353),
  fallback: z.boolean().default(true),
  upstreamDNS: z.array(z.string().ip()).default(['8.8.8.8', '1.1.1.1']),
});

export type Resolver = z.infer<typeof ResolverSchema>;

// Options schema
export const OptionsSchema = z.object({
  ttl: z.number().min(1).max(86400).default(60),
  autoStart: z.boolean().default(false),
  checkUpdates: z.boolean().default(true),
  telemetry: z.boolean().default(false),
});

export type Options = z.infer<typeof OptionsSchema>;

// Logging schema
export const LoggingSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  file: z.string().optional(),
  maxSize: z.string().default('10mb'),
  maxFiles: z.number().min(1).max(100).default(5),
});

export type Logging = z.infer<typeof LoggingSchema>;

// Main config schema
export const ConfigSchema = z.object({
  version: z.string().default('1.0'),
  domain: z.string().min(1).regex(/^[a-zA-Z0-9\-]+$/), // Default domain
  domains: z.array(z.string().min(1).regex(/^[a-zA-Z0-9\-]+$/)).optional(), // Additional domains
  resolver: ResolverSchema,
  mappings: z.array(MappingSchema).default([]),
  options: OptionsSchema.default({}),
  logging: LoggingSchema.default({}),
});

export type Config = z.infer<typeof ConfigSchema>;

// Partial config for updates
export type PartialConfig = Partial<Config>;


