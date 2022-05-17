import { SettingOption } from '../../../../common/settings';
import { SettingsStorage } from '../../settings/settings-storage';

export type CustomFilterMetadata = {
    filterId: number,
    groupId: number,
    name: string,
    description: string,
    homepage: string,
    tags: number[],
    customUrl: string,
    trusted: boolean,
    checksum: string | null,
    version: string,
};

export class CustomFilterMetadataStorage {
    data: CustomFilterMetadata[] = [];

    async init() {
        const storageData = SettingsStorage.get(SettingOption.CUSTOM_FILTERS);

        const data = storageData ? JSON.parse(storageData) : [];

        this.data = data;

        await this.updateStorageData();
    }

    getById(filterId: number): CustomFilterMetadata | undefined {
        return this.data.find(f => f.filterId === filterId);
    }

    getByUrl(url: string): CustomFilterMetadata | undefined {
        return this.data.find(f => f.customUrl === url);
    }

    async set(filter: CustomFilterMetadata): Promise<void> {
        const data = this.data.filter(f => f.filterId !== filter.filterId);

        data.push(filter);
        this.data = data;

        await this.updateStorageData();
    }

    async remove(filterId: number): Promise<void> {
        const data = this.data.filter(f => f.filterId !== filterId);
        this.data = data;

        await this.updateStorageData();
    }

    private async updateStorageData(): Promise<void> {
        await SettingsStorage.set(SettingOption.CUSTOM_FILTERS, JSON.stringify(this.data));
    }
}

export const customFilterMetadataStorage = new CustomFilterMetadataStorage();
