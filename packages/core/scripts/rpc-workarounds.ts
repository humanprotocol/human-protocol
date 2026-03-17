import { ethers } from 'hardhat';

const PATCH_FLAG = Symbol.for('human-protocol.rpc-empty-address-normalized');

type JsonRpcSend = (method: string, params?: unknown[]) => Promise<unknown>;

function normalizeEmptyAddressFields<T>(payload: T): T {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const normalized = payload as Record<string, unknown>;

  if (normalized.to === '') {
    normalized.to = null;
  }

  if (normalized.contractAddress === '') {
    normalized.contractAddress = null;
  }

  return payload;
}

export function applyRpcAddressWorkaround(): void {
  const provider = ethers.provider as typeof ethers.provider & {
    _hardhatProvider?: { send?: JsonRpcSend; [PATCH_FLAG]?: boolean };
  };

  const hardhatProvider = provider._hardhatProvider;

  if (!hardhatProvider?.send || hardhatProvider[PATCH_FLAG]) {
    return;
  }

  const originalSend = hardhatProvider.send.bind(hardhatProvider);

  hardhatProvider.send = async (method: string, params?: unknown[]) => {
    const response = await originalSend(method, params);

    if (
      method === 'eth_getTransactionByHash' ||
      method === 'eth_getTransactionReceipt'
    ) {
      return normalizeEmptyAddressFields(response);
    }

    return response;
  };

  hardhatProvider[PATCH_FLAG] = true;
}
