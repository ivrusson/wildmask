export interface DaemonStatus {
  running: boolean;
  pid?: number;
  uptime?: number;
  port?: number;
  queriesCount?: number;
  lastQuery?: Date;
}

export interface DaemonStats {
  queriesTotal: number;
  queriesMatched: number;
  queriesForwarded: number;
  cacheHits: number;
  cacheMisses: number;
  errors: number;
}

export interface DNSQuery {
  id: number;
  name: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | string;
  class: 'IN' | string;
}

export interface DNSAnswer {
  name: string;
  type: string;
  class: string;
  ttl: number;
  data: string;
}

export interface DNSResponse {
  id: number;
  type: 'response';
  flags: number;
  questions: DNSQuery[];
  answers: DNSAnswer[];
}

export interface CacheEntry {
  response: DNSResponse;
  timestamp: number;
  ttl: number;
}


