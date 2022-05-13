import browser from 'webextension-polyfill';
import MD5 from 'crypto-js/md5';
import { BrowserUtils } from '../../utils/browser-utils';
import { log } from '../../../common/log';
import {
    ANTIBANNER_GROUPS_ID,
    CUSTOM_FILTERS_START_ID,
    MessageType,
} from '../../../common/constants';
import { customFiltersMetadata } from './custom-filters-metadata';
import { networkService } from '../network/network-service';
import { FiltersStorage } from './filters-storage';
import { filtersState } from './filters-state';
import { filtersVersion } from './filters-version';
import { messageHandler } from '../../message-handler';
import { Engine } from '../../engine';

export class CustomFilters {
    /**
     * Amount of lines to parse metadata from filter's header
     */
    static AMOUNT_OF_LINES_TO_PARSE = 50;

    /**
     * Custom filter downloading limit
     */
    static DOWNLOAD_LIMIT_MS = 3 * 1000;

    static async init() {
        messageHandler.addListener(MessageType.LOAD_CUSTOM_FILTER_INFO, CustomFilters.onCustomFilterInfoLoad);
        messageHandler.addListener(MessageType.SUBSCRIBE_TO_CUSTOM_FILTER, CustomFilters.onCustomFilterSubscribtion);
        messageHandler.addListener(MessageType.REMOVE_ANTIBANNER_FILTER, CustomFilters.onCustomFilterRemove);

        browser.webNavigation.onCommitted.addListener((details) => {
            const { tabId, frameId } = details;

            browser.tabs.executeScript(tabId, {
                file: '/content-script/subscribe.js',
                runAt: 'document_start',
                frameId,
            });
        });
    }

    static async onCustomFilterInfoLoad(message) {
        const { url } = message.data;

        return CustomFilters.getCustomFilterInfo(url);
    }

    static async onCustomFilterSubscribtion(message) {
        const { filter } = message.data;

        const { customUrl, name, trusted } = filter;

        await CustomFilters.loadCustomFilter(customUrl, { name, trusted });

        const filterMetadata = customFiltersMetadata.getByUrl(customUrl);

        await filtersState.enableFilters([filterMetadata.filterId]);

        await Engine.update();

        return filterMetadata;
    }

    static async onCustomFilterRemove(message) {
        const { filterId } = message.data;

        await CustomFilters.removeFilter(filterId);
    }

    /**
     * Parses expires string in meta
     */
    static parseExpiresStr(str: string): number {
        const regexp = /(\d+)\s+(day|hour)/;

        const parseRes = str.match(regexp);

        if (!parseRes) {
            const parsed = Number.parseInt(str, 10);
            return Number.isNaN(parsed) ? 0 : parsed;
        }

        const [, num, period] = parseRes;

        let multiplier = 1;
        switch (period) {
            case 'day': {
                multiplier = 24 * 60 * 60;
                break;
            }
            case 'hour': {
                multiplier = 60 * 60;
                break;
            }
            default: {
                break;
            }
        }

        return Number(num) * multiplier;
    }

    /**
     * Parses filter metadata from rules header
     *
     * @param rules
     * @returns object
     */
    static parseFilterDataFromHeader = (rules: string[]) => {
        return {
            name: CustomFilters.parseTag('Title', rules),
            description: CustomFilters.parseTag('Description', rules),
            homepage: CustomFilters.parseTag('Homepage', rules),
            version: CustomFilters.parseTag('Version', rules),
            expires: CustomFilters.parseTag('Expires', rules),
            timeUpdated: CustomFilters.parseTag('TimeUpdated', rules),
        };
    };

    /**
     * Gets new filter id for custom filter
     */
    static genCustomFilterId(): number {
        let max = 0;
        customFiltersMetadata.data.forEach((f) => {
            if (f.filterId > max) {
                max = f.filterId;
            }
        });

        return max >= CUSTOM_FILTERS_START_ID ? max + 1 : CUSTOM_FILTERS_START_ID;
    }

    /**
     * Compares filter version or filter checksum
     * @param newVersion
     * @param newChecksum
     * @param oldFilter
     */
    static isFilterUpdated(newVersion: string, newChecksum: string, oldFilter: any): boolean {
        if (BrowserUtils.isSemver(oldFilter.version)
            && BrowserUtils.isSemver(newVersion)
        ) {
            return !BrowserUtils.isGreaterOrEqualsVersion(oldFilter.version, newVersion);
        }

        if (!oldFilter.checksum) {
            return true;
        }

        return newChecksum !== oldFilter.checksum;
    }

    /**
     * Count md5 checksum for the filter content
     * @param rules
     * @returns checksum string
     */
    static getChecksum(rules: string[]): string {
        const rulesText = rules.join('\n');
        return MD5(rulesText).toString();
    }

