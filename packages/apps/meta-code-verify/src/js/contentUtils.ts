/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  KNOWN_EXTENSION_HASHES,
  MESSAGE_TYPE,
  ORIGIN_TYPE,
  DOWNLOAD_JS_ENABLED,
  STATES,
} from './config';

const DOM_EVENTS = [
  'onabort',
  'onactivate',
  'onattribute',
  'onafterprint',
  'onafterscriptexecute',
  'onafterupdate',
  'onanimationcancel',
  'onanimationend',
  'onanimationiteration',
  'onanimationstart',
  'onappinstalled',
  'onariarequest',
  'onautocomplete',
  'onautocompleteerror',
  'onauxclick',
  'onbeforeactivate',
  'onbeforecopy',
  'onbeforecut',
  'onbeforedeactivate',
  'onbeforeeditfocus',
  'onbeforeinstallprompt',
  'onbeforepaste',
  'onbeforeprint',
  'onbeforescriptexecute',
  'onbeforeunload',
  'onbeforeupdate',
  'onbeforexrselect',
  'onbegin',
  'onblur',
  'onbounce',
  'oncancel',
  'oncanplay',
  'oncanplaythrough',
  'oncellchange',
  'onchange',
  'onclick',
  'onclose',
  'oncommand',
  'oncompassneedscalibration',
  'oncontextmenu',
  'oncontrolselect',
  'oncopy',
  'oncuechange',
  'oncut',
  'ondataavailable',
  'ondatasetchanged',
  'ondatasetcomplete',
  'ondblclick',
  'ondeactivate',
  'ondevicelight',
  'ondevicemotion',
  'ondeviceorientation',
  'ondeviceorientationabsolute',
  'ondeviceproximity',
  'ondrag',
  'ondragdrop',
  'ondragend',
  'ondragenter',
  'ondragleave',
  'ondragover',
  'ondragstart',
  'ondrop',
  'ondurationchange',
  'onemptied',
  'onend',
  'onended',
  'onerror',
  'onerrorupdate',
  'onexit',
  'onfilterchange',
  'onfinish',
  'onfocus',
  'onfocusin',
  'onfocusout',
  'onformchange',
  'onformdata',
  'onforminput',
  'onfullscreenchange',
  'onfullscreenerror',
  'ongotpointercapture',
  'onhashchange',
  'onhelp',
  'oninput',
  'oninvalid',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onlanguagechange',
  'onlayoutcomplete',
  'onload',
  'onloadeddata',
  'onloadedmetadata',
  'onloadend',
  'onloadstart',
  'onlosecapture',
  'onlostpointercapture',
  'onmediacomplete',
  'onmediaerror',
  'onmessage',
  'onmessageerror',
  'onmousedown',
  'onmouseenter',
  'onmouseleave',
  'onmousemove',
  'onmouseout',
  'onmouseover',
  'onmouseup',
  'onmousewheel',
  'onmove',
  'onmoveend',
  'onmovestart',
  'onmozfullscreenchange',
  'onmozfullscreenerror',
  'onmozpointerlockchange',
  'onmozpointerlockerror',
  'onmscontentzoom',
  'onmsfullscreenchange',
  'onmsfullscreenerror',
  'onmsgesturechange',
  'onmsgesturedoubletap',
  'onmsgestureend',
  'onmsgesturehold',
  'onmsgesturestart',
  'onmsgesturetap',
  'onmsgotpointercapture',
  'onmsinertiastart',
  'onmslostpointercapture',
  'onmsmanipulationstatechanged',
  'onmspointercancel',
  'onmspointerdown',
  'onmspointerenter',
  'onmspointerleave',
  'onmspointermove',
  'onmspointerout',
  'onmspointerover',
  'onmspointerup',
  'onmssitemodejumplistitemremoved',
  'onmsthumbnailclick',
  'onoffline',
  'ononline',
  'onoutofsync',
  'onpage',
  'onpagehide',
  'onpageshow',
  'onpaste',
  'onpause',
  'onplay',
  'onplaying',
  'onpointercancel',
  'onpointerdown',
  'onpointerenter',
  'onpointerleave',
  'onpointerlockchange',
  'onpointerlockerror',
  'onpointermove',
  'onpointerout',
  'onpointerover',
  'onpointerrawupdate',
  'onpointerup',
  'onpopstate',
  'onprogress',
  'onpropertychange',
  'onratechange',
  'onreadystatechange',
  'onreceived',
  'onrejectionhandled',
  'onrepeat',
  'onreset',
  'onresize',
  'onresizeend',
  'onresizestart',
  'onresume',
  'onreverse',
  'onrowdelete',
  'onrowenter',
  'onrowexit',
  'onrowinserted',
  'onrowsdelete',
  'onrowsenter',
  'onrowsexit',
  'onrowsinserted',
  'onscroll',
  'onsearch',
  'onsecuritypolicyviolation',
  'onseek',
  'onseeked',
  'onseeking',
  'onselect',
  'onselectionchange',
  'onselectstart',
  'onslotchange',
  'onstalled',
  'onstorage',
  'onstoragecommit',
  'onstart',
  'onstop',
  'onshow',
  'onsyncrestored',
  'onsubmit',
  'onsuspend',
  'onsynchrestored',
  'ontimeerror',
  'ontimeupdate',
  'ontoggle',
  'ontouchend',
  'ontouchmove',
  'ontouchstart',
  'ontrackchange',
  'ontransitioncancel',
  'ontransitionend',
  'ontransitionrun',
  'ontransitionstart',
  'onunhandledrejection',
  'onunload',
  'onurlflip',
  'onuserproximity',
  'onvolumechange',
  'onwaiting',
  'onwebkitanimationend',
  'onwebkitanimationiteration',
  'onwebkitanimationstart',
  'onwebkitfullscreenchange',
  'onwebkitfullscreenerror',
  'onwebkittransitionend',
  'onwheel',
];

