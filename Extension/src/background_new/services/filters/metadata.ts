/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { networkService } from '../network/network-service';
import { SettingOption } from '../../../common/settings';
import { SettingsStorage } from '../settings/settings-storage';

export class Metadata {
    data = {
        filters: [],
        groups: [],
        tags: [],
    };

    async init(): Promise<void> {
        console.log('Loading filters metadata from storage...');
        const isPersistant = await this.loadPersistant();

        if (isPersistant) {
            console.log('Filters metadata loaded from storage');
            return;
        }

        console.log('Loading metadata from local assets...');
        const islocal = await this.loadLocal();

        if (islocal) {
            console.log('Filters metadata loaded from local assets');
            return;
        }

        console.log('Loading metadata from backend...');
        const isBackend = await this.loadBackend();

        if (isBackend) {
            console.log('Filters metadata loaded from backend');
            return;
        }

        console.error('Can`t load metadata');
    }

    async loadPersistant(): Promise<boolean> {
        const data = SettingsStorage.get(SettingOption.METADATA);

        if (!data) {
            return false;
        }

        try {
            this.data = JSON.parse(data);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    async loadLocal(): Promise<boolean> {
        try {
            const data = await networkService.getLocalFiltersMetadata();

            if (!data) {
                return false;
            }

            this.data = data;
            await this.updateStorageData();
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    async loadBackend(): Promise<boolean> {
        try {
            const data = await networkService.downloadMetadataFromBackend();

            if (!data) {
                return false;
            }

            this.data = data;
            await this.updateStorageData();
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    getFilters() {
        return this.data.filters;
    }

    getFilter(filterId: number) {
        return this.data.filters.find(el => el.filterId === filterId);
    }

    getGroups() {
        return this.data.groups;
    }

    getGroup(groupId: number) {
        return this.data.groups.find(el => el.groupId === groupId);
    }

    getTags() {
        return this.data.tags;
    }

    getTag(tagId: number) {
        return this.data.tags.find(el => el.tagId === tagId);
    }

    setFilter(filterId: number, data: any) {
        this.data.filters[filterId] = data;
        this.updateStorageData();
    }

    setGroup(groupId: number, data: any) {
        this.data.groups[groupId] = data;
        this.updateStorageData();
    }

    setTag(tagId: number, data: any) {
        this.data.tags[tagId] = data;
        this.updateStorageData();
    }

    private async updateStorageData(): Promise<void> {
        SettingsStorage.set(SettingOption.METADATA, JSON.stringify(this.data));
    }
}

export const metadata = new Metadata();
