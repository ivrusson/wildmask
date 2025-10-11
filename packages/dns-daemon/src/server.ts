import { createSocket, Socket, RemoteInfo } from 'node:dgram';
import * as dnsPacket from 'dns-packet';
import type { Mapping, DaemonStats, Logger } from '@wildmask/types';
import { DomainMatcher } from './matcher.js';
import { DNSCache } from './cache.js';
import { DNSForwarder } from './forwarder.js';

export interface DNSServerOptions {
  port: number;
  domain: string;
  mappings: Mapping[];
  ttl: number;
  upstreamDNS: string[];
  logger?: Logger;
}

export class DNSServer {
  private socket: Socket | null = null;
  private port: number;
  private ttl: number;
  private matcher: DomainMatcher;
  private cache: DNSCache;
  private forwarder: DNSForwarder;
  private logger?: Logger;
  private stats: DaemonStats = {
    queriesTotal: 0,
    queriesMatched: 0,
    queriesForwarded: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
  };

  constructor(options: DNSServerOptions) {
    this.port = options.port;
    this.ttl = options.ttl;
    this.logger = options.logger;
    this.matcher = new DomainMatcher(options.mappings, options.domain);
    this.cache = new DNSCache();
    this.forwarder = new DNSForwarder(options.upstreamDNS);
  }

  /**
   * Starts the DNS server
   */
  async start(): Promise<void> {
    if (this.socket) {
      throw new Error('Server is already running');
    }

    return new Promise((resolve, reject) => {
      this.socket = createSocket('udp4');

      this.socket.on('message', (msg, rinfo) => {
        this.handleQuery(msg, rinfo).catch((error) => {
          this.logger?.error('Error handling query', { error: error.message });
          this.stats.errors++;
        });
      });

      this.socket.on('error', (error) => {
        this.logger?.error('Server error', { error: error.message });
        reject(error);
      });

      this.socket.on('listening', () => {
        const address = this.socket!.address();
        this.logger?.info(`DNS server listening on ${address.address}:${address.port}`);
        resolve();
      });

      this.socket.bind(this.port);
    });
  }

  /**
   * Stops the DNS server
   */
  async stop(): Promise<void> {
    if (!this.socket) {
      return;
    }

    return new Promise((resolve) => {
      this.socket!.close(() => {
        this.socket = null;
        this.logger?.info('DNS server stopped');
        resolve();
      });
    });
  }

  /**
   * Handles a DNS query
   */
  private async handleQuery(msg: Buffer, rinfo: RemoteInfo): Promise<void> {
    this.stats.queriesTotal++;

    try {
      const query = dnsPacket.decode(msg);
      
      if (!query.questions || query.questions.length === 0) {
        return;
      }

      const question = query.questions[0];
      const hostname = question.name;
      const type = question.type;

      this.logger?.debug(`Query: ${hostname} (${type})`, { from: rinfo.address });

      // Only handle A records for now
      if (type !== 'A') {
        await this.forwardQuery(msg, rinfo);
        return;
      }

      // Check cache first
      const cached = this.cache.get(hostname, type);
      if (cached) {
        this.logger?.debug(`Cache hit: ${hostname}`);
        const response = dnsPacket.encode(cached);
        this.socket?.send(response, rinfo.port, rinfo.address);
        const cacheStats = this.cache.getStats();
        this.stats.cacheHits = cacheStats.hits;
        this.stats.cacheMisses = cacheStats.misses;
        return;
      }

      // Try to match against configured mappings
      const mapping = this.matcher.match(hostname);

      if (mapping) {
        this.logger?.debug(`Matched: ${hostname} → ${mapping.target}:${mapping.port}`);
        this.stats.queriesMatched++;

        const response: dnsPacket.Packet = {
          type: 'response',
          id: query.id,
          flags: dnsPacket.AUTHORITATIVE_ANSWER,
          questions: query.questions,
          answers: [
            {
              type: 'A',
              class: 'IN',
              name: hostname,
              ttl: this.ttl,
              data: mapping.target === 'localhost' ? '127.0.0.1' : mapping.target,
            },
          ],
        };

        const encoded = dnsPacket.encode(response);
        this.socket?.send(encoded, rinfo.port, rinfo.address);

        // Cache the response
        this.cache.set(hostname, type, response as any, this.ttl);
      } else {
        // Forward to upstream DNS
        await this.forwardQuery(msg, rinfo);
      }
    } catch (error) {
      this.logger?.error('Error processing query', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      this.stats.errors++;
    }
  }

  /**
   * Forwards a query to upstream DNS servers
   */
  private async forwardQuery(query: Buffer, rinfo: RemoteInfo): Promise<void> {
    this.stats.queriesForwarded++;

    try {
      const response = await this.forwarder.forward(query);

      if (response) {
        this.socket?.send(response, rinfo.port, rinfo.address);

        // Try to cache the response
        try {
          const decoded = dnsPacket.decode(response);
          if (decoded.questions && decoded.questions.length > 0) {
            const question = decoded.questions[0];
            // Use minimum TTL from answers
            const ttl = decoded.answers && decoded.answers.length > 0
              ? Math.min(...decoded.answers.map((a: any) => a.ttl || this.ttl))
              : this.ttl;
            this.cache.set(question.name, question.type, decoded as any, ttl);
          }
        } catch {
          // Ignore cache errors
        }
      }
    } catch (error) {
      this.logger?.error('Error forwarding query', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  /**
   * Updates the mappings
   */
  updateMappings(mappings: Mapping[]): void {
    this.matcher.updateMappings(mappings);
    this.logger?.info('Mappings updated', { count: mappings.length });
  }

  /**
   * Gets server statistics
   */
  getStats(): DaemonStats {
    const cacheStats = this.cache.getStats();
    return {
      ...this.stats,
      cacheHits: cacheStats.hits,
      cacheMisses: cacheStats.misses,
    };
  }

  /**
   * Clears the cache
   */
  clearCache(): void {
    this.cache.clear();
    this.logger?.info('Cache cleared');
  }

  /**
   * Checks if server is running
   */
  isRunning(): boolean {
    return this.socket !== null;
  }
}


