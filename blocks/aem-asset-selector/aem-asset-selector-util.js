/* eslint-disable no-console */
const AS_MFE = 'https://experience.adobe.com/solutions/CQ-assets-selectors/assets/resources/asset-selectors.js';
const IMS_ENV_STAGE = 'stg1';
const IMS_ENV_PROD = 'prod';
const API_KEY = 'franklin';
const PROXY = 'https://html-transfer-cf-worker.satyadeep.workers.dev';
const WEB_TOOLS = 'https://master-sacred-dove.ngrok-free.app';

let imsInstance = null;
let imsEnvironment;

function loadScript(url, callback, type) {
  const $head = document.querySelector('head');
  const $script = document.createElement('script');
  $script.src = url;
  if (type) {
    $script.setAttribute('type', type);
  }
  $head.append($script);
  $script.onload = callback;
  return $script;
}

function load(cfg) {
  const imsProps = {
    imsClientId: cfg['ims-client-id'],
    imsScope: 'additional_info.projectedProductContext,openid,read_organizations,AdobeID,ab.manage',
    redirectUrl: window.location.href,
    modalMode: true,
    imsEnvironment,
    env: imsEnvironment,
    adobeImsOptions: {
      modalSettings: {
        allowOrigin: window.location.origin
      }
    },
    onAccessTokenReceived: cfg.onAccessTokenReceived || (() => {}),
    onAccessTokenExpired: () => {
      // token expired - does token need to be manually refreshed here?
    },
    onErrorReceived: (/* type, msg */) =>  {
      // handle errors in sign in flow
    }
  };
  // eslint-disable-next-line no-undef
  const registeredTokenService = PureJSSelectors.registerAssetsSelectorsAuthService(imsProps);
  imsInstance = registeredTokenService;
}

export function init(cfg) {
  return new Promise((res, rej) => {
    if (cfg.environment.toUpperCase() === 'STAGE') {
      imsEnvironment = IMS_ENV_STAGE;
    } else if (cfg.environment.toUpperCase() === 'PROD') {
      imsEnvironment = IMS_ENV_PROD;
    } else {
      rej(new Error('Invalid environment setting!'));
    }
  
    loadScript(AS_MFE, () => {
      load(cfg);
      res();
    });
  });
}

function onClose() {
  // const selectorDialog = document.getElementById('asset-selector-dialog');
  // selectorDialog.close();
}

async function getAssetPublicUrl(url) {
  const response = await fetch(`${WEB_TOOLS}/asset-bin?src=${url}`, {
    headers: {
      Authorization: `Bearer ${imsInstance.getImsToken()}`,
      'x-api-key': API_KEY,
    },
  });
  if (response && response.ok) {
    const json = await response.json();
    return json['asset-url'];
  }
  if (response && !response.ok) {
    throw new Error(response.statusTest);
  }
  return null;
}

async function getAssetBlob(url) {
  let response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${imsInstance.getImsToken()}`,
        'x-api-key': API_KEY,
        accept: '*/*',
      },
    });
  } catch (e) {
    console.error('Error fetching asset, trying proxy');
    response = await fetch(`${PROXY}?src=${url}`, {
      headers: {
        Authorization: `Bearer ${imsInstance.getImsToken()}`,
        'x-api-key': API_KEY,
      },
    });
    if (response && !response.ok) {
      throw new Error(response.statusTest);
    }
  }

  const blob = await response.blob();
  return blob;
}

async function handleSelection(selection) {
  const selectedAsset = selection[0];
  let maxRendition = null;
  // eslint-disable-next-line no-underscore-dangle
  selectedAsset._links['http://ns.adobe.com/adobecloud/rel/rendition'].forEach((rendition) => {
    if ((!maxRendition || maxRendition.width < rendition.width)) {
      maxRendition = rendition;
    }
  });
  console.log('Selected rendition:', maxRendition.href);
  // const assetBlob = await getAssetBlob(maxRendition.href);
  // const assetMarkup = `<img src="${URL.createObjectURL(assetBlob)}" alt="${selectedAsset.name}" />`;

  const assetPublicUrl = await getAssetPublicUrl(maxRendition.href.substring(0, maxRendition.href.indexOf('?')));
  console.log('Asset public URL:', assetPublicUrl);
  const assetMarkup = `<img src="${assetPublicUrl}"  />`;

  const data = [
    // eslint-disable-next-line no-undef
    new ClipboardItem({ 'text/html': new Blob([assetMarkup], { type: 'text/html' }) }),
  ];
  // Write the new clipboard contents
  await navigator.clipboard.write(data);
  // onClose();
}

export async function copyAsset(asset) {
  if (!asset || !asset._links) {
    return;
  }
  const download = asset._links['http://ns.adobe.com/adobecloud/rel/download'];
  if (!download.href) {
    return;
  }
  try {
    const res = await fetch(download.href, {
      headers: {
        Authorization: `Bearer ${imsInstance.getImsToken()}`
      }
    });
    console.log('FETCHING YEAH!', res.ok, res.statusCode);
  } catch (e) {
    console.log('ERROR FETCHING', e);
  }

  return new Promise(res => setTimeout(res, 2000));
}

// eslint-disable-next-line no-unused-vars
function handleNavigateToAsset(asset) {
  // onClose();
}

function getAssetSelector() {
  return document.getElementById('asset-selector');
}

function handleAssetSelection(e, cfg) {
  if (cfg) {
    if (e.length && cfg.onAssetSelected) {
      cfg.onAssetSelected(e[0]);
    } else if (!e.length && cfg.onAssetDeselected) {
      cfg.onAssetDeselected();
    }
  }
}

function buildAssetSelectorProps(cfg) {
  return {
    onClose,
    handleSelection,
    handleAssetSelection: (e) => handleAssetSelection(e, cfg),
    handleNavigateToAsset,
    env: cfg.environment.toUpperCase(),
    apiKey: API_KEY,
    hideTreeNav: true,
    runningInUnifiedShell: false,
    noWrap: true
  };
}

export async function renderAssetSelectorWithImsFlow(cfg) {
  // eslint-disable-next-line no-undef
  PureJSSelectors.renderAssetSelectorWithAuthFlow(getAssetSelector(), buildAssetSelectorProps(cfg));
}

export async function renderAssetSelector(cfg) {
  // eslint-disable-next-line no-undef
  PureJSSelectors.renderAssetSelector(getAssetSelector(), buildAssetSelectorProps(cfg));
}

export async function refreshToken() {
  try {
    await imsInstance.refreshToken();
  } catch (e) {
    console.log('Error refreshing token...', e);
  }
}

export async function logoutImsFlow() {
  // eslint-disable-next-line no-console
  console.log('Signing out...', imsInstance);
  await imsInstance.signOut();
}
