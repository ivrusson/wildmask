declare module 'dns-packet' {
  export interface Question {
    type: string;
    name: string;
    class?: string;
  }

  export interface Answer {
    type: string;
    name: string;
    class?: string;
    ttl: number;
    data: string;
  }

  export interface Packet {
    type?: 'query' | 'response';
    id: number;
    flags?: number;
    questions?: Question[];
    answers?: Answer[];
  }

  export const AUTHORITATIVE_ANSWER: number;

  export function encode(packet: Packet): Buffer;
  export function decode(buffer: Buffer): Packet;
}

