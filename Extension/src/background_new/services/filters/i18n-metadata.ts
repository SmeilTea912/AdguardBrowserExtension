/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { networkService } from '../network/network-service';
import { SettingOption } from '../../../common/settings';
import { SettingsStorage } from '../settings/settings-storage';

export class I18nMetadata {
    data = {
        filters: [],
        groups: [],
        tags: [],
    };

    async init(): Promise<void> {
        console.log('Loading filters i18n metadata from storage...');
        const isPersistant = await this.loadPersistant();

        if (isPersistant) {
            console.log('Filters i18n metadata loaded from storage');
            return;
        }

        console.log('Loading i18n metadata from local assets...');
        const islocal = await this.loadLocal();

        if (islocal) {
            console.log('Filters i18n metadata loaded from local assets');
            return;
        }

        console.log('Loading metadata from backend...');
        const isBackend = await this.loadBackend();

        if (isBackend) {
            console.log('Filters i18n metadata loaded from backend');
            return;
        }

        console.log('Can`t load i18n metadata');
    }

    async loadPersistant(): Promise<boolean> {
        const data = SettingsStorage.get(SettingOption.I18N_METADATA);

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
            const data = await networkService.getLocalFiltersI18nMetadata();

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
            const data = await networkService.downloadI18nMetadataFromBackend();

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

    getFilter(filterId: number) {
        return this.data.filters.find(el => el.filterId === filterId);
    }

    getGroup(groupId: number) {
        return this.data.groups.find(el => el.groupId === groupId);
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
        SettingsStorage.set(SettingOption.I18N_METADATA, JSON.stringify(this.data));
    }
}

export const i18nMetadata = new I18nMetadata();
