import {jest} from '@jest/globals';

window.chrome = {
    browserAction: {
        setIcon: jest.fn(),
        setPopup: jest.fn(),
    },
    storage: {
        local: {
            get: jest.fn(() => {
                return {allowlist: {}}
            }),
            set: jest.fn()
        }
    },
    tabs: {
        onRemoved: {
            addListener: jest.fn(),
        }, onReplaced: {
            addListener: jest.fn(),
        }
    },
  webRequest: {
      onResponseStarted: {
        addListener: jest.fn(),
      },
    onHeadersReceived:{
        addListener: jest.fn(),
      }
  },
    runtime: {
        onMessage: {
            addListener: jest.fn(),
        },
        onInstalled: {
            addListener: jest.fn(),
        },
        sendMessage: jest.fn(),
    }
};

window.crypto = {
    subtle: {
        digest: jest.fn(),
    }
};


window.Uint8Array = function () {
};
