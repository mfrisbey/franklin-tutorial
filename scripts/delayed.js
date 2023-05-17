// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './lib-franklin.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

// read demo information from local storage. these will need to be added manually
const spaceId = localStorage.getItem('content-lake-space-id');
const companyId = localStorage.getItem('content-lake-company-id');
const ingestorApiKey = localStorage.getItem('content-lake-ingestor-api-key');
const ingestorUrl= localStorage.getItem('content-lake-ingestor-url');

if (spaceId && companyId && ingestorApiKey && ingestorUrl) {
  // find all img tags in the document
  const images = document.getElementsByTagName('img');
  const sources = {};

  // build a lookup of Franklin media assets
  for (let i = 0; i < images.length; i += 1) {
    const src = images[i].src;
    const regex = /media_[0-9a-f]{41}/g;
    const srcUrl = new URL(src);

    if (regex.test(srcUrl.pathname)) {
      // remove query parameters from the img url
      const assetUrl = `${srcUrl.origin}${srcUrl.pathname}`;
      if (!sources[assetUrl]) {
        // haven't seen this asset yet
        sources[assetUrl] = 0;
      }
      // increment number of occurences of the asset on the page
      sources[assetUrl] += 1;
    }
  }

  const batchId = `franklin-page-load-${Date.now()}`;
  const pageUrl = new URL(window.location.href);
  const pagePath = `${pageUrl.origin}${pageUrl.pathname !== '/' ? pageUrl.pathname : ''}`;

  const ingestorPayloads = Object.keys(sources).map((url) => {
    const imgUrl = new URL(url);
    const imgPathStr = String(imgUrl.pathname);
    const name = imgPathStr.substring(1);
    const lastDot = name.lastIndexOf('.');
    const extensionless = lastDot > 0 ? name.substring(0, lastDot) : name;
    return {
      data: {
        sourceAssetId: extensionless,
        name,
        sourceType: 'rum',
        sourceId: pageUrl.origin,
        impressions: sources[url],
        pageUrls: [pagePath],
        assetStatus: 'Published',
      },
      binary: {
        url,
      },
      batchId,
      jobId: batchId,
      companyId,
      spaceId,
      requestId: `${batchId}-${extensionless}`
    };
  });

  console.log('built payloads to send to content lake', JSON.stringify(ingestorPayloads, null, 2));
} else {
  console.log('content lake ingestion requires local storage values for content-lake-space-id, content-lake-company-id, content-lake-ingestor-api-key, and content-lake-ingestor-url');
}
