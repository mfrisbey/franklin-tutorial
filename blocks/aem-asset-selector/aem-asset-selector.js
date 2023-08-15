import { readBlockConfig } from '../../scripts/lib-franklin.js';
import {
  init, renderAssetSelectorWithImsFlow, logoutImsFlow, refreshToken
} from './aem-asset-selector-util.js';

export default function decorate(block) {
  const cfg = readBlockConfig(block);
  block.textContent = '';
  block.innerHTML = `
    <h1>AEM Assets Selector</h1>
    <div class="action-container">
        <button id="as-cancel">Sign Out</button>
        <button id="as-submit">Sign In</button>
        <button id="refresh-token">Refresh Token</button>
    </div>
    <div id="asset-selector" style="height: calc(100vh - 80px); width: calc(100vw - 60px); margin: -20px;">
    </div>
    `;
  block.querySelector('#as-submit').addEventListener('click', () => {
    renderAssetSelectorWithImsFlow(cfg);
  });

  block.querySelector('#refresh-token').addEventListener('click', () => {
    refreshToken();
  });

  block.querySelector('#as-cancel').addEventListener('click', () => {
    logoutImsFlow();
  });

  init(cfg);
}
