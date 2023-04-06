/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MESSAGE_TYPE, ORIGIN_TIMEOUT } from './config';

import {
  recordContentScriptStart,
  updateContentScriptState,
} from './tab_state_tracker/tabStateTracker';

const manifestCache = new Map();
const debugCache = new Map();

// Emulate PageActions
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.runtime.getManifest().manifest_version >= 3) {
    chrome.action.disable();
  }
});

function addDebugLog(tabId, debugMessage) {
  let tabDebugList = debugCache.get(tabId);
  if (tabDebugList == null) {
    tabDebugList = [];
    debugCache.set(tabId, tabDebugList);
  }

  tabDebugList.push(debugMessage);
}

const fromHexString = hexString =>
  new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
const toHexString = bytes =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

function getCFHashWorkaroundFunction(ipfs_cid) {
  return new Promise((resolve, reject) => {
    fetch('https://nftstorage.link/ipfs/' + encodeURIComponent(ipfs_cid), {
      method: 'GET',
    })
      .then(response => {
        resolve(response);
      })
      .catch(response => {
        reject(response);
      });
  });
}

async function validateManifest(
  rootHash,
  leaves,
  ipfs_cid,
  workaround,
  origin
) {
  // does rootHash match what was published?
  const cfResponse = await getCFHashWorkaroundFunction(ipfs_cid).catch(
    cfError => {
      console.log('error fetching hash from CF', cfError);
      return {
        valid: false,
        reason: 'ENDPOINT_FAILURE',
        error: cfError,
      };
    }
  );
  if (cfResponse == null || cfResponse.json == null) {
    return {
      valid: false,
      reason: 'UNKNOWN_ENDPOINT_ISSUE',
    };
  }
  const cfPayload = await cfResponse.json();
  let cfRootHash = cfPayload.root_hash;
  let cfOrigin = cfPayload.origin;
  if (cfPayload.root_hash.startsWith('0x')) {
    cfRootHash = cfPayload.root_hash.slice(2);
  }

  if (cfOrigin !== origin) {
    return {
      valid: false,
      reason: 'ROOT_HASH_VERIFY_FAIL_3RD_PARTY',
    };
  }
  // validate
  if (rootHash !== cfRootHash) {
    console.log('hash mismatch with CF ', rootHash, cfRootHash);

    // secondary hash to mitigate accidental build issue.
    const encoder = new TextEncoder();
    const backupHashEncoded = encoder.encode(workaround);
    const backupHashArray = Array.from(
      new Uint8Array(await crypto.subtle.digest('SHA-256', backupHashEncoded))
    );
    const backupHash = backupHashArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    console.log(
      'secondary hashing of CF value fails too ',
      rootHash,
      backupHash
    );
    if (backupHash !== cfRootHash) {
      return {
        valid: false,
        reason: 'ROOT_HASH_VERIFY_FAIL_3RD_PARTY',
      };
    }
  }

  let oldhashes = leaves.map(
    leaf => fromHexString(leaf.replace('0x', '')).buffer
  );
  let newhashes = [];
  let bonus = '';

  while (oldhashes.length > 1) {
    for (let index = 0; index < oldhashes.length; index += 2) {
      const validSecondValue = index + 1 < oldhashes.length;
      if (validSecondValue) {
        const hashValue = new Uint8Array(
          oldhashes[index].byteLength + oldhashes[index + 1].byteLength
        );
        hashValue.set(new Uint8Array(oldhashes[index]), 0);
        hashValue.set(
          new Uint8Array(oldhashes[index + 1]),
          oldhashes[index].byteLength
        );
        newhashes.push(await crypto.subtle.digest('SHA-256', hashValue.buffer));
      } else {
        bonus = oldhashes[index];
      }
    }
    oldhashes = newhashes;
    if (bonus !== '') {
      oldhashes.push(bonus);
    }
    console.log(
      'layer hex is ',
      oldhashes.map(hash => {
        return Array.from(new Uint8Array(hash))
          .map(b => b.toString(16).padStart(2, ''))
          .join('');
      })
    );
    newhashes = [];
    bonus = '';
    console.log(
      'in loop hashes.length is',
      oldhashes.length,
      rootHash,
      oldhashes
    );
  }
  const lastHash = toHexString(new Uint8Array(oldhashes[0]));
  console.log('before return comparison', rootHash, lastHash);
  if (lastHash === rootHash) {
    return {
      valid: true,
    };
  }
  return {
    valid: false,
    reason: 'ROOT_HASH_VERFIY_FAIL_IN_PAGE',
  };
}

function getDebugLog(tabId) {
  let tabDebugList = debugCache.get(tabId);
  return tabDebugList == null ? [] : tabDebugList;
}

