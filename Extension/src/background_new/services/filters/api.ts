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

export class FiltersApi {
    public static async initMetadata(): Promise<void> {
        log.info('Init filters metadata...');
        await metadataStorage.init();
        await i18nMetadata.init();
        await customFilterMetadataStorage.init();

        filtersState.init();
        groupsState.init();
        filtersVersion.init();

        log.info('Filters metadata successfully initialized');
    }

    public static async updateMetadata(): Promise<void> {
        log.info('Update filters metadata...');
        await metadataStorage.loadBackend();

        // update linked storages
        filtersState.init();
        groupsState.init();
        filtersVersion.init();

        log.info('Filters metadata successfully updated');
    }

    public static async loadFilter(filterId: number) {
        log.info(`Check if filter ${filterId} in storage...`);

        const filterState = filtersState.get(filterId);

        if (filterState?.loaded) {
            log.info(`Filter ${filterId} already loaded`);
            return;
        }

        log.info(`Loading filter ${filterId} from local assets...`);

        try {
            await FiltersApi.loadFilterRulesFromBackend(filterId, false);
            log.info(`Filter ${filterId} loaded from local assets`);
            return;
        } catch (e) {
            log.error(e);
        }

        log.info(`Loading filter ${filterId} from backend...`);

        try {
            await FiltersApi.loadFilterRulesFromBackend(filterId, true);
            log.info(`Filter ${filterId} loaded from backend`);
            return;
        } catch (e) {
            log.error(e);
        }
    }

    public static async loadFilters(filtersIds: number[]) {
        Promise.allSettled(filtersIds.map((id) => this.loadFilter(id)));
    }

    public static async loadAndEnableFilters(filtersIds: number[]) {
        await FiltersApi.loadFilters(filtersIds);
        filtersState.enableFilters(filtersIds);
    }

    public static async updateFilter(filterId: number): Promise<any> {
        log.info(`Update filter ${filterId} ...`);

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

    public static async updateFilters(filtersIds: number[]) {
        log.info('update filters ...');

        try {
            await FiltersApi.updateMetadata();
        } catch (e) {
            log.error(e);
            return;
        }

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

    public static getFilterMetadata(filterId: number) {
        if (CustomFilterApi.isCustomFilter(filterId)) {
            return CustomFilterApi.getCustomFilterMetadata(filterId);
        }
        return metadataStorage.getFilter(filterId);
    }

    public static getFiltersMetadata() {
        return metadataStorage.getFilters().concat(CustomFilterApi.getCustomFiltersMetadata());
    }

    private static isFilterNeedUpdate(filterMetadata: any): boolean {
        log.info(`Check if filter ${filterMetadata.filterId} need to update`);

        const filterVersion = filtersVersion.get(filterMetadata.filterId);

        if (!filterVersion) {
            return true;
        }

        return !BrowserUtils.isGreaterOrEqualsVersion(filterVersion.version, filterMetadata.version);
    }

    private static async loadFilterRulesFromBackend(filterId: number, remote: boolean) {
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
            } = metadataStorage.getFilter(filterId);

            await filtersVersion.set(filterId, {
                version,
                expires,
                lastUpdateTime: new Date(timeUpdated).getTime(),
                lastCheckTime: Date.now(),
            });
        } catch (e) {
            await filtersState.set(filterId, {
                installed: false,
                loaded: false,
                enabled: false,
            });

            throw new Error(e.message);
        }
    }
}
