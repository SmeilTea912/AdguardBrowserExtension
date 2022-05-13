import { SettingOption } from '../../../common/settings';
import { SettingsStorage } from '../settings/settings-storage';

export class CustomFiltersMetadata {
    data = [];

    async init() {
        const storageData = SettingsStorage.get(SettingOption.CUSTOM_FILTERS);

        const data = storageData ? JSON.parse(storageData) : [];

        this.data = data;

        await this.updateStorageData();
    }

    getById(filterId: number) {
        return this.data.find(f => f.filterId === filterId);
    }

    getByUrl(url: string) {
        return this.data.find(f => f.customUrl === url);
    }

    async set(filter: any) {
        const data = this.data.filter(f => f.filterId !== filter.filterId);

        data.push(filter);
        this.data = data;

        await this.updateStorageData();
    }

    async remove(filterId: number) {
        const data = this.data.filter(f => f.filterId !== filterId);
        this.data = data;

        await this.updateStorageData();
    }

    private async updateStorageData() {
        await SettingsStorage.set(SettingOption.CUSTOM_FILTERS, JSON.stringify(this.data));
    }
}

export const customFiltersMetadata = new CustomFiltersMetadata();
