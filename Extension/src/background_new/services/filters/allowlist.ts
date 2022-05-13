import browser from 'webextension-polyfill';
import { FiltersStorage } from './filters-storage';
import {
    AntiBannerFiltersId,
    MessageType,
    SaveAllowlistDomainsMessage,
} from '../../../common/constants';
import { messageHandler } from '../../message-handler';
import { filtersState } from './filters-state';
import { Engine } from '../../engine';
import { listeners } from '../../notifier';

export class Allowlist {
    static async init() {
        const domains = FiltersStorage.get(AntiBannerFiltersId.ALLOWLIST_FILTER_ID);

        if (!domains) {
            await FiltersStorage.set(AntiBannerFiltersId.ALLOWLIST_FILTER_ID, []);
        }

        messageHandler.addListener(MessageType.GET_ALLOWLIST_DOMAINS, Allowlist.getAllowlistDomains);
        messageHandler.addListener(MessageType.SAVE_ALLOWLIST_DOMAINS, Allowlist.setAllowlistDomains);
    }

    static async getAllowlistDomains() {
        const text = FiltersStorage.get(AntiBannerFiltersId.ALLOWLIST_FILTER_ID);
        const content = (text || []).join('\n');
        return { content, appVersion: browser.runtime.getManifest().version };
    }

    static async setAllowlistDomains(message: SaveAllowlistDomainsMessage) {
        const { value } = message.data;

        await FiltersStorage.set(AntiBannerFiltersId.ALLOWLIST_FILTER_ID, value.split('\n'));

        filtersState.set(AntiBannerFiltersId.ALLOWLIST_FILTER_ID, {
            enabled: true,
            installed: true,
            loaded: true,
        });

        await Engine.update();

        listeners.notifyListeners(listeners.UPDATE_ALLOWLIST_FILTER_RULES);
    }
}
