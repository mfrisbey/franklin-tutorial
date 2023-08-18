import { readBlockConfig } from '../../scripts/lib-franklin.js';
import {
  init,
  renderAssetSelectorWithImsFlow,
  logoutImsFlow,
  copyAsset
} from './aem-asset-selector-util.js';

export default async function decorate(block) {
  let rendered = false;
  let selected = false;
  const cfg = readBlockConfig(block);
  block.textContent = '';
  block.innerHTML = `
    <div class="asset-overlay loading">
      <img id="loading" src="${cfg.loading}" />
      <div id="login">
        <p>Welcome to the Asset Selector! Please Sign In to view your assets.</p>
        <button id="as-login">Sign In</button>
      </div>
    </div>
    <div class="action-container">
        <div><img src="${cfg.logo}" /></div>
        <button id="as-copy" class="disabled">Copy</button>
        <button id="as-cancel">Sign Out</button>
    </div>
    <div id="asset-selector">
    </div>
  `;

  block.querySelector('#as-login').addEventListener('click', (e) => {
    e.preventDefault();
    renderAssetSelectorWithImsFlow(cfg);
  });

  const copy = block.querySelector('#as-copy');
  copy.addEventListener('click', async (e) => {
    e.preventDefault();
    if (selected) {
      copy.classList.add('disabled');
      copy.innerText = 'Copying...';
      const success = await copyAsset(selected);
      if (success) {
        copy.innerText = 'Copied!';
      } else {
        copy.innerText = 'Error!';
      }
      copy.classList.remove('disabled');
    }
  });

  block.querySelector('#as-cancel').addEventListener('click', (e) => {
    e.preventDefault();
    logoutImsFlow();
  });

  // give a little time for onAccessTokenReceived() to potentially come in
  setTimeout(() => {
    const overlay = block.querySelector('.asset-overlay');
    if (overlay.style.display !== 'none') {
      // at this point the overlay is still visible, meaning that we haven't
      // gotten an event indicating the user is logged in. Display the
      // sign in interface
      overlay.classList.remove('loading');
      block.querySelector('#loading').style.display = 'none';
      block.querySelector('#login').style.display = 'flex';
    }
  }, 2000);

  // this will be sent by the auth service if the user has a token, meaning
  // they're logged in. if that happens, hide the login overlay and show
  // the asset selector
  cfg.onAccessTokenReceived = () => {
    block.querySelector('.asset-overlay').style.display = 'none';
    block.querySelectorAll('.action-container button').forEach((button) => button.style.display = 'block');
    if (!rendered) {
      rendered = true;
      // calling this shouldn't prompt the user to log in, since they're logged
      // in already
      renderAssetSelectorWithImsFlow(cfg);
    }
  };

  cfg.onAssetSelected = (e) => {
    selected = e;
    copy.classList.remove('disabled');
    copy.innerText = 'Copy';
  };

  cfg.onAssetDeselected = () => {
    selected = false;
    copy.classList.add('disabled');
    copy.innerText = 'Copy';
  };

  init(cfg);
}
