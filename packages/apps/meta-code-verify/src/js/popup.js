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
};

// doing this so we can add support for i18n using messages.json
function attachTextToHtml() {
  const i18nElements = document.querySelectorAll(`[id^="i18n"]`);
  Array.from(i18nElements).forEach(element => {
    element.innerHTML = chrome.i18n.getMessage(element.id);
  });
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

  menuRowList[0].addEventListener('click', _evt => {
    chrome.tabs.create({ url: learnMoreUrls.about });
  });
  menuRowList[0].style.cursor = 'pointer';

  const downloadTextList = document.getElementsByClassName(
    'status_message_highlight'
  );
  const downloadSrcButton = document.getElementById('i18nDownloadSourceButton');

  if (DOWNLOAD_JS_ENABLED) {
    menuRowList[1].addEventListener('click', () => updateDisplay('download'));
    menuRowList[1].style.cursor = 'pointer';

    downloadTextList[0].addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { greeting: 'downloadSource' },
          () => {}
        );
      });
    });
    downloadTextList[0].style.cursor = 'pointer';

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
    downloadTextList[0].style.cursor = 'pointer';
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
  learnMoreList[0].style.cursor = 'pointer';

  const riskLearnMoreList = document.getElementsByClassName(
    'risk_learn_more_button'
  );
  riskLearnMoreList[0].addEventListener('click', () => {
    chrome.tabs.create({ url: learnMoreUrls.risk });
  });
  riskLearnMoreList[0].style.cursor = 'pointer';

  const retryButtonList = document.getElementsByClassName('retry_button');
  Array.from(retryButtonList).forEach(retryButton => {
    retryButton.addEventListener('click', () => {
      chrome.tabs.reload();
    });
    retryButton.style.cursor = 'pointer';
  });

  const timeoutLearnMoreList = document.getElementsByClassName(
    'timeout_learn_more_button'
  );
  timeoutLearnMoreList[0].addEventListener('click', () => {
    chrome.tabs.create({ url: learnMoreUrls.timeout });
  });
  timeoutLearnMoreList[0].style.cursor = 'pointer';
}

function updateDisplay(state) {
  const popupState = STATE_TO_POPUP_STATE[state] || state;
  Array.from(document.getElementsByClassName('state_boundary')).forEach(
    element => {
      if (element.id == popupState) {
        element.style.display = 'flex';
        document.body.className = popupState + '_body';
      } else {
        element.style.display = 'none';
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
  const params = new URL(document.location).searchParams;
  setUpBackgroundMessageHandler(params.get('tab_id'));
  updateDisplay(params.get('state'));
  attachTextToHtml();
  attachListeners(params.get('origin'));
}

loadUp();
