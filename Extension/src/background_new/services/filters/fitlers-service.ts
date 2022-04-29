/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
import browser from 'webextension-polyfill';
import { filtersState } from './filters-state';
import { filtersVersion } from './filters-version';
import { groupsState } from './groups-state';
import { metadata } from './metadata';
import { i18nMetadata } from './i18n-metadata';
import { FiltersStorage } from './filters-storage';
import {
    AddAndEnableFilterMessage,
    AntiBannerFiltersId,
    DisableAntiBannerFilter,
    MessageType,
} from '../../../common/constants';
import { networkService } from '../network/network-service';
import { messageHandler } from '../../message-handler';
import { Engine } from '../../engine';
import { log } from '../../../common/log';
import { listeners } from '../../notifier';

export class FiltersService {
    static async init() {
        await metadata.init();
        await i18nMetadata.init();
        filtersState.init();
        filtersVersion.init();
        groupsState.init();

        // TODO: debounce message events
        messageHandler.addListener(MessageType.ADD_AND_ENABLE_FILTER, FiltersService.onFilterEnable);
        messageHandler.addListener(MessageType.DISABLE_ANTIBANNER_FILTER, FiltersService.onFilterDisable);
        messageHandler.addListener(MessageType.ENABLE_FILTERS_GROUP, FiltersService.onGroupEnable);
        messageHandler.addListener(MessageType.DISABLE_FILTERS_GROUP, FiltersService.onGroupDisable);
        messageHandler.addListener(MessageType.GET_USER_RULES, FiltersService.getUserRules);
        messageHandler.addListener(MessageType.GET_USER_RULES_EDITOR_DATA, FiltersService.getUserRulesEditorData);
        messageHandler.addListener(MessageType.SAVE_USER_RULES, FiltersService.onSaveUserRules);
        messageHandler.addListener(MessageType.GET_ALLOWLIST_DOMAINS, FiltersService.getAllowlistDomains);
        messageHandler.addListener(MessageType.SAVE_ALLOWLIST_DOMAINS, FiltersService.onSaveAllowlistDomains);
        messageHandler.addListener(MessageType.CHECK_ANTIBANNER_FILTERS_UPDATE, FiltersService.onFiltersUpdate);
    }

    static async onFilterEnable(message: AddAndEnableFilterMessage) {
        const { filterId } = message.data;

        await FiltersService.addAndEnableFilters([filterId]);
        await Engine.update();
    }

    static async onFilterDisable(message: DisableAntiBannerFilter) {
        const { filterId } = message.data;

        await filtersState.disableFilters([filterId]);
        await Engine.update();
    }

    static async onGroupEnable(message: any) {
        const { groupId } = message.data;

        await groupsState.enableGroups([groupId]);
        await Engine.update();
    }

    static async onGroupDisable(message: any) {
        const { groupId } = message.data;

        await groupsState.disableGroups([groupId]);
        await Engine.update();
    }

    static async getUserRules() {
        const rulesText = FiltersStorage.get(AntiBannerFiltersId.USER_FILTER_ID);
        const content = (rulesText || []).join('\n');
        return { content, appVersion: browser.runtime.getManifest().version };
    }

    static async getUserRulesEditorData() {
        const rulesText = FiltersStorage.get(AntiBannerFiltersId.USER_FILTER_ID);
        const content = (rulesText || []).join('\n');
        return {
            userRules: content,
            // TODO
            // settings: settings.getAllSettings(),
        };
    }

    static async onSaveUserRules(message: any) {
        const { value } = message.data;

        await FiltersStorage.set(AntiBannerFiltersId.USER_FILTER_ID, value.split('\n'));

        // TODO
        filtersState.set(AntiBannerFiltersId.USER_FILTER_ID, {
            enabled: true,
            installed: true,
            loaded: true,
        });

        await Engine.update();

        listeners.notifyListeners(listeners.UPDATE_ALLOWLIST_FILTER_RULES);
    }

    static async getAllowlistDomains() {
        const text = FiltersStorage.get(AntiBannerFiltersId.ALLOWLIST_FILTER_ID);
        const content = (text || []).join('\n');
        return { content, appVersion: browser.runtime.getManifest().version };
    }

    static async onSaveAllowlistDomains(message: any) {
        const { value } = message.data;

        await FiltersStorage.set(AntiBannerFiltersId.ALLOWLIST_FILTER_ID, value.split('\n'));

        // TODO
        filtersState.set(AntiBannerFiltersId.ALLOWLIST_FILTER_ID, {
            enabled: true,
            installed: true,
            loaded: true,
        });

        await Engine.update();

        listeners.notifyListeners(listeners.UPDATE_ALLOWLIST_FILTER_RULES);
    }

    // TODO: simplify
    static async onFiltersUpdate() {
        log.info('update fitlers metadata...');
        await metadata.loadBackend();
        log.info('fitlers metadata updated');

        // reinit linked services
        await filtersState.init();
        await groupsState.init();

        const enabledFilters = filtersState.getEnabledFilters();

        log.info(`update filters: ${enabledFilters}`);
        await FiltersService.updateFilters(enabledFilters);
        // reenable filters after donwloading
        filtersState.enableFilters(enabledFilters);
        log.info(`filters ${enabledFilters.join(',')} are updated`);

        await Engine.update();

        // TODO: return only updated
        const updatedFilters = enabledFilters.map(filterId => metadata.getFilter(filterId));

        listeners.notifyListeners(listeners.FILTERS_UPDATE_CHECK_READY, updatedFilters);
        return updatedFilters;
    }

    static async addAndEnableFilters(filtersIds: number[]) {
        await FiltersService.loadFilters(filtersIds);
        filtersState.enableFilters(filtersIds);
    }

    static async loadFilterRules(filterId: number) {
        console.log(`Check if filter ${filterId} in storage...`);
        const rules = FiltersStorage.get(filterId);

        if (rules) {
            console.log(`Filter ${filterId} already loaded`);
            return;
        }

        console.log(`Loading filter ${filterId} from local assets...`);
        const isLocal = await FiltersService.loadFilterFromBackend(filterId, false);

        if (isLocal) {
            console.log(`Filter ${filterId} loaded from local assets`);
            return;
        }

        console.log(`Loading filter ${filterId} from backend...`);
        const isRemote = await FiltersService.loadFilterFromBackend(filterId, true);

        if (isRemote) {
            console.log(`Filter ${filterId} loaded from backend`);
            return;
        }

        console.error(`Can't load filter ${filterId} rules`);
    }

    // TODO: simplify update states
    static async loadFilterFromBackend(filterId: number, remote: boolean): Promise<boolean> {
        try {
            const rules = await networkService.downloadFilterRules(filterId, remote, false) as string[];

            await FiltersStorage.set(filterId, rules);

            filtersState.set(filterId, {
                installed: true,
                loaded: true,
                enabled: false,
            });

            const {
                version,
                expires,
                timeUpdated,
            } = metadata.getFilter(filterId);

            filtersVersion.set(filterId, {
                version,
                expires,
                lastUpdateTime: new Date(timeUpdated).getTime(),
                lastCheckTime: Date.now(),
            });

            return true;
        } catch (e) {
            filtersState.set(filterId, {
                installed: false,
                loaded: false,
                enabled: false,
            });

            console.error(e);
            return false;
        }
    }

    static async loadFilters(filtersIds: number[]) {
        return Promise.all(filtersIds.map((filterId) => FiltersService.loadFilterRules(filterId)));
    }

    static async updateFilters(filtersIds: number[]) {
        return Promise.all(filtersIds.map(filtersId => FiltersService.loadFilterFromBackend(filtersId, true)));
    }
}
