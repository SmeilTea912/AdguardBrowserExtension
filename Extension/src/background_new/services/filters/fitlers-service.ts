/* eslint-disable class-methods-use-this */

import { filtersState } from './filters-state';
import { filtersVersion } from './filters-version';
import { groupsState } from './groups-state';
import { metadata } from './metadata';
import { i18nMetadata } from './i18n-metadata';
import { FiltersStorage } from './filters-storage';
import { CustomFilterApi } from './custom/api';
import { customFilterMetadataStorage } from './custom/metadata';
import {
    AddAndEnableFilterMessage,
    DisableAntiBannerFilterMessage,
    MessageType,
    CUSTOM_FILTERS_START_ID,
} from '../../../common/constants';
import { networkService } from '../network/network-service';
import { messageHandler } from '../../message-handler';
import { Engine } from '../../engine';
import { log } from '../../../common/log';
import { listeners } from '../../notifier';
import { SettingsStorage } from '../settings/settings-storage';
import { SettingOption } from '../../../common/settings';

export class FiltersService {
    static async init() {
        await metadata.init();
        await metadata.addCustomGroup();
        await i18nMetadata.init();
        await customFilterMetadataStorage.init();
        filtersState.init();
        filtersVersion.init();
        groupsState.init();

        // TODO: debounce message events
        messageHandler.addListener(MessageType.ADD_AND_ENABLE_FILTER, FiltersService.onFilterEnable);
        messageHandler.addListener(MessageType.DISABLE_ANTIBANNER_FILTER, FiltersService.onFilterDisable);
        messageHandler.addListener(MessageType.ENABLE_FILTERS_GROUP, FiltersService.onGroupEnable);
        messageHandler.addListener(MessageType.DISABLE_FILTERS_GROUP, FiltersService.onGroupDisable);
        messageHandler.addListener(MessageType.CHECK_ANTIBANNER_FILTERS_UPDATE, FiltersService.onFiltersUpdate);
    }

    static async onFilterEnable(message: AddAndEnableFilterMessage) {
        const { filterId } = message.data;

        await FiltersService.addAndEnableFilters([filterId]);
        await Engine.update();
    }

    static async onFilterDisable(message: DisableAntiBannerFilterMessage) {
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

    // TODO: simplify
    static async onFiltersUpdate() {
        log.info('update fitlers metadata...');
        await metadata.loadBackend();
        await metadata.addCustomGroup();
        log.info('fitlers metadata updated');

        // reinit linked services
        await filtersState.init();
        await groupsState.init();

        const enabledFilters = filtersState.getEnabledFilters();

        log.info(`check filters updates: ${enabledFilters}`);
        const updatedFilters = await FiltersService.updateFilters(enabledFilters);

        // reenable filters after donwloading
        filtersState.enableFilters(enabledFilters);
        log.info(`filters ${updatedFilters.map(f => f.filterId).join(',')} are updated`);

        await Engine.update();

        listeners.notifyListeners(listeners.FILTERS_UPDATE_CHECK_READY, updatedFilters);
        return updatedFilters;
    }

    static async addAndEnableFilters(filtersIds: number[]) {
        await FiltersService.loadFilters(filtersIds);
        filtersState.enableFilters(filtersIds);
    }

    static async loadFilterRules(filterId: number) {
        if (FiltersService.isCustomFilter(filterId)) {
            log.info(`Filter ${filterId} is custom, use specific loading flow...`);
            await CustomFilterApi.updateCustomFilter(filterId);
            return;
        }

        log.info(`Check if filter ${filterId} in storage...`);
        const rules = FiltersStorage.get(filterId);

        if (rules) {
            log.info(`Filter ${filterId} already loaded`);
            return;
        }

        log.info(`Loading filter ${filterId} from local assets...`);
        const isLocal = await FiltersService.loadFilterFromBackend(filterId, false);

        if (isLocal) {
            log.info(`Filter ${filterId} loaded from local assets`);
            return;
        }

        log.info(`Loading filter ${filterId} from backend...`);
        const isRemote = await FiltersService.loadFilterFromBackend(filterId, true);

        if (isRemote) {
            log.info(`Filter ${filterId} loaded from backend`);
            return;
        }

        log.error(`Can't load filter ${filterId} rules`);
    }

    // TODO: simplify update states
    static async loadFilterFromBackend(filterId: number, remote: boolean): Promise<boolean> {
        const isOptimized = SettingsStorage.get(SettingOption.USE_OPTIMIZED_FILTERS);

        try {
            const rules = await networkService.downloadFilterRules(filterId, remote, isOptimized) as string[];

            await FiltersStorage.set(filterId, rules);

            await filtersState.set(filterId, {
                installed: true,
                loaded: true,
                enabled: false,
            });

            const {
                version,
                expires,
                timeUpdated,
            } = metadata.getFilter(filterId);

            await filtersVersion.set(filterId, {
                version,
                expires,
                lastUpdateTime: new Date(timeUpdated).getTime(),
                lastCheckTime: Date.now(),
            });

            return true;
        } catch (e) {
            await filtersState.set(filterId, {
                installed: false,
                loaded: false,
                enabled: false,
            });

            log.error(e);
            return false;
        }
    }

    static async loadFilters(filtersIds: number[]) {
        return Promise.all(filtersIds.map((filterId) => FiltersService.loadFilterRules(filterId)));
    }

    static async updateFilter(filterId: number): Promise<boolean> {
        if (FiltersService.isCustomFilter(filterId)) {
            return CustomFilterApi.updateCustomFilter(filterId);
        }

        return FiltersService.loadFilterFromBackend(filterId, true);
    }

    static async updateFilters(filtersIds: number[]) {
        const updatedFilters = [];

        const tasks = filtersIds.map(async (filterId) => {
            const isUpdated = await FiltersService.updateFilter(filterId);

            if (isUpdated) {
                const filterMetadata = FiltersService.isCustomFilter(filterId)
                    ? customFilterMetadataStorage.getById(filterId)
                    : metadata.getFilter(filterId);

                updatedFilters.push(filterMetadata);
            }
        });

        await Promise.all(tasks);

        return updatedFilters;
    }

    private static isCustomFilter(filterId: number): boolean {
        return filterId >= CUSTOM_FILTERS_START_ID;
    }
}