const sourceScripts = new Map();
const inlineScripts = [];
const foundScripts = new Map();
foundScripts.set('', []);
let currentOrigin = '';
let currentFilterType = '';
let manifestTimeoutID = '';

function updateCurrentState(state) {
  chrome.runtime.sendMessage({
    type: MESSAGE_TYPE.UPDATE_STATE,
    state,
    origin: currentOrigin,
  });
}

export function storeFoundJS(scriptNodeMaybe, scriptList) {
  if (window != window.top) {
    // this means that content utils is running in an iframe - disable timer and call processFoundJS on manifest processed in top level frame
    clearTimeout(manifestTimeoutID);
    manifestTimeoutID = '';
    window.setTimeout(
      () => processFoundJS(currentOrigin, foundScripts.keys().next().value),
      0
    );
  }
  // check if it's the manifest node
  if (
    window == window.top &&
    (scriptNodeMaybe.id === 'binary-transparency-manifest' ||
      scriptNodeMaybe.getAttribute('name') === 'binary-transparency-manifest')
  ) {
    let rawManifest: {
      leaves?: Array<string>;
      root?: string;
      version?: string;
      manifest?: Array<string>;
      manifest_hashes?: string & { combined_hash?: string };
    } = {};
    try {
      rawManifest = JSON.parse(scriptNodeMaybe.textContent);
    } catch (manifestParseError) {
      setTimeout(
        () => parseFailedJson({ node: scriptNodeMaybe, retry: 5000 }),
        20
      );
      return;
    }

    let leaves = rawManifest.leaves;
    let otherHashes = '';
    let otherType = '';
    let roothash = rawManifest.root;
    let version = rawManifest.version;

    if (
      [ORIGIN_TYPE.FACEBOOK, ORIGIN_TYPE.MESSENGER].includes(
        currentOrigin as 'FACEBOOK' | 'MESSENGER'
      )
    ) {
      leaves = rawManifest.manifest;
      otherHashes = rawManifest.manifest_hashes;
      otherType = scriptNodeMaybe.getAttribute('data-manifest-type');
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      roothash = otherHashes.combined_hash;
      version = scriptNodeMaybe.getAttribute('data-manifest-rev');

      if (currentFilterType != '') {
        currentFilterType = 'BOTH';
      }
      if (currentFilterType === '') {
        currentFilterType = otherType;
      }
    }
    // for whatsapp
    else {
      currentFilterType = 'BOTH';
    }
    // now that we know the actual version of the scripts, transfer the ones we know about.
    if (foundScripts.has('')) {
      foundScripts.set(version, foundScripts.get(''));
      foundScripts.delete('');
    }

    chrome.runtime.sendMessage(
      {
        type: MESSAGE_TYPE.LOAD_MANIFEST,
        leaves: leaves,
        origin: currentOrigin,
        otherHashes: otherHashes,
        otherType: otherType,
        rootHash: roothash,
        workaround: scriptNodeMaybe.innerHTML,
        version: version,
      },
      response => {
        chrome.runtime.sendMessage({
          type: MESSAGE_TYPE.DEBUG,
          log:
            'manifest load response is ' + response
              ? JSON.stringify(response).substring(0, 500)
              : '',
        });
        // then start processing of it's JS
        if (response.valid) {
          if (manifestTimeoutID !== '') {
            clearTimeout(manifestTimeoutID);
            manifestTimeoutID = '';
          }
          window.setTimeout(() => processFoundJS(currentOrigin, version), 0);
        } else {
          if (
            ['ENDPOINT_FAILURE', 'UNKNOWN_ENDPOINT_ISSUE'].includes(
              response.reason
            )
          ) {
            updateCurrentState(STATES.TIMEOUT);
            return;
          }
          updateCurrentState(STATES.INVALID);
        }
      }
    );
  }

  if (scriptNodeMaybe.getAttribute('type') === 'application/json') {
    try {
      JSON.parse(scriptNodeMaybe.textContent);
    } catch (parseError) {
      setTimeout(
        () => parseFailedJson({ node: scriptNodeMaybe, retry: 1500 }),
        20
      );
    }
    return;
  }
  if (
    scriptNodeMaybe.src != null &&
    scriptNodeMaybe.src !== '' &&
    scriptNodeMaybe.src.indexOf('blob:') === 0
  ) {
    // TODO: try to process the blob. For now, flag as warning.
    updateCurrentState(STATES.INVALID);
    return;
  }

  const dataBtManifest = scriptNodeMaybe.getAttribute('data-btmanifest');
  const otherType = dataBtManifest == null ? '' : dataBtManifest.split('_')[1];
  // need to get the src of the JS
  if (scriptNodeMaybe.src != null && scriptNodeMaybe.src !== '') {
    if (scriptList.size === 1) {
      scriptList.get(scriptList.keys().next().value).push({
        src: scriptNodeMaybe.src,
        otherType: otherType, // TODO: read from DOM when available
      });
    }
  } else {
    // no src, access innerHTML for the code
    const hashLookupAttribute =
      scriptNodeMaybe.attributes['data-binary-transparency-hash-key'];
    const hashLookupKey = hashLookupAttribute && hashLookupAttribute.value;
    if (scriptList.size === 1) {
      scriptList.get(scriptList.keys().next().value).push({
        type: MESSAGE_TYPE.RAW_JS,
        rawjs: scriptNodeMaybe.innerHTML,
        lookupKey: hashLookupKey,
        otherType: otherType, // TODO: read from DOM when available
      });
    }
  }
  updateCurrentState(STATES.PROCESSING);
}