    /**
     * Safe download rules from subscription url
     * @param url
     */
    static async downloadRules(url: string) {
        let rules;

        try {
            rules = await networkService.downloadFilterRulesBySubscriptionUrl(url);
            return rules;
        } catch (e) {
            log.error(`Error download filter by url ${url}, cause: ${e || ''}`);
            return null;
        }
    }

    /**
     * Limits filter download with timeout
     * @param url
     */
    static async downloadRulesWithTimeout(url: string) {
        return Promise.race([
            CustomFilters.downloadRules(url),
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Fetch timeout is over')), CustomFilters.DOWNLOAD_LIMIT_MS);
            }),
        ]);
    }

    static async loadCustomFilterById(filterId: number) {
        const filter = customFiltersMetadata.getById(filterId);

        log.info(`Check if custom filter ${filterId} metadata exists...`);

        if (!filter) {
            log.error(`Can't find custom filter ${filterId} metadata`);
            return;
        }

        log.info(`Check if custom filter ${filterId} in storage...`);
        const rules = FiltersStorage.get(filterId);

        if (rules) {
            log.info(`Custom filter ${filterId} already loaded`);
            return;
        }

        log.info(`Loading custom filter ${filterId} from backend...`);

        const { customUrl } = filter;
        const isRemote = await CustomFilters.loadCustomFilter(customUrl);

        if (isRemote) {
            log.info(`Custom filter ${filterId} loaded from backend`);
            return;
        }

        log.error(`Can't load filter ${filterId} rules`);
    }

    /**
     * Adds or updates custom filter
     *
     * @param url subscriptionUrl
     * @param options
     */
    static async loadCustomFilter(url: string, options?: { name: string, trusted: boolean }) {
        let rules = [];

        try {
            rules = await CustomFilters.downloadRulesWithTimeout(url);
        } catch (e) {
            log.error(e);
            return false;
        }

        const parsedData = CustomFilters.parseFilterDataFromHeader(rules);
        const {
            name,
            description,
            homepage,
            version,
            expires,
            timeUpdated = new Date().toISOString(),
        } = parsedData;

        const checksum = !version || !BrowserUtils.isSemver(version) ? CustomFilters.getChecksum(rules) : null;

        // Check if filter from this url was added before
        const filterMetadata = customFiltersMetadata.getByUrl(url);

        let filterId: number;

        if (filterMetadata) {
            filterId = filterMetadata.filterId;

            if (!CustomFilters.isFilterUpdated(version, checksum, filterMetadata)) {
                await filtersVersion.set(filterId, {
                    version,
                    expires: Number(expires),
                    lastUpdateTime: new Date(timeUpdated).getTime(),
                    lastCheckTime: Date.now(),
                });
            }
        } else {
            filterId = CustomFilters.genCustomFilterId();

            await customFiltersMetadata.set({
                filterId,
                groupId: ANTIBANNER_GROUPS_ID.CUSTOM_FILTERS_GROUP_ID,
                name: options.name ? options.name : name,
                description,
                homepage,
                tags: [0],
                customUrl: url,
                trusted: !!options.trusted,
            });

            await filtersVersion.set(filterId, {
                version,
                expires: Number(expires),
                lastUpdateTime: new Date(timeUpdated).getTime(),
                lastCheckTime: Date.now(),
            });

            await filtersState.set(filterId, {
                loaded: true,
                installed: true,
                enabled: false,
            });
        }

        await FiltersStorage.set(filterId, rules);

        return true;
    }

    /**
     * Retrieves custom filter information
     * @param url
     */
    static async getCustomFilterInfo(url: string, title?: string) {
        // Check if filter from this url was added before
        if (customFiltersMetadata.getByUrl(url)) {
            return { errorAlreadyExists: true };
        }

        const rules = await CustomFilters.downloadRules(url);
        if (!rules) {
            return {};
        }

        const parsedData = CustomFilters.parseFilterDataFromHeader(rules);

        const filter = {
            ...parsedData,
            name: parsedData.name ? parsedData.name : title,
            timeUpdated: parsedData.timeUpdated ? parsedData.timeUpdated : new Date().toISOString(),
            customUrl: url,
            rulesCount: rules.filter(rule => rule.trim().indexOf('!') !== 0).length,
        };

        return { filter };
    }

    /**
     * Removes filter
     *
     * @param filter
     */
    static async removeFilter(filterId: number) {
        await customFiltersMetadata.remove(filterId);
        await FiltersStorage.remove(filterId);
    }

    private static parseTag(tagName: string, rules: string[]) {
        let result = '';

        // Look up no more than 50 first lines
        const maxLines = Math.min(CustomFilters.AMOUNT_OF_LINES_TO_PARSE, rules.length);
        for (let i = 0; i < maxLines; i += 1) {
            const rule = rules[i];
            const search = `! ${tagName}: `;
            const indexOfSearch = rule.indexOf(search);
            if (indexOfSearch >= 0) {
                result = rule.substring(indexOfSearch + search.length);
            }
        }

        if (tagName === 'Expires') {
            result = String(CustomFilters.parseExpiresStr(result));
        }

        return result;
    }
}
