import { web3BrowserAuthProvider } from '@/auth-web3/web3-browser-auth-provider';
import { browserAuthProvider } from '@/auth/browser-auth-provider';

export type AuthProviderType = 'web2' | 'web3';

export function getBrowserAuthProvider(type: AuthProviderType) {
  if (type === 'web2') {
    return browserAuthProvider;
  }
  return web3BrowserAuthProvider;
}
