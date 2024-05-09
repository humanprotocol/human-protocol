import * as path from 'path';
import { NFTStorage } from 'nft.storage';
import { stub, restore } from 'sinon';
import { test, assert, vi } from 'vitest';
import generateMerkleTree from '../generateMerkleTree';
const mockToken = 'test-token';

vi.mock('fs', () => ({
  readFileSync: vi.fn().mockReturnValue('test-file-content'),
}));

vi.mock('glob', () => ({
  sync: vi.fn().mockImplementation(() => ['test.js', 'test2.js']),
}));

test('generateMerkleTree should return a valid Merkle tree JSON', async () => {
  const tmpDistAssetsPath = path.join(__dirname, 'tmp-dist-assets');

  // Mock NFTStorage.storeBlob method
  const fakeCid = 'bafybeih42y6g7zkr76j6ax7z6wjc5d56xazsrtxzp6f7j6fsk67djnppmq';
  stub(NFTStorage.prototype, 'storeBlob').resolves(fakeCid);

  const origin = 'https://example.com';

  const merkleTreeJson = await generateMerkleTree(
    origin,
    mockToken,
    tmpDistAssetsPath
  );
  const merkleTreeData = JSON.parse(merkleTreeJson);

  // Cleanup and restore the actual file system and NFTStorage.storeBlob method
  restore();

  // Assertions
  assert(
    merkleTreeData.hasOwnProperty('version'),
    'Merkle tree JSON should have a "version" property'
  );
  assert(
    merkleTreeData.version === fakeCid,
    'Merkle tree JSON "version" should match the fake CID'
  );
  assert(
    merkleTreeData.hasOwnProperty('root'),
    'Merkle tree JSON should have a "root" property'
  );
  assert(
    merkleTreeData.hasOwnProperty('leaves'),
    'Merkle tree JSON should have a "leaves" property'
  );
  assert(
    merkleTreeData.root.startsWith('0x'),
    'Merkle tree root hash should start with "0x"'
  );
  assert(
    merkleTreeData.leaves.length > 0,
    'Merkle tree leaves should not be empty'
  );
  assert(
    merkleTreeData.leaves.every((leaf) => leaf.startsWith('0x')),
    'Each Merkle tree leaf hash should start with "0x"'
  );
});
