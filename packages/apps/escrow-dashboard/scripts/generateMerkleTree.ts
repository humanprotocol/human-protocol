import * as fs from 'fs';
import * as path from 'path';
import { SHA256 } from 'crypto-js';
import * as glob from 'glob';
import { MerkleTree } from 'merkletreejs';
import { NFTStorage } from 'nft.storage';

export default async function generateMerkleTree(
  origin: string,
  token: string
): Promise<string> {
  const buildPath = path.join(__dirname, '../dist/assets');
  const allFiles = glob.sync('**/*.js', { cwd: buildPath });
  const NFT_STORAGE_CLIENT = new NFTStorage({
    token,
  });
  const fileHashes = allFiles.map((file) => {
    const filePath = path.join(buildPath, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return SHA256(fileContent).toString();
  });

  const merkleTree = new MerkleTree(fileHashes, SHA256);
  const merkleRoot = '0x' + merkleTree.getRoot().toString('hex');

  // Add the '0x' prefix to each leaf
  const leaves = merkleTree
    .getLeaves()
    .map((leaf) => '0x' + leaf.toString('hex'));

  const someData = new Blob([
    JSON.stringify({
      origin,
      root_hash: merkleRoot,
      published_date: Date.now(),
    }) as string,
  ]);
  const cid = await NFT_STORAGE_CLIENT.storeBlob(someData);

  const merkleTreeJson = JSON.stringify({
    ipfs_cid: cid,
    root: merkleRoot,
    leaves: leaves,
  });

  return merkleTreeJson;
}
