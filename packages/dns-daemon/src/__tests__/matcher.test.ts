import { describe, it, expect, beforeEach } from 'vitest';
import { DomainMatcher } from '../matcher';
import type { Mapping } from '@wildmask/types';

describe('DomainMatcher', () => {
  let matcher: DomainMatcher;
  const mappings: Mapping[] = [
    {
      id: '1',
      host: 'api',
      target: '127.0.0.1',
      port: 3000,
      protocol: 'http',
      enabled: true,
    },
    {
      id: '2',
      host: '*.cdn',
      target: '127.0.0.1',
      port: 8080,
      protocol: 'http',
      enabled: true,
    },
    {
      id: '3',
      host: 'disabled',
      target: '127.0.0.1',
      port: 9000,
      protocol: 'http',
      enabled: false,
    },
  ];

  beforeEach(() => {
    matcher = new DomainMatcher(mappings, 'test');
  });

  it('should match exact hostname', () => {
    const result = matcher.match('api.test');
    expect(result).toBeDefined();
    expect(result?.host).toBe('api');
  });

  it('should match wildcard hostname', () => {
    const result1 = matcher.match('img.cdn.test');
    expect(result1).toBeDefined();
    expect(result1?.host).toBe('*.cdn');

    const result2 = matcher.match('static.cdn.test');
    expect(result2).toBeDefined();
    expect(result2?.host).toBe('*.cdn');
  });

  it('should not match disabled mappings', () => {
    const result = matcher.match('disabled.test');
    expect(result).toBeNull();
  });

  it('should not match different domain', () => {
    const result = matcher.match('api.other');
    expect(result).toBeNull();
  });

  it('should handle trailing dot', () => {
    const result = matcher.match('api.test.');
    expect(result).toBeDefined();
    expect(result?.host).toBe('api');
  });

  it('should return null for non-matching hosts', () => {
    const result = matcher.match('unknown.test');
    expect(result).toBeNull();
  });
});


