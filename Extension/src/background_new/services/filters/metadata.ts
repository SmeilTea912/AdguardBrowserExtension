/* eslint-disable @typescript-eslint/no-explicit-any */
import { log } from '../../../common/log';
import { networkService } from '../network/network-service';
import { SettingOption } from '../../../common/settings';
import { SettingsStorage } from '../settings/settings-storage';
import { ANTIBANNER_GROUPS_ID, CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER } from '../../../common/constants';

export class MetadataStorage {
    data = {
        filters: [],
        groups: [],
        tags: [],
    };

    async init(): Promise<void> {
        try {
            const isPersistant = await this.loadPersistant();

            if (isPersistant) {
                return;
            }
        } catch (e) {
            log.error(e);
        }

        try {
            await this.loadLocal();
            return;
        } catch (e) {
            log.error(e);
        }

        try {
            await this.loadBackend();
            return;
        } catch (e) {
            log.error(e);
        }
    }

    async loadPersistant(): Promise<boolean> {
        log.info('Loading filters metadata from storage...');
        const data = SettingsStorage.get(SettingOption.METADATA);

        if (!data) {
            return false;
        }

        this.data = JSON.parse(data);
        this.addCustomGroup();
        await this.updateStorageData();
        log.info('Filters metadata loaded from storage');

        return true;
    }

    async loadLocal() {
        log.info('Loading metadata from local assets...');
        const data = await networkService.getLocalFiltersMetadata();
        this.data = data;
        await this.addCustomGroup();
        await this.updateStorageData();
        log.info('Filters metadata loaded from local assets');
    }

    async loadBackend() {
        log.info('Loading metadata from backend...');
        const data = await networkService.downloadMetadataFromBackend();
        this.data = data;
        await this.addCustomGroup();
        await this.updateStorageData();
        log.info('Filters metadata loaded from backend');
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

    private async addCustomGroup() {
        if (!this.data[ANTIBANNER_GROUPS_ID.CUSTOM_FILTERS_GROUP_ID]) {
            await this.setGroup(ANTIBANNER_GROUPS_ID.CUSTOM_FILTERS_GROUP_ID, {
                displayNumber: CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER,
                groupId: ANTIBANNER_GROUPS_ID.CUSTOM_FILTERS_GROUP_ID,
                groupName: 'Custom',
            });
        }
    }

    private async updateStorageData(): Promise<void> {
        await SettingsStorage.set(SettingOption.METADATA, JSON.stringify(this.data));
    }
}

export const metadataStorage = new MetadataStorage();
