/* eslint-disable @typescript-eslint/no-explicit-any */
import { log } from '../../../common/log';
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
        log.info('Loading filters i18n metadata from storage...');
        const isPersistant = await this.loadPersistant();

        if (isPersistant) {
            log.info('Filters i18n metadata loaded from storage');
            return;
        }

        log.info('Loading i18n metadata from local assets...');
        const islocal = await this.loadLocal();

        if (islocal) {
            log.info('Filters i18n metadata loaded from local assets');
            return;
        }

        log.info('Loading metadata from backend...');
        const isBackend = await this.loadBackend();

        if (isBackend) {
            log.info('Filters i18n metadata loaded from backend');
            return;
        }

        log.info('Can`t load i18n metadata');
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

    getFilters() {
        return this.data.filters;
    }

    getGroup(groupId: number) {
        return this.data.groups.find(el => el.groupId === groupId);
    }

    getGroups() {
        return this.data.groups;
    }

    getTag(tagId: number) {
        return this.data.tags.find(el => el.tagId === tagId);
    }

    getTags() {
        return this.data.tags;
    }

    async setFilter(filterId: number, filter: any) {
        const filters = this.getFilters().filter(f => f.filterId !== filterId);
        filters.push(filter);
        this.data.filters = filters;
        await this.updateStorageData();
    }

    async setGroup(groupId: number, group: any) {
        const groups = this.getGroups().filter(g => g.groupId !== groupId);
        groups.push(group);
        this.data.groups = groups;
        await this.updateStorageData();
    }

    async setTag(tagId: number, tag: any) {
        const tags = this.getTags().filter(t => t.tagId !== tagId);
        tags.push(tag);
        this.data.tags = tags;
        await this.updateStorageData();
    }

    private async updateStorageData(): Promise<void> {
        SettingsStorage.set(SettingOption.I18N_METADATA, JSON.stringify(this.data));
    }
}

export const i18nMetadata = new I18nMetadata();