function getAttributeValue(
  nodeName,
  checkNode,
  htmlElement,
  attributeName,
  currentAttributeValue
) {
  if (
    nodeName.toLowerCase() === checkNode &&
    htmlElement.hasAttribute(attributeName)
  ) {
    return htmlElement.getAttribute(attributeName).toLowerCase();
  }
  return currentAttributeValue;
}

const AttributeCheckPairs = [
  { nodeName: 'a', attributeName: 'href' },
  { nodeName: 'iframe', attributeName: 'src' },
  { nodeName: 'iframe', attributeName: 'srcdoc' },
  { nodeName: 'form', attributeName: 'action' },
  { nodeName: 'input', attributeName: 'formaction' },
  { nodeName: 'button', attributeName: 'formaction' },
  { nodeName: 'a', attributeName: 'xlink:href' },
  { nodeName: 'ncc', attributeName: 'href' },
  { nodeName: 'embed', attributeName: 'src' },
  { nodeName: 'object', attributeName: 'data' },
  { nodeName: 'animate', attributeName: 'xlink:href' },
  { nodeName: 'script', attributeName: 'xlink:href' },
  { nodeName: 'use', attributeName: 'href' },
  { nodeName: 'use', attributeName: 'xlink:href' },
  { nodeName: 'x', attributeName: 'href' },
  { nodeName: 'x', attributeName: 'xlink:href' },
];

