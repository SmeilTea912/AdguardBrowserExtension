import { log } from '../../../common/log';
import { SettingOption } from '../../../common/settings';
import { BrowserUtils } from '../../utils/browser-utils';
import { networkService } from '../network/network-service';
import { SettingsStorage } from '../settings/settings-storage';
import { CustomFilterApi, customFilterMetadataStorage } from './custom';
import { filtersState } from './filters-state';
import { FiltersStorage } from './filters-storage';
import { filtersVersion } from './filters-version';
import { groupsState } from './groups-state';
import { i18nMetadata } from './i18n-metadata';
import { metadataStorage } from './metadata';

/**
 * Encapsulates the logic for managing filter data that is stored in the extension.
 */
export class FiltersApi {
    /**
     * Initialize metadata and linked storages.
     *
     * Called while filters service initialization.
     */
    public static async initMetadata(): Promise<void> {
        await metadataStorage.init();
        await i18nMetadata.init();
        await customFilterMetadataStorage.init();

        filtersState.init();
        groupsState.init();
        filtersVersion.init();
    }

    /**
     * Load metadata from remote source and reload linked storages.
     *
     * Called before filters rules are updated or loaded from backend.
     *
     * @param remote - is metadata loaded from backend
     */
    public static async loadMetadata(remote: boolean): Promise<void> {
        await metadataStorage.loadMetadata(remote);

        filtersState.init();
        groupsState.init();
        filtersVersion.init();
    }

    /**
     * Checks if filter rules exist in browser storage.
     *
     * Called while filters loading.
     *
     * @param filterId - filter id
     */
    public static async isFilterRulesIsLoaded(filterId: number) {
        const filterState = filtersState.get(filterId);

        return filterState?.loaded;
    }

    /**
     * Load filters metadata and rules from external source.
     *
     * Skip loaded filters.
     *
     * @param filtersIds - loaded filters ids
     * @param remote - is metadata and rules loaded from backend
     */
    public static async loadFilters(filtersIds: number[], remote: boolean) {
        /**
         * Ignore loaded filters
         * Custom filters always has loaded state, so we don't need additional check
         */
        const unloadedFilters = filtersIds.filter(id => !FiltersApi.isFilterRulesIsLoaded(id));

        if (unloadedFilters.length === 0) {
            return;
        }

        await FiltersApi.loadMetadata(remote);

        await Promise.allSettled(unloadedFilters.map(id => FiltersApi.loadFilterRulesFromBackend(id, remote)));
    }

    /**
     * Force reload enabled common filters metadata and rules from backend
     *
     * Called on "use optimized filters" setting switch.
     *
     * @param filtersIds - loaded filters ids
     */
    public static async reloadEnabledFilters() {
        const filtersIds = FiltersApi.getEnabledFilters();

        /**
         * Ignore custom filters
         */
        const commonFilters = filtersIds.filter(id => !CustomFilterApi.isCustomFilter(id));

        await FiltersApi.loadMetadata(true);

        await Promise.allSettled(commonFilters.map(id => FiltersApi.loadFilterRulesFromBackend(id, true)));

        await filtersState.enableFilters(filtersIds);
    }

    /**
     * Load and enable fitlers.
     *
     * Called on initialization and filter option switch
     * @param filtersIds - filters ids
     * @param remote - is metadata and rules loaded from backend
     */
    public static async loadAndEnableFilters(filtersIds: number[], remote = true) {
        await FiltersApi.loadFilters(filtersIds, remote);
        await filtersState.enableFilters(filtersIds);
    }

    /**
     * @param filterId - filter id
     */
    public static async updateFilter(filterId: number): Promise<any> {
        log.info(`Update filter ${filterId}`);

        const filterMetadata = metadataStorage.getFilter(filterId);

        if (!filterMetadata) {
            log.error(`Can't find filter ${filterId} metadata`);
            return null;
        }

        if (!FiltersApi.isFilterNeedUpdate(filterMetadata)) {
            log.info(`Filter ${filterId} is already updated`);
            return null;
        }

        try {
            await FiltersApi.loadFilterRulesFromBackend(filterId, true);
            log.info(`Successfully update filter ${filterId}`);
            return filterMetadata;
        } catch (e) {
            log.error(e);
            return null;
        }
    }

    /**
     * Update filters
     *
     * @param filtersIds - filter ids
     */
    public static async updateFilters(filtersIds: number[]) {
        log.info('update filters ...');

        /**
         * Reload common filters metadata from backend for correct
         * version matching on update check.
         */
        FiltersApi.loadMetadata(true);

        const updatedFiltersMetadata = [];

        const updateTasks = filtersIds.map(async (filterId) => {
            let filterMetadata;

            if (CustomFilterApi.isCustomFilter(filterId)) {
                filterMetadata = await CustomFilterApi.updateCustomFilter(filterId);
            } else {
                filterMetadata = await FiltersApi.updateFilter(filterId);
            }

            if (filterMetadata) {
                updatedFiltersMetadata.push(filterMetadata);
            }
        });

        await Promise.allSettled(updateTasks);

        return updatedFiltersMetadata;
    }

    /**
     * Get filter metadata from correct storage.
     *
     * @param filterId - filter id
     */
    public static getFilterMetadata(filterId: number) {
        if (CustomFilterApi.isCustomFilter(filterId)) {
            return CustomFilterApi.getCustomFilterMetadata(filterId);
        }
        return metadataStorage.getFilter(filterId);
    }

    /**
     * Get filters metadata from both common and custom filters storage.
     */
    public static getFiltersMetadata() {
        return metadataStorage.getFilters().concat(CustomFilterApi.getCustomFiltersMetadata());
    }

    /**
     * Get enabled filters given the state of the group
     */
    public static getEnabledFilters() {
        const enabledFilters = filtersState.getEnabledFilters();
        const enableGroups = groupsState.getEnabledGroups();

        return enabledFilters.filter(id => {
            const filterMetadata = FiltersApi.getFilterMetadata(id);

            return enableGroups.some(groupId => groupId === filterMetadata.groupId);
        });
    }

    /**
     * Checks if common filter need update.
     * Matches version from metadata with data in filter version storage.
     */
    private static isFilterNeedUpdate(filterMetadata: any): boolean {
        log.info(`Check if filter ${filterMetadata.filterId} need to update`);

        const filterVersion = filtersVersion.get(filterMetadata.filterId);

        if (!filterVersion) {
            return true;
        }

        return !BrowserUtils.isGreaterOrEqualsVersion(filterVersion.version, filterMetadata.version);
    }

    /**
     * Download filter rules from backend and update filter state and metadata
     * @param filterId - filter id
     * @param remote - is filter rules loaded from backend
     */
    private static async loadFilterRulesFromBackend(filterId: number, remote: boolean) {
        const isOptimized = SettingsStorage.get(SettingOption.USE_OPTIMIZED_FILTERS);

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
        } = metadataStorage.getFilter(filterId);

        await filtersVersion.set(filterId, {
            version,
            expires,
            lastUpdateTime: new Date(timeUpdated).getTime(),
            lastCheckTime: Date.now(),
        });
    }
}
