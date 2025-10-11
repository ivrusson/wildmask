import { describe, it, expect } from 'vitest';
import {
  isValidPort,
  isValidHostname,
  isWildcard,
  wildcardToRegex,
  formatBytes,
  parseSize,
  formatUptime,
} from '../utils';

describe('utils', () => {
  describe('isValidPort', () => {
    it('should validate correct ports', () => {
      expect(isValidPort(80)).toBe(true);
      expect(isValidPort(3000)).toBe(true);
      expect(isValidPort(65535)).toBe(true);
    });

    it('should reject invalid ports', () => {
      expect(isValidPort(0)).toBe(false);
      expect(isValidPort(-1)).toBe(false);
      expect(isValidPort(65536)).toBe(false);
      expect(isValidPort(1.5)).toBe(false);
    });
  });

  describe('isValidHostname', () => {
    it('should validate correct hostnames', () => {
      expect(isValidHostname('api')).toBe(true);
      expect(isValidHostname('my-app')).toBe(true);
      expect(isValidHostname('*.assets')).toBe(true);
    });

    it('should reject invalid hostnames', () => {
      expect(isValidHostname('my_app')).toBe(false);
      expect(isValidHostname('app with spaces')).toBe(false);
    });
  });

  describe('isWildcard', () => {
    it('should detect wildcard patterns', () => {
      expect(isWildcard('*.assets')).toBe(true);
      expect(isWildcard('*.cdn')).toBe(true);
      expect(isWildcard('api')).toBe(false);
    });
  });

  describe('wildcardToRegex', () => {
    it('should convert wildcard to regex', () => {
      const regex = wildcardToRegex('*.assets');
      expect(regex.test('cdn.assets')).toBe(true);
      expect(regex.test('img.assets')).toBe(true);
      expect(regex.test('api')).toBe(false);
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
    });
  });

  describe('parseSize', () => {
    it('should parse size strings', () => {
      expect(parseSize('10mb')).toBe(10 * 1024 * 1024);
      expect(parseSize('1gb')).toBe(1024 * 1024 * 1024);
      expect(parseSize('500kb')).toBe(500 * 1024);
    });
  });

  describe('formatUptime', () => {
    it('should format uptime correctly', () => {
      expect(formatUptime(45)).toBe('45s');
      expect(formatUptime(90)).toBe('1m 30s');
      expect(formatUptime(3665)).toBe('1h 1m 5s');
    });
  });
});