export function hasViolatingJavaScriptURI(htmlElement) {
  let checkURL = '';
  const lowerCaseNodeName = htmlElement.nodeName.toLowerCase();
  AttributeCheckPairs.forEach(checkPair => {
    checkURL = getAttributeValue(
      lowerCaseNodeName,
      checkPair.nodeName,
      htmlElement,
      checkPair.attributeName,
      checkURL
    );
  });
  if (checkURL !== '') {
    // make sure anchor tags and object tags don't have javascript urls
    if (checkURL.indexOf('javascript') >= 0) {
      chrome.runtime.sendMessage({
        type: MESSAGE_TYPE.DEBUG,
        log: 'violating attribute: javascript url',
      });
      updateCurrentState(STATES.INVALID);
    }
  }

  if (typeof htmlElement.childNodes !== 'undefined') {
    htmlElement.childNodes.forEach(element => {
      hasViolatingJavaScriptURI(element);
    });
  }
}

export function hasInvalidAttributes(htmlElement) {
  if (
    typeof htmlElement.attributes === 'object' &&
    Object.keys(htmlElement.attributes).length >= 1
  ) {
    Array.from(htmlElement.attributes).forEach(elementAttribute => {
      // check first for violating attributes
      if (DOM_EVENTS.indexOf((elementAttribute as Attr).localName) >= 0) {
        chrome.runtime.sendMessage({
          type: MESSAGE_TYPE.DEBUG,
          log:
            'violating attribute ' +
            (elementAttribute as Attr).localName +
            ' from element ' +
            htmlElement.outerHTML,
        });
        updateCurrentState(STATES.INVALID);
      }
    });
  }
  // check child nodes as well, since a malicious attacker could try to inject an invalid attribute via an image node in a svg tag using a use element
  if (htmlElement.childNodes.length > 0) {
    htmlElement.childNodes.forEach(childNode => {
      if (childNode.nodeType === 1) {
        hasInvalidAttributes(childNode);
      }
      // if the element is a math element, check all the attributes of the child node to ensure that there are on href or xlink:href attributes with javascript urls
      if (
        htmlElement.tagName.toLowerCase() === 'math' &&
        Object.keys(childNode.attributes).length >= 1
      ) {
        Array.from(childNode.attributes).forEach(elementAttribute => {
          if (
            ((elementAttribute as Attr).localName === 'href' ||
              (elementAttribute as Attr).localName === 'xlink:href') &&
            childNode
              .getAttribute((elementAttribute as Attr).localName)
              .toLowerCase()
              .startsWith('javascript')
          ) {
            chrome.runtime.sendMessage({
              type: MESSAGE_TYPE.DEBUG,
              log:
                'violating attribute ' +
                (elementAttribute as Attr).localName +
                ' from element ' +
                htmlElement.outerHTML,
            });
            updateCurrentState(STATES.INVALID);
          }
        });
      }
    });
  }
}

function checkNodesForViolations(element) {
  hasViolatingJavaScriptURI(element);
  hasInvalidAttributes(element);
}

export function hasInvalidScripts(scriptNodeMaybe, scriptList) {
  // if not an HTMLElement ignore it!
  if (scriptNodeMaybe.nodeType !== 1) {
    return false;
  }
  checkNodesForViolations(scriptNodeMaybe);

  if (scriptNodeMaybe.nodeName.toLowerCase() === 'script') {
    return storeFoundJS(scriptNodeMaybe, scriptList);
  } else if (scriptNodeMaybe.childNodes.length > 0) {
    scriptNodeMaybe.childNodes.forEach(childNode => {
      // if not an HTMLElement ignore it!
      if (childNode.nodeType !== 1) {
        return;
      }
      checkNodesForViolations(childNode);
      if (childNode.nodeName.toLowerCase() === 'script') {
        storeFoundJS(childNode, scriptList);
        return;
      }

      Array.from(childNode.getElementsByTagName('script')).forEach(
        childScript => {
          storeFoundJS(childScript, scriptList);
        }
      );
    });
  }

  return;
}

