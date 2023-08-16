import { readBlockConfig } from '../../scripts/lib-franklin.js';
import {
  init, renderAssetSelectorWithImsFlow, logoutImsFlow
} from './aem-asset-selector-util.js';

export default async function decorate(block) {
  const cfg = readBlockConfig(block);
  block.textContent = '';
  block.innerHTML = `
    <div class="action-container">
        <button id="as-cancel">Sign Out</button>
    </div>
    <div id="asset-selector">
    </div>
    `;

  block.querySelector('#as-cancel').addEventListener('click', () => {
    logoutImsFlow();
  });

  await init(cfg);
  return renderAssetSelectorWithImsFlow(cfg);
}
