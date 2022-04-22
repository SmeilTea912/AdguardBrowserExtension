/* eslint-disable no-console */
import { SettingOption } from '../../../common/settings';
import { SettingsStorage } from '../settings/settings-storage';

export type FilterStateData = {
    enabled: boolean;
    installed: boolean;
    loaded: boolean;
};

export class FiltersState {
    data: Record<number, FilterStateData> = {};

    async init() {
        const data = SettingsStorage.get(SettingOption.FILTERS_STATE_PROP);

        if (!data) {
            return;
        }

        try {
            this.data = JSON.parse(data);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        }
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