const parseCSPString = csp => {
  const directiveStrings = csp.split(';');
  return directiveStrings.reduce((map, directiveString) => {
    const [directive, ...values] = directiveString.split(' ');
    return map.set(directive, new Set(values));
  }, new Map());
};

const checkCSPHeaders = (cspHeader, cspReportHeader) => {
  // If CSP is enforcing on evals we don't need to do extra checks
  if (cspHeader != null) {
    const cspMap = parseCSPString(cspHeader);
    if (cspMap.has('script-src')) {
      if (!cspMap.get('script-src').has("'unsafe-eval'")) {
        return;
      }
    }
    if (!cspMap.has('script-src') && cspMap.has('default-src')) {
      if (!cspMap.get('default-src').has("'unsafe-eval'")) {
        return;
      }
    }
  }

  // If CSP is not reporting on evals we cannot catch them
  if (cspReportHeader != null) {
    const cspReportMap = parseCSPString(cspReportHeader);
    if (cspReportMap.has('script-src')) {
      if (cspReportMap.get('script-src').has("'unsafe-eval'")) {
        updateCurrentState(STATES.INVALID);
        chrome.runtime.sendMessage({
          type: MESSAGE_TYPE.DEBUG,
          log: 'Missing unsafe-eval from CSP report-only header',
        });
        return;
      }
    }
    if (!cspReportMap.has('script-src') && cspReportMap.has('default-src')) {
      if (cspReportMap.get('default-src').has("'unsafe-eval'")) {
        updateCurrentState(STATES.INVALID);
        chrome.runtime.sendMessage({
          type: MESSAGE_TYPE.DEBUG,
          log: 'Missing unsafe-eval from CSP report-only header',
        });
        return;
      }
    }
  } else {
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPE.DEBUG,
      log: 'Missing CSP report-only header',
    });
    updateCurrentState(STATES.INVALID);
    return;
  }

  // Check for evals
  scanForCSPEvalReportViolations();
};

const scanForCSPEvalReportViolations = () => {
  document.addEventListener('securitypolicyviolation', e => {
    if (e.blockedURI !== 'eval') {
      return;
    }

    if (e.disposition === 'enforce') {
      return;
    }

    fetch(e.sourceFile, { cache: 'only-if-cached', mode: 'same-origin' })
      .then(response => {
        if (response.status === 504) {
          updateCurrentState(STATES.INVALID);
        }

        return response.text();
      })
      .then(code => {
        const violatingLine = code.split(/\r?\n/)[e.lineNumber - 1];
        if (
          violatingLine.includes('WebAssembly') &&
          !violatingLine.includes('eval(') &&
          !violatingLine.includes('Function(') &&
          !violatingLine.includes("setTimeout('") &&
          !violatingLine.includes("setInterval('") &&
          !violatingLine.includes('setTimeout("') &&
          !violatingLine.includes('setInterval("')
        ) {
          return;
        }
        updateCurrentState(STATES.INVALID);
        chrome.runtime.sendMessage({
          type: MESSAGE_TYPE.DEBUG,
          log: `Caught eval in ${e.sourceFile}`,
        });
      });
  });
};

export const scanForScripts = () => {
  const allElements = document.getElementsByTagName('*');

  Array.from(allElements).forEach(allElement => {
    checkNodesForViolations(allElement);
    // next check for existing script elements and if they're violating
    if (allElement.nodeName.toLowerCase() === 'script') {
      storeFoundJS(allElement, foundScripts);
    }
  });

  try {
    // track any new scripts that get loaded in
    const scriptMutationObserver = new MutationObserver(mutationsList => {
      mutationsList.forEach(mutation => {
        if (mutation.type === 'childList') {
          Array.from(mutation.addedNodes).forEach(checkScript => {
            hasInvalidScripts(checkScript, foundScripts);
          });
        } else if (mutation.type === 'attributes') {
          updateCurrentState(STATES.INVALID);
          chrome.runtime.sendMessage({
            type: MESSAGE_TYPE.DEBUG,
            log:
              'Processed DOM mutation and invalid attribute added or changed ' +
              mutation.target,
          });
        }
      });
    });

    scriptMutationObserver.observe(document, {
      attributeFilter: DOM_EVENTS,
      childList: true,
      subtree: true,
    });
  } catch (_UnknownError) {
    updateCurrentState(STATES.INVALID);
  }
};

