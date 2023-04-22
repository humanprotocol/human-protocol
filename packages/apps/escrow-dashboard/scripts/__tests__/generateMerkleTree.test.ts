import { test, assert } from 'vitest';
import * as path from 'path';
import * as fs from 'node:fs';
import generateMerkleTree from '../generateMerkleTree';
import { NFTStorage } from 'nft.storage';
import sinon from 'sinon';
import tmp from 'tmp';
const mockToken = 'test-token';

test('generateMerkleTree should return a valid Merkle tree JSON', async () => {
  // Create a temporary directory for the dist/assets folder
  const tmpDir = tmp.dirSync();
  const tmpDistAssetsPath = path.join(tmpDir.name, 'dist/assets');
  fs.mkdirSync(tmpDistAssetsPath, { recursive: true });

  // Create some JS files in the temporary dist/assets folder
  fs.writeFileSync(path.join(tmpDistAssetsPath, 'test.js'), 'console.log("Hello, world!");');
  fs.writeFileSync(path.join(tmpDistAssetsPath, 'test2.js'), 'console.log("Another file!");');

  // Mock NFTStorage.storeBlob method
  const fakeCid = 'bafybeih42y6g7zkr76j6ax7z6wjc5d56xazsrtxzp6f7j6fsk67djnppmq';
  sinon.stub(NFTStorage.prototype, 'storeBlob').resolves(fakeCid);

  const origin = 'https://example.com';

  const merkleTreeJson = await generateMerkleTree(origin, mockToken, tmpDistAssetsPath);
  const merkleTreeData = JSON.parse(merkleTreeJson);

  // Cleanup and restore the actual file system and NFTStorage.storeBlob method
  fs.rmdirSync(tmpDir.name, { recursive: true });
  sinon.restore();

  // Assertions
  assert(merkleTreeData.hasOwnProperty('version'), 'Merkle tree JSON should have a "version" property');
  assert(merkleTreeData.version === fakeCid, 'Merkle tree JSON "version" should match the fake CID');
  assert(merkleTreeData.hasOwnProperty('root'), 'Merkle tree JSON should have a "root" property');
  assert(merkleTreeData.hasOwnProperty('leaves'), 'Merkle tree JSON should have a "leaves" property');
  assert(merkleTreeData.root.startsWith('0x'), 'Merkle tree root hash should start with "0x"');
  assert(merkleTreeData.leaves.length > 0, 'Merkle tree leaves should not be empty');
  assert(merkleTreeData.leaves.every(leaf => leaf.startsWith('0x')), 'Each Merkle tree leaf hash should start with "0x"');
});
