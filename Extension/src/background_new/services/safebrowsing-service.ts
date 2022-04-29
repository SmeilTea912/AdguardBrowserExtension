import browser, { WebRequest } from 'webextension-polyfill';
import safebrowsing from './filters/safebrowsing';

export class SafebrowsingService {
    constructor() {
        this.onHeaderReceived = this.onHeaderReceived.bind(this);
    }

    init() {
        browser.webRequest.onHeadersReceived.addListener(
            this.onHeaderReceived,
            { urls: ['<all_urls>'] },
            ['responseHeaders', 'blocking', 'extraHeaders'],
        );
    }

    // eslint-disable-next-line class-methods-use-this
    onHeaderReceived(details: WebRequest.OnHeadersReceivedDetailsType) {
        const {
            type,
            statusCode,
            url,
            tabId,
            originUrl,
        } = details;

        if (type === 'main_frame' && statusCode !== 301 && statusCode !== 302) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this.filterUrl(tabId, url, originUrl);
        }
    }

    // eslint-disable-next-line class-methods-use-this
    async filterUrl(tabId: number, url: string, originUrl: string) {
        const safebrowsingUrl = await safebrowsing.checkSafebrowsingFilter(url, originUrl);

        if (!safebrowsingUrl) {
            return;
        }

        await browser.tabs.update(tabId, { url: safebrowsingUrl });
    }
}

export const safebrowsingService = new SafebrowsingService();
