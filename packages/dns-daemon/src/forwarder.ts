import { createSocket, Socket } from 'node:dgram';

export class DNSForwarder {
  private upstreamServers: string[];
  private timeout: number;

  constructor(upstreamServers: string[] = ['8.8.8.8', '1.1.1.1'], timeout: number = 5000) {
    this.upstreamServers = upstreamServers;
    this.timeout = timeout;
  }

  /**
   * Forwards a DNS query to upstream servers
   */
  async forward(query: Buffer): Promise<Buffer | null> {
    for (const server of this.upstreamServers) {
      try {
        const response = await this.forwardToServer(query, server);
        if (response) {
          return response;
        }
      } catch (error) {
        // Try next server
        continue;
      }
    }

    return null;
  }

  /**
   * Forwards query to a specific upstream server
   */
  private forwardToServer(query: Buffer, server: string): Promise<Buffer | null> {
    return new Promise((resolve, reject) => {
      const socket: Socket = createSocket('udp4');
      let timeoutId: NodeJS.Timeout;

      socket.on('message', (msg) => {
        clearTimeout(timeoutId);
        socket.close();
        resolve(msg);
      });

      socket.on('error', (error) => {
        clearTimeout(timeoutId);
        socket.close();
        reject(error);
      });

      timeoutId = setTimeout(() => {
        socket.close();
        resolve(null);
      }, this.timeout);

      socket.send(query, 53, server);
    });
  }

  /**
   * Updates upstream servers
   */
  setUpstreamServers(servers: string[]): void {
    this.upstreamServers = servers;
  }
}


