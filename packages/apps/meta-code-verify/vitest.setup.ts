// vitest.setup.ts

import { vi } from 'vitest';

declare global {
  interface Window {
    crypto: {
      subtle: SubtleCrypto & {
        digest: (algorithm: AlgorithmIdentifier, data: BufferSource) => Promise<ArrayBuffer>;
      };
      getRandomValues: Crypto['getRandomValues'];
      randomUUID: Crypto['randomUUID'];
    };
  }

  // ... (the rest of the global declarations)
}

window.chrome = {
  browserAction: {
    setIcon: vi.fn<any[]>(),
    setPopup: vi.fn<any[]>(),
  } as any,
  storage: {
    local: {
      get: vi.fn<any[]>(),
      set: vi.fn<any[]>(),
    } as any,
  } as any,
  tabs: {
    onRemoved: {
      addListener: vi.fn<any[]>(),
      hasListener: vi.fn<any[]>(),
      removeListener: vi.fn<any[]>(),
      addRules: vi.fn<any[]>(),
      getRules: vi.fn<any[]>(),
      removeRules: vi.fn<any[]>(),
    } as any,
    onReplaced: {
      addListener: vi.fn<any[]>(),
      hasListener: vi.fn<any[]>(),
      removeListener: vi.fn<any[]>(),
      addRules: vi.fn<any[]>(),
      getRules: vi.fn<any[]>(),
      removeRules: vi.fn<any[]>(),
    } as any,
  } as any,
  webRequest: {
    onResponseStarted: {
      addListener: vi.fn<any[]>(),
      hasListener: vi.fn<any[]>(),
      removeListener: vi.fn<any[]>(),
      addRules: vi.fn<any[]>(),
      getRules: vi.fn<any[]>(),
      removeRules: vi.fn<any[]>(),
    } as any,
    onHeadersReceived: {
      addListener: vi.fn<any[]>(),
      hasListener: vi.fn<any[]>(),
      removeListener: vi.fn<any[]>(),
      addRules: vi.fn<any[]>(),
      getRules: vi.fn<any[]>(),
      removeRules: vi.fn<any[]>(),
    } as any,
  } as any,
  runtime: {
    onMessage: {
      addListener: vi.fn<any[]>(),
      hasListener: vi.fn<any[]>(),
      removeListener: vi.fn<any[]>(),
      addRules: vi.fn<any[]>(),
      getRules: vi.fn<any[]>(),
      removeRules: vi.fn<any[]>(),
    } as any,
    onInstalled: {
      addListener: vi.fn<any[]>(),
      hasListener: vi.fn<any[]>(),
      removeListener: vi.fn<any[]>(),
      addRules: vi.fn<any[]>(),
      getRules: vi.fn<any[]>(),
      removeRules: vi.fn<any[]>(),
    } as any,
    sendMessage: vi.fn<any[]>(),
  } as any,
} as any;

globalThis.crypto = {
  subtle: {
    digest: (algorithm: AlgorithmIdentifier, data: BufferSource) => Promise<ArrayBuffer>,
  },
  getRandomValues: <T extends ArrayBufferView>(array: T): T => {
    // Provide an implementation for getRandomValues
    return array; // For now, return the input array (you should replace it with the actual implementation)
  },
  randomUUID: (): string => {
    // Provide an implementation for randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0,
      v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    },
} as unknown as Window['crypto'];