/**
 * Return text from the response object. The main purpose of this method is to
 * extract and parse sourceURL and sourceMappingURL comments from inlined data
 * scripts.
 * Note that this function consumes the response body!
 *
 * @param {Response} response Response will be consumed!
 * @returns string Response text if the sourceURL is valid
 */
async function genSourceText(response) {
  const sourceText = await response.text();
  // Just a normal script tag with a source url
  if (!response.url.startsWith('data:application/x-javascript')) {
    return sourceText;
  }

  // Inlined data-script. We need to extract with optional `//# sourceURL=` and
  // `//# sourceMappingURL=` comments before sending it over to be hashed...
  const sourceTextParts = sourceText.trimEnd().split('\n');

  // NOTE: For security reasons, we expect inlined data scripts to *end* with
  // sourceURL comments. This is because a man-in-the-middle can insert code
  // after the sourceURL comment, which would execute on the browser but get
  // stripped away by the extension before getting hashed + verified.
  // As a result, we're always starting our search from the bottom.
  if (
    sourceTextParts[sourceTextParts.length - 1].startsWith('//# sourceURL=')
  ) {
    const sourceURL = sourceTextParts.pop().split('//# sourceURL=')[1] ?? '';
    if (!sourceURL.startsWith('http')) {
      throw new Error(`Invalid sourceUrl in inlined data script: ${sourceURL}`);
    }
  }
  while (
    sourceTextParts[sourceTextParts.length - 1] === '\n' ||
    sourceTextParts[sourceTextParts.length - 1].startsWith(
      '//# sourceMappingURL='
    )
  ) {
    sourceTextParts.pop();
  }
  return sourceTextParts.join('\n').trim();
}

async function processJSWithSrc(script, origin, version) {
  // fetch the script from page context, not the extension context.
  try {
    const sourceResponse = await fetch(script.src, { method: 'GET' });
    if (DOWNLOAD_JS_ENABLED) {
      const fileNameArr = script.src.split('/');
      const fileName = fileNameArr[fileNameArr.length - 1].split('?')[0];

      sourceScripts.set(
        fileName,
        sourceResponse
          .clone()
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          .body.pipeThrough(new window.CompressionStream('gzip'))
      );
    }
    const sourceText = await genSourceText(sourceResponse.clone());
    // split package up if necessary
    const packages = sourceText.split('/*FB_PKG_DELIM*/\n');
    const packagePromises = packages.map(jsPackage => {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            type: MESSAGE_TYPE.RAW_JS,
            rawjs: jsPackage.trimStart(),
            origin: origin,
            version: version,
          },
          response => {
            if (response.valid) {
              resolve(response.valid);
            } else {
              reject(response.type);
            }
          }
        );
      });
    });
    await Promise.all(packagePromises);
    return { valid: true };
  } catch (scriptProcessingError) {
    return {
      valid: false,
      type: scriptProcessingError,
    };
  }
}
async function allowDisallow(scriptOrHash, script) {
  const disallowList = await chrome.storage.local.get(['disallow']);
  const allowList = await chrome.storage.local.get(['allowlist']);

  const disallowMap = new Map(Object.entries(disallowList?.disallow || {}));
  const allowMap = new Map(Object.entries(allowList?.allowlist || {}));
  if (
    !disallowMap.size &&
    !allowMap.has(scriptOrHash?.src) &&
    !allowMap.has(scriptOrHash)
  ) {
    if (scriptOrHash?.src) {
      disallowMap.set(scriptOrHash.src, script);
      await chrome.storage.local.set({
        disallow: Object.fromEntries(disallowMap),
      });
    } else {
      disallowMap.set(scriptOrHash, script);
      await chrome.storage.local.set({
        disallow: Object.fromEntries(disallowMap),
      });
    }
  } else {
    if (scriptOrHash.src) {
      if (
        !disallowMap.has(scriptOrHash.src) &&
        !allowMap.has(scriptOrHash.src)
      ) {
        const map2 = disallowMap.set(scriptOrHash.src, script);
        await chrome.storage.local.set({ disallow: Object.fromEntries(map2) });
      }
    } else {
      if (!disallowMap.has(scriptOrHash) && !allowMap.has(scriptOrHash)) {
        const map2 = disallowMap.set(scriptOrHash, script);
        await chrome.storage.local.set({ disallow: Object.fromEntries(map2) });
      }
    }
  }
}

