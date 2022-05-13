/* eslint-disable class-methods-use-this */

import { filtersState } from './filters-state';
import { filtersVersion } from './filters-version';
import { groupsState } from './groups-state';
import { metadata } from './metadata';
import { i18nMetadata } from './i18n-metadata';
import { FiltersStorage } from './filters-storage';
import { CustomFilters } from './custom-filters';
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
import { customFiltersMetadata } from './custom-filters-metadata';

export class FiltersService {
    static async init() {
        await metadata.init();
        await metadata.addCustomGroup();
        await i18nMetadata.init();
        await customFiltersMetadata.init();
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
        if (filterId >= CUSTOM_FILTERS_START_ID) {
            log.info(`Filter ${filterId} is custom, use specific loading flow...`);
            await CustomFilters.loadCustomFilterById(filterId);
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
        try {
            const rules = await networkService.downloadFilterRules(filterId, remote, false) as string[];

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

    static async updateFilters(filtersIds: number[]) {
        return Promise.all(filtersIds.map(filtersId => FiltersService.loadFilterFromBackend(filtersId, true)));
    }
}
