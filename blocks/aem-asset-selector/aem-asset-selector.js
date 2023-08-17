import { readBlockConfig } from '../../scripts/lib-franklin.js';
import {
  init,
  renderAssetSelectorWithImsFlow,
  logoutImsFlow
} from './aem-asset-selector-util.js';

export default async function decorate(block) {
  let rendered = false;
  const cfg = readBlockConfig(block);
  block.textContent = '';
  block.innerHTML = `
    <div class="asset-overlay">
      <img id="loading" src="${cfg.loading}" />
      <div id="login">
        <p>Welcome to the Asset Selector! After signing in you'll have the option to select which assets to use.</p>
        <button id="as-login">Sign In</button>
      </div>
    </div>
    <div class="action-container">
        <button id="as-cancel">Sign Out</button>
    </div>
    <div id="asset-selector" draggable>
    </div>
  `;

  block.querySelector('#as-login').addEventListener('click', (e) => {
    e.preventDefault();
    renderAssetSelectorWithImsFlow(cfg);
  });

  block.querySelector('#as-cancel').addEventListener('click', (e) => {
    e.preventDefault();
    logoutImsFlow();
  });

  const selector = document.querySelector('body');
  selector.addEventListener('dragstart', () => {
    console.log('dragstart');
  });
  selector.addEventListener('drag', () => {
    console.log('drag');
  });
  selector.addEventListener('dragend', () => {
    console.log('dragend');
  });
  selector.addEventListener('dragenter', () => {
    console.log('dragenter');
  });
  selector.addEventListener('dragleave', () => {
    console.log('dragleave');
  });
  selector.addEventListener('dragover', () => {
    console.log('dragover');
  });

  // give a little time for onAccessTokenReceived() to potentially come in
  setTimeout(() => {
    if (block.querySelector('.asset-overlay').style.display !== 'none') {
      // at this point the overlay is still visible, meaning that we haven't
      // gotten an event indicating the user is logged in. Display the
      // sign in interface
      block.querySelector('#loading').style.display = 'none';
      block.querySelector('#login').style.display = 'flex';
    }
  }, 2000);

  // this will be sent by the auth service if the user has a token, meaning
  // they're logged in. if that happens, hide the login overlay and show
  // the asset selector
  cfg.onAccessTokenReceived = () => {
    block.querySelector('.asset-overlay').style.display = 'none';
    if (!rendered) {
      rendered = true;
      // calling this shouldn't prompt the user to log in, since they're logged
      // in already
      renderAssetSelectorWithImsFlow(cfg);
    }
  };

  init(cfg);
}