export const processFoundJS = async (origin, version) => {
  // foundScripts
  const fullscripts = foundScripts.get(version).splice(0);
  const scripts = fullscripts.filter(script => {
    if (
      script.otherType === currentFilterType ||
      ['BOTH', ''].includes(currentFilterType)
    ) {
      return true;
    } else {
      foundScripts.get(version).push(script);
    }
  });
  const allowList = await chrome.storage.local.get(['allowlist']);
  const allowMap = new Map(Object.entries(allowList?.allowlist || {}));
  const disallowList = await chrome.storage.local.get(['disallow']);
  const disallowMap = new Map(Object.entries(disallowList?.disallow || {}));
  let pendingScriptCount = scripts.length;
  for (const script of scripts) {
    if (script.src) {
      await processJSWithSrc(script, origin, version).then(response => {
        pendingScriptCount--;
        if (response.valid) {
          if (pendingScriptCount == 0) {
            updateCurrentState(STATES.VALID);
          }
        } else {
          allowDisallow(script, script);

          if (response.type === 'EXTENSION') {
            updateCurrentState(STATES.RISK);
          } else if (allowMap.has(script.src)) {
            if (disallowMap.size === 0) {
              updateCurrentState(STATES.VALID);
            } else {
              updateCurrentState(STATES.RISK);
            }
          } else {
            updateCurrentState(STATES.INVALID);
          }
        }

        chrome.runtime.sendMessage({
          type: MESSAGE_TYPE.DEBUG,
          log:
            'processed JS with SRC, ' +
            script.src +
            ',response is ' +
            JSON.stringify(response).substring(0, 500),
        });
      });
    } else {
      chrome.runtime.sendMessage(
        {
          type: script.type,
          rawjs: script.rawjs.trimStart(),
          lookupKey: script.lookupKey,
          origin: origin,
          version: version,
        },
        async response => {
          pendingScriptCount--;
          const inlineScriptMap = new Map();
          if (response.valid) {
            inlineScriptMap.set(response.hash, script.rawjs);
            inlineScripts.push(inlineScriptMap);
            if (pendingScriptCount == 0) {
              updateCurrentState(STATES.VALID);
            }
          } else {
            allowDisallow(response.hash, script);
            // using an array of maps, as we're using the same key for inline scripts - this will eventually be removed, once inline scripts are removed from the page load
            inlineScriptMap.set('hash not in manifest', script.rawjs);
            inlineScripts.push(inlineScriptMap);

            if (
              KNOWN_EXTENSION_HASHES.includes(response.hash) &&
              !allowMap.has(response.hash)
            ) {
              updateCurrentState(STATES.RISK);
            } else if (allowMap.has(response.hash)) {
              if (disallowMap.size === 0) {
                updateCurrentState(STATES.VALID);
              } else {
                updateCurrentState(STATES.RISK);
              }
            } else {
              updateCurrentState(STATES.INVALID);
            }
          }
          chrome.runtime.sendMessage({
            type: MESSAGE_TYPE.DEBUG,
            log:
              'processed the RAW_JS, response is ' +
              response.hash +
              ' ' +
              JSON.stringify(response).substring(0, 500),
          });
        }
      );
    }
  }
  window.setTimeout(() => processFoundJS(origin, version), 3000);
};

