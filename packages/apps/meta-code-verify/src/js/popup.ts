/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  DOWNLOAD_JS_ENABLED,
  MESSAGE_TYPE,
  ORIGIN_TYPE,
  STATES,
  KNOWN_EXTENSION_HASHES_MAP,
} from './config.js';

const STATE_TO_POPUP_STATE = {
  [STATES.START]: 'loading',
  [STATES.PROCESSING]: 'loading',
  [STATES.IGNORE]: 'loading',
  [STATES.INVALID]: 'error',
  [STATES.RISK]: 'warning_risk',
  [STATES.VALID]: 'valid',
  [STATES.TIMEOUT]: 'warning_timeout',
};

const ORIGIN_TO_LEARN_MORE_PAGES = {
  [ORIGIN_TYPE.FACEBOOK]: {
    about: chrome.i18n.getMessage('about_code_verify_faq_url_fb'),
    failure: chrome.i18n.getMessage('validation_failure_faq_url_fb'),
    risk: chrome.i18n.getMessage('possible_risk_detected_faq_url_fb'),
    timeout: chrome.i18n.getMessage('network_timeout_faq_url_fb'),
  },
  [ORIGIN_TYPE.MESSENGER]: {
    about: chrome.i18n.getMessage('about_code_verify_faq_url_msgr'),
    failure: chrome.i18n.getMessage('validation_failure_faq_url_msgr'),
    risk: chrome.i18n.getMessage('possible_risk_detected_faq_url_msgr'),
    timeout: chrome.i18n.getMessage('network_timeout_faq_url_msgr'),
  },
  [ORIGIN_TYPE.WHATSAPP]: {
    about: chrome.i18n.getMessage('about_code_verify_faq_url_wa'),
    failure: chrome.i18n.getMessage('validation_failure_faq_url_wa'),
    risk: chrome.i18n.getMessage('possible_risk_detected_faq_url_wa'),
    timeout: chrome.i18n.getMessage('network_timeout_faq_url_wa'),
  },
  [ORIGIN_TYPE.KVSTORE]: {
    about: chrome.i18n.getMessage('about_code_verify_faq_url_wa'),
    failure: chrome.i18n.getMessage('validation_failure_faq_url_wa'),
    risk: chrome.i18n.getMessage('possible_risk_detected_faq_url_wa'),
    timeout: chrome.i18n.getMessage('network_timeout_faq_url_wa'),
  },
};

