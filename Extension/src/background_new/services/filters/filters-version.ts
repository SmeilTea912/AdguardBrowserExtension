/* eslint-disable no-console */
import { SettingOption } from '../../../common/settings';
import { SettingsStorage } from '../settings/settings-storage';
import { FiltersApi } from './api';

export type FilterVersionData = {
    version: string,
    lastCheckTime: number,
    lastUpdateTime: number,
    expires: number,
};

export class FiltersVersion {
    data: Record<number, FilterVersionData> = {};

    init() {
        const filtersMetadata = FiltersApi.getFiltersMetadata();

        const storageData = SettingsStorage.get(SettingOption.FILTERS_VERSION_PROP);

        const data = storageData ? JSON.parse(storageData) : {};

        for (let i = 0; i < filtersMetadata.length; i += 1) {
            const {
                filterId,
                version,
                expires,
                timeUpdated,
            } = filtersMetadata[i] as {
                filterId: number,
                version: string,
                expires: number,
                timeUpdated: string,
            };

            if (!data[filterId]) {
                data[filterId] = {
                    version,
                    expires,
                    lastUpdateTime: new Date(timeUpdated).getTime(),
                    lastCheckTime: Date.now(),
                };
            }
        }

        this.data = data;

        this.updateStorageData();
    }

    get(filterId: number): FilterVersionData | undefined {
        return this.data[filterId];
    }

    async set(filterId: number, data: FilterVersionData) {
        this.data[filterId] = data;
        await this.updateStorageData();
    }

    async delete(filterId: number) {
        delete this.data[filterId];
        await this.updateStorageData();
    }

    private async updateStorageData() {
        await SettingsStorage.set(SettingOption.FILTERS_VERSION_PROP, JSON.stringify(this.data));
    }
}

export const filtersVersion = new FiltersVersion();