async function downloadJSToZip(downloadType) {
  try {
    if (downloadType === 'downloadSource') {
      const chunks = [];
      const delimPrefix = '\n********** new file: ';
      const delimSuffix = ' **********\n';
      const enc = new TextEncoder();

      for (const [fileName, compressedStream] of sourceScripts.entries()) {
        try {
          const delim = delimPrefix + fileName + delimSuffix;
          const encodedDelim = enc.encode(delim);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const delimStream = new window.CompressionStream('gzip');
          const writer = delimStream.writable.getWriter();
          writer.write(encodedDelim);
          writer.close();
          const delimBuffer = await new Response(
            delimStream.readable
          ).arrayBuffer();
          chunks.push(delimBuffer);

          const fileBuffer = await new Response(compressedStream).arrayBuffer();
          chunks.push(fileBuffer);
        } catch (err) {
          console.error(`Error processing file ${fileName}: `, err);
        }
      }

      for (const inlineSrcMap of inlineScripts) {
        try {
          const inlineHash = inlineSrcMap.keys().next().value;
          const inlineSrc = inlineSrcMap.values().next().value;
          const delim =
            delimPrefix + 'Inline Script ' + inlineHash + delimSuffix;
          const encodedDelim = enc.encode(delim);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const delimStream = new window.CompressionStream('gzip');
          const delimWriter = delimStream.writable.getWriter();
          delimWriter.write(encodedDelim);
          delimWriter.close();
          const delimBuffer = await new Response(
            delimStream.readable
          ).arrayBuffer();
          chunks.push(delimBuffer);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const inlineStream = new window.CompressionStream('gzip');
          const writer = inlineStream.writable.getWriter();
          writer.write(enc.encode(inlineSrc));
          writer.close();
          const inlineBuffer = await new Response(
            inlineStream.readable
          ).arrayBuffer();
          chunks.push(inlineBuffer);
        } catch (err) {
          console.error(`Error processing inline script: `, err);
        }
      }

      const combinedBuffer = new Blob(chunks, { type: 'application/gzip' });

      const url = URL.createObjectURL(combinedBuffer);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'meta_source_files.gz';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error('Error in downloadJSToZip: ', err);
  }
}

chrome.runtime.onMessage.addListener(function (request) {
  if (request.greeting === 'downloadSource' && DOWNLOAD_JS_ENABLED) {
    downloadJSToZip(request.greeting);
  } else if (request.greeting === 'nocacheHeaderFound') {
    updateCurrentState(STATES.INVALID);
  }
});

function parseFailedJson(queuedJsonToParse) {
  try {
    JSON.parse(queuedJsonToParse.node.textContent);
  } catch (parseError) {
    if (queuedJsonToParse.retry > 0) {
      queuedJsonToParse.retry--;
      setTimeout(() => parseFailedJson(queuedJsonToParse), 20);
    } else {
      updateCurrentState(STATES.INVALID);
    }
  }
}

function isPathnameExcluded(excludedPathnames) {
  let pathname = location.pathname;
  if (!pathname.endsWith('/')) {
    pathname = pathname + '/';
  }
  return excludedPathnames.some(rule => {
    if (typeof rule === 'string') {
      return pathname === rule;
    } else {
      const match = pathname.match(rule);
      return match != null && match[0] === pathname;
    }
  });
}

export function startFor(origin, excludedPathnames = []) {
  chrome.runtime
    .sendMessage({
      type: MESSAGE_TYPE.CONTENT_SCRIPT_START,
      origin,
    })
    .then(resp => {
      if (
        [ORIGIN_TYPE.FACEBOOK, ORIGIN_TYPE.MESSENGER].includes(
          currentOrigin as 'FACEBOOK' | 'MESSENGER'
        )
      ) {
        checkCSPHeaders(resp.cspHeader, resp.cspReportHeader);
      }
    });
  if (isPathnameExcluded(excludedPathnames)) {
    updateCurrentState(STATES.IGNORE);
    return;
  }
  let isUserLoggedIn = false;
  if ([ORIGIN_TYPE.FACEBOOK, ORIGIN_TYPE.MESSENGER].includes(origin)) {
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const pair = cookie.split('=');
      // c_user contains the user id of the user logged in
      if (pair[0].indexOf('c_user') >= 0) {
        isUserLoggedIn = true;
      }
    });
  } else {
    // only doing this check for FB and MSGR
    isUserLoggedIn = true;
  }
  if (isUserLoggedIn) {
    updateCurrentState(STATES.PROCESSING);
    currentOrigin = origin;
    scanForScripts();
    // set the timeout once, in case there's an iframe and contentUtils sets another manifest timer
    if (manifestTimeoutID === '') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      manifestTimeoutID = setTimeout(() => {
        // Manifest failed to load, flag a warning to the user.
        updateCurrentState(STATES.TIMEOUT);
      }, 45000);
    }
  }
}
