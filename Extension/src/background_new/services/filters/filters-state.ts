/* eslint-disable no-console */
import { SettingOption } from '../../../common/settings';
import { SettingsStorage } from '../settings/settings-storage';
import { metadataStorage } from './metadata';

export type FilterStateData = {
    enabled: boolean;
    installed: boolean;
    loaded: boolean;
};

export class FiltersState {
    static defaultState = {
        enabled: false,
        installed: false,
        loaded: false,
    };

    data: Record<number, FilterStateData> = {};

    init() {
        const filtersMetadata = metadataStorage.getFilters();

        const storageData = SettingsStorage.get(SettingOption.FILTERS_STATE_PROP);

        const data = storageData ? JSON.parse(storageData) : {};

        for (let i = 0; i < filtersMetadata.length; i += 1) {
            const { filterId } = filtersMetadata[i] as { filterId: number };

            data[filterId] = data[filterId] || FiltersState.defaultState;
        }

        this.data = data;

        this.updateStorageData();
    }

    get(filterId: number): FilterStateData | undefined {
        return this.data[filterId];
    }

    async set(filterId: number, data: FilterStateData) {
        this.data[filterId] = data;
        await this.updateStorageData();
    }

    async delete(filterId: number) {
        delete this.data[filterId];
        await this.updateStorageData();
    }

    getEnabledFilters(): number[] {
        return Object
            .entries(this.data)
            .filter(([,state]) => state.enabled)
            .map(([id]) => Number(id));
    }

    async enableFilters(filtersIds: number[]) {
        for (let i = 0; i < filtersIds.length; i += 1) {
            const filterId = filtersIds[i];
            this.data[filterId] = { ...this.data[filterId], enabled: true };
        }

        await this.updateStorageData();
    }

    async disableFilters(filtersIds: number[]) {
        for (let i = 0; i < filtersIds.length; i += 1) {
            const filterId = filtersIds[i];
            this.data[filterId] = { ...this.data[filterId], enabled: false };
        }

        await this.updateStorageData();
    }

    private async updateStorageData() {
        await SettingsStorage.set(SettingOption.FILTERS_STATE_PROP, JSON.stringify(this.data));
    }
}

export const filtersState = new FiltersState();
