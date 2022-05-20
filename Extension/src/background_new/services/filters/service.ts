/* eslint-disable class-methods-use-this */

import { filtersState } from './filters-state';
import { groupsState } from './groups-state';

import {
    AddAndEnableFilterMessage,
    DisableAntiBannerFilterMessage,
    MessageType,
} from '../../../common/constants';
import { messageHandler } from '../../message-handler';
import { Engine } from '../../engine';
import { listeners } from '../../notifier';
import { FiltersApi } from './api';

export class FiltersService {
    static async init() {
        await FiltersApi.initMetadata();

        // TODO: debounce message events
        messageHandler.addListener(MessageType.ADD_AND_ENABLE_FILTER, FiltersService.onFilterEnable);
        messageHandler.addListener(MessageType.DISABLE_ANTIBANNER_FILTER, FiltersService.onFilterDisable);
        messageHandler.addListener(MessageType.ENABLE_FILTERS_GROUP, FiltersService.onGroupEnable);
        messageHandler.addListener(MessageType.DISABLE_FILTERS_GROUP, FiltersService.onGroupDisable);
        messageHandler.addListener(MessageType.CHECK_ANTIBANNER_FILTERS_UPDATE, FiltersService.onFiltersUpdate);
    }

    static async onFilterEnable(message: AddAndEnableFilterMessage) {
        const { filterId } = message.data;

        await FiltersApi.loadAndEnableFilters([filterId]);
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

    static async onFiltersUpdate() {
        const enabledFilters = filtersState.getEnabledFilters();

        const updatedFilters = await FiltersApi.updateFilters(enabledFilters);

        filtersState.enableFilters(enabledFilters);

        await Engine.update();

        listeners.notifyListeners(listeners.FILTERS_UPDATE_CHECK_READY, updatedFilters);
        return updatedFilters;
    }
}