export function handleMessages(message, sender, sendResponse) {
  console.log('in handle messages ', message);

  if (message.type == MESSAGE_TYPE.LOAD_MANIFEST) {
    // validate manifest

    const slicedHash = message.rootHash.slice(2);
    const slicedLeaves = message.leaves.map(leaf => {
      return leaf.slice(2);
    });
    validateManifest(
      slicedHash,
      slicedLeaves,
      message.ipfs_cid,
      message.workaround,
      message.origin
    ).then(validationResult => {
      if (validationResult.valid) {
        // store manifest to subsequently validate JS
        let origin = manifestCache.get(message.origin);
        if (origin == null) {
          origin = new Map();
          manifestCache.set(message.origin, origin);
        }
        // roll through the existing manifests and remove expired ones
        if (ORIGIN_TIMEOUT[message.origin] > 0) {
          for (let [key, manif] of origin.entries()) {
            if (manif.start + ORIGIN_TIMEOUT[message.origin] < Date.now()) {
              origin.delete(key);
            }
          }
        }
        console.log('result is ', validationResult.valid);
        origin.set(message.version, {
          leaves: slicedLeaves,
          root: slicedHash,
          start: Date.now(),
        });
        sendResponse({ valid: true });
      } else {
        sendResponse(validationResult);
      }
    });

    return true;
  }

  if (message.type == MESSAGE_TYPE.RAW_JS) {
    const origin = manifestCache.get(message.origin);
    if (!origin) {
      addDebugLog(
        sender.tab.id,
        'Error: RAW_JS had no matching origin ' + message.origin
      );
      sendResponse({ valid: false, reason: 'no matching origin' });
      return;
    }
    const manifestObj = origin.get(message.version);
    const manifest = manifestObj && manifestObj.leaves;
    if (!manifest) {
      addDebugLog(
        sender.tab.id,
        'Error: JS with SRC had no matching manifest. origin: ' +
          message.origin +
          ' version: ' +
          message.version
      );
      sendResponse({ valid: false, reason: 'no matching manifest' });
      return;
    }

    // fetch the src
    const encoder = new TextEncoder();
    const encodedJS = encoder.encode(message.rawjs);
    // hash the src
    crypto.subtle.digest('SHA-256', encodedJS).then(jsHashBuffer => {
      const jsHashArray = Array.from(new Uint8Array(jsHashBuffer));
      const jsHash = jsHashArray
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (manifestObj.leaves.includes(jsHash)) {
        sendResponse({ valid: true });
      } else {
        console.log('generate hash is ', jsHash);
        addDebugLog(
          sender.tab.id,
          'Error: hash does not match ' +
            message.origin +
            ', ' +
            message.version +
            ', unmatched JS is ' +
            message.rawjs.substring(0, 500)
        );
        sendResponse({
          valid: false,
          hash: jsHash,
          reason:
            'Error: hash does not match ' +
            message.origin +
            ', ' +
            message.version +
            ', unmatched JS is ' +
            message.rawjs,
        });
      }
    });
    return true;
  }

  if (message.type == MESSAGE_TYPE.DEBUG) {
    addDebugLog(sender.tab.id, message.log);
    return;
  }

  if (message.type == MESSAGE_TYPE.GET_DEBUG) {
    const debuglist = getDebugLog(message.tabId);
    console.log('debug list is ', message.tabId, debuglist);
    sendResponse({ valid: true, debugList: debuglist });
    return;
  }

  if (message.type === MESSAGE_TYPE.UPDATE_STATE) {
    updateContentScriptState(sender, message.state, message.origin);
    sendResponse({ success: true });
    return;
  }

  if (message.type === MESSAGE_TYPE.CONTENT_SCRIPT_START) {
    recordContentScriptStart(sender, message.origin);
    sendResponse({ success: true });
    return;
  }
}

chrome.runtime.onMessage.addListener(handleMessages);
const srcFilters = { urls: ['<all_urls>'] };
chrome.webRequest.onResponseStarted.addListener(
  src => {
    if (
      src.type === 'script' &&
      !src.fromCache &&
      src.url.indexOf('chrome-extension://') === 0 &&
      src.url.indexOf('moz-extension://') === 0
    ) {
      chrome.tabs.query(
        { active: true, currentWindow: true },
        async function (tabs) {
          try {
            await chrome.tabs.sendMessage(tabs[0].id, {
              greeting: 'nocacheHeaderFound',
            });
          } catch {
            console.log('webRequest error');
          }
        }
      );
    }
  },
  srcFilters,
  []
);
chrome.tabs.onRemoved.addListener(tabId => {
  if (debugCache.has(tabId)) {
    debugCache.delete(tabId);
  }
});
