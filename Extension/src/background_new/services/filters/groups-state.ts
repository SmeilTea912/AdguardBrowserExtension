/* eslint-disable no-console */
import { SettingOption } from '../../../common/settings';
import { SettingsStorage } from '../settings/settings-storage';

export type GroupStateData = {
    enabled: boolean;
};

export class GroupsState {
    data: Record<number, GroupStateData> = {};

    async init() {
        const data = SettingsStorage.get(SettingOption.GROUPS_STATE_PROP);

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

    get(groupId: number): GroupStateData | undefined {
        return this.data[groupId];
    }

    async set(groupId: number, data: GroupStateData) {
        this.data[groupId] = data;
        await this.updateStorageData();
    }

    async delete(groupId: number) {
        delete this.data[groupId];
        await this.updateStorageData();
    }

    getEnabledGroups(): number[] {
        return Object
            .entries(this.data)
            .filter(([,state]) => state.enabled)
            .map(([id]) => Number(id));
    }

    async enableGroups(groupIds: number[]) {
        for (let i = 0; i < groupIds.length; i += 1) {
            const groupId = groupIds[i];
            this.data[groupId] = { enabled: true };
        }

        await this.updateStorageData();
    }

    async disableGroups(groupIds: number[]) {
        for (let i = 0; i < groupIds.length; i += 1) {
            const groupId = groupIds[i];
            this.data[groupId] = { enabled: false };
        }

        await this.updateStorageData();
    }

    private async updateStorageData() {
        await SettingsStorage.set(SettingOption.GROUPS_STATE_PROP, JSON.stringify(this.data));
    }
}

export const groupsState = new GroupsState();
