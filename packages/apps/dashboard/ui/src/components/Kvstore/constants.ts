import { NFTStorage } from 'nft.storage';

export const STEPS = ['Get Public Key', 'Add Public Key', 'Empower Human Scan'];

export const PUBKEY_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const NFT_STORAGE_CLIENT = new NFTStorage({
  token: import.meta.env.VITE_APP_NFT_STORAGE_API,
});