// doing this so we can add support for i18n using messages.json
function attachTextToHtml() {
  const i18nElements = document.querySelectorAll(`[id^="i18n"]`);
  Array.from(i18nElements).forEach(element => {
    element.innerHTML = chrome.i18n.getMessage(element.id);
  });
}
function shortenString(str, startLength, endLength) {
  return str.substr(0, startLength) + '...' + str.substr(-endLength);
}
async function handleBoth(what, key) {
  const { disallow } = await chrome.storage.local.get('disallow');
  const { allowlist } = await chrome.storage.local.get('allowlist');
  const disallowMap = new Map(Object.entries(disallow || {}));
  const allowMap = new Map(Object.entries(allowlist || {}));
  if (what === 'disallow') {
    allowMap.set(key, disallowMap.get(key));
    disallowMap.delete(key);
    await chrome.storage.local.set({
      disallow: Object.fromEntries(disallowMap),
    });
    await chrome.storage.local.set({
      allowlist: Object.fromEntries(allowMap),
    });
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const activeTab = tabs[0];
      chrome.tabs.reload(activeTab.id);
    });
  } else {
    console.log(disallowMap.entries());
    disallowMap.set(key, allowMap.get(key));
    allowMap.delete(key);
    await chrome.storage.local.set({
      disallow: Object.fromEntries(disallowMap),
    });
    await chrome.storage.local.set({
      allowlist: Object.fromEntries(allowMap),
    });
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const activeTab = tabs[0];
      chrome.tabs.reload(activeTab.id);
    });
  }

  await whatTable();
}
function getExtensionName(extensionId) {
  return new Promise((resolve, reject) => {
    chrome.management.get(extensionId, extensionInfo => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      } else {
        resolve(extensionInfo.name);
      }
    });
  });
}
async function attachTable(data, what) {
  // Create the table element
  const table = document.createElement('table');
  table.style.border = '1px solid black';
  table.style.borderCollapse = 'collapse';

  // Create the header row
  const headerRow = document.createElement('tr');

  const headers = ['link/hash', 'src', 'extension name', 'source code', what];
  headers.forEach(headerText => {
    const th = document.createElement('th');
    th.style.border = '1px solid black';
    th.style.padding = '5px';
    th.textContent = headerText;
    headerRow.appendChild(th);
  });

  table.appendChild(headerRow);

  // Create table rows
  for (const key in data) {
    const row = document.createElement('tr');
    const { type, src, rawjs } = data[key];

    // Key cell
    const keyCell = document.createElement('td');
    keyCell.style.border = '1px solid black';
    keyCell.style.padding = '5px';
    keyCell.textContent = shortenString(key, 3, 3);
    row.appendChild(keyCell);

    // Src cell
    const srcCell = document.createElement('td');
    srcCell.style.border = '1px solid black';
    srcCell.style.padding = '5px';
    const regex = /# sourceURL=(.*\.js)\b/;
    const result = rawjs ? rawjs.match(regex) : '';
    srcCell.textContent =
      type !== 'raw_js' && src ? src : result && result[1] ? result[1] : '';
    row.appendChild(srcCell);

    const extensionCell = document.createElement('td');
    extensionCell.style.border = '1px solid black';
    extensionCell.style.padding = '5px';
    const regex1 = /chrome-extension:\/\/([^/]+)\//;
    const result1 = result ? result[1].match(regex1) : '';
    extensionCell.textContent =
      result1.length > 1
        ? ((await getExtensionName(result1[1])) as string)
        : KNOWN_EXTENSION_HASHES_MAP.has(key)
        ? KNOWN_EXTENSION_HASHES_MAP.get(key)
        : '';
    row.appendChild(extensionCell);

    // Source code cell
    const sourceCodeCell = document.createElement('td');
    sourceCodeCell.style.border = '1px solid black';
    sourceCodeCell.style.padding = '5px';
    const aCell = document.createElement('a');
    const textBlob = new Blob([rawjs ? rawjs : ''], {
      type: 'text/plain',
    });
    const textUrl = URL.createObjectURL(textBlob);
    aCell.href = textUrl;
    aCell.textContent =
      type.toLowerCase() === 'raw_js' && rawjs ? 'source code' : '';
    aCell.target = '_blank';
    sourceCodeCell.appendChild(aCell);
    row.appendChild(sourceCodeCell);
    const allowDisallowCell = document.createElement('td');
    allowDisallowCell.style.border = '1px solid black';
    allowDisallowCell.style.padding = '5px';
    const allowACell = document.createElement('a');
    allowACell.href = '#';
    allowACell.textContent = what;
    allowACell.addEventListener('click', () =>
      handleBoth(what === 'allow' ? 'disallow' : 'allow', key)
    );
    allowDisallowCell.appendChild(allowACell);
    row.appendChild(allowDisallowCell);
    table.appendChild(row);
  }

  // Add table to the document
  const disallowDiv = document.getElementById(
    what === 'allow' ? 'disallow' : 'allow'
  );
  disallowDiv.innerHTML = '';
  disallowDiv.appendChild(table);
}
async function whatTable() {
  const { disallow } = await chrome.storage.local.get('disallow');
  const { allowlist } = await chrome.storage.local.get('allowlist');
  attachTable(disallow, 'allow');
  attachTable(allowlist, 'disallow');
}
function attachListeners(origin) {
  if (!(origin in ORIGIN_TO_LEARN_MORE_PAGES)) {
    throw new Error(
      `Learn more pages for origin type: ${origin} do not exist!`
    );
  }
  const learnMoreUrls = ORIGIN_TO_LEARN_MORE_PAGES[origin];

  const menuButtonList = document.getElementsByClassName('menu');
  Array.from(menuButtonList).forEach(menuButton => {
    menuButton.addEventListener('click', () => updateDisplay('menu'));
  });

  const closeMenuButton = document.getElementById('close_menu');
  closeMenuButton.addEventListener('click', () => window.close());

  const menuRowList = document.getElementsByClassName('menu_row');
  menuRowList[0].addEventListener('click', async _evt => {
    whatTable();
    updateDisplay('allowlist');
  });
  (menuRowList[0] as HTMLElement).style.cursor = 'pointer';
  menuRowList[1].addEventListener('click', _evt => {
    chrome.tabs.create({ url: learnMoreUrls.about });
  });
  (menuRowList[1] as HTMLElement).style.cursor = 'pointer';

  const downloadTextList = document.getElementsByClassName(
    'status_message_highlight'
  );
  const downloadSrcButton = document.getElementById('i18nDownloadSourceButton');

  if (DOWNLOAD_JS_ENABLED) {
    menuRowList[2].addEventListener('click', () => updateDisplay('download'));
    (menuRowList[2] as HTMLElement).style.cursor = 'pointer';

    downloadTextList[0].addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { greeting: 'downloadMove' },
          () => {}
        );
      });
    });
    (downloadTextList[0] as HTMLElement).style.cursor = 'pointer';

    downloadSrcButton.onclick = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { greeting: 'downloadSource' },
          () => {}
        );
      });
    };

    downloadSrcButton.style.cursor = 'pointer';

    downloadTextList[0].addEventListener('click', () =>
      updateDisplay('download')
    );
    (downloadTextList[0] as HTMLElement).style.cursor = 'pointer';
  } else {
    menuRowList[1].remove();
    downloadTextList[0].remove();
    const downloadMessagePartTwo = document.getElementById(
      'i18nValidationFailureStatusMessagePartTwo'
    );
    if (downloadMessagePartTwo != null) {
      downloadMessagePartTwo.remove();
    }
    downloadSrcButton.remove();
  }

  const learnMoreList = document.getElementsByClassName(
    'anomaly_learn_more_button'
  );
  learnMoreList[0].addEventListener('click', () => {
    chrome.tabs.create({ url: learnMoreUrls.failure });
  });
  (learnMoreList[0] as HTMLElement).style.cursor = 'pointer';

  const riskLearnMoreList = document.getElementsByClassName(
    'risk_learn_more_button'
  );
  riskLearnMoreList[0].addEventListener('click', () => {
    chrome.tabs.create({ url: learnMoreUrls.risk });
  });
  (riskLearnMoreList[0] as HTMLElement).style.cursor = 'pointer';

  const retryButtonList = document.getElementsByClassName('retry_button');
  Array.from(retryButtonList).forEach(retryButton => {
    retryButton.addEventListener('click', () => {
      chrome.tabs.reload();
    });
    (retryButton as HTMLElement).style.cursor = 'pointer';
  });

  const timeoutLearnMoreList = document.getElementsByClassName(
    'timeout_learn_more_button'
  );
  timeoutLearnMoreList[0].addEventListener('click', () => {
    chrome.tabs.create({ url: learnMoreUrls.timeout });
  });
  (timeoutLearnMoreList[0] as HTMLElement).style.cursor = 'pointer';
}

function updateDisplay(state) {
  const popupState = STATE_TO_POPUP_STATE[state] || state;
  Array.from(document.getElementsByClassName('state_boundary')).forEach(
    element => {
      if (element.id == popupState) {
        (element as HTMLElement).style.display = 'flex';
        document.body.className = popupState + '_body';
      } else {
        (element as HTMLElement).style.display = 'none';
      }
    }
  );
}

function setUpBackgroundMessageHandler(tabId) {
  if (tabId == null || tabId.trim() === '') {
    console.error('[Popup] No tab_id query param', document.location);
    return;
  }
  chrome.runtime.onMessage.addListener(message => {
    if (!('type' in message)) {
      return;
    }
    if (
      message.type === MESSAGE_TYPE.STATE_UPDATED &&
      message.tabId.toString() === tabId
    ) {
      updateDisplay(message.state);
    }
  });
}

function loadUp() {
  const params = new URL(document.location.href).searchParams;
  setUpBackgroundMessageHandler(params.get('tab_id'));
  updateDisplay(params.get('state'));
  attachTextToHtml();
  attachListeners(params.get('origin'));
}

loadUp();
