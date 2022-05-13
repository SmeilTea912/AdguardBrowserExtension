/* eslint-disable @typescript-eslint/no-explicit-any */
import { log } from '../../../common/log';
import { networkService } from '../network/network-service';
import { SettingOption } from '../../../common/settings';
import { SettingsStorage } from '../settings/settings-storage';
import { ANTIBANNER_GROUPS_ID, CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER } from '../../../common/constants';

export class Metadata {
    data = {
        filters: [],
        groups: [],
        tags: [],
    };

    async init(): Promise<void> {
        log.info('Loading filters metadata from storage...');
        const isPersistant = await this.loadPersistant();

        if (isPersistant) {
            log.info('Filters metadata loaded from storage');
            return;
        }

        log.info('Loading metadata from local assets...');
        const islocal = await this.loadLocal();

        if (islocal) {
            log.info('Filters metadata loaded from local assets');
            return;
        }

        log.info('Loading metadata from backend...');
        const isBackend = await this.loadBackend();

        if (isBackend) {
            log.info('Filters metadata loaded from backend');
            return;
        }

        log.error('Can`t load metadata');
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
            log.error(e);
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
            log.error(e);
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
            log.error(e);
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

    async addCustomGroup() {
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

export const metadata = new Metadata();
