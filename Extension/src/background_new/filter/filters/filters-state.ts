/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */
import { listeners } from '../../notifier';
import { settingsStorage } from '../../services/settings/settings-storage';
import { SettingOption } from '../../../common/settings';
import { log } from '../../../common/log';

type FilterState = {
    loaded: boolean,
    enabled: boolean,
    installed: boolean,
};

type FilterVersion = {
    version: string,
    lastCheckTime: number,
    lastUpdateTime: number,
    expires: number,
};

type GroupState = {
    enabled: boolean,
};

type StorageData<T> = { [key: number]: T };

/**
  * Helper class for working with filters metadata storage (local storage)
  */
export class FiltersState {
    constructor() {
        // TODO: in service
        // Add event listener to persist filter metadata to local storage
        listeners.addListener((event, payload) => {
            switch (event) {
                case listeners.SUCCESS_DOWNLOAD_FILTER:
                    FiltersState.updateFilterState(payload);
                    FiltersState.updateFilterVersion(payload);
                    break;
                case listeners.FILTER_ADD_REMOVE:
                case listeners.FILTER_ENABLE_DISABLE:
                    FiltersState.updateFilterState(payload);
                    break;
                case listeners.FILTER_GROUP_ENABLE_DISABLE:
                    FiltersState.updateGroupState(payload);
                    break;
                default:
                    break;
            }
        });
    }

    /**
      * Gets filter version from the local storage
      */
    static getFiltersVersion(): StorageData<FilterVersion> {
        let filters = Object.create(null);
        try {
            const json = settingsStorage.get(SettingOption.FILTERS_VERSION_PROP);
            if (json) {
                filters = JSON.parse(json);
            }
        } catch (ex) {
            log.error('Error retrieve filters version info, cause {0}', ex);
        }
        return filters;
    }

    /**
      * Gets filters state from the local storage
      */
    static getFiltersState(): StorageData<FilterState> {
        let filters = Object.create(null);
        try {
            const json = settingsStorage.get(SettingOption.FILTERS_STATE_PROP);
            if (json) {
                filters = JSON.parse(json);
            }
        } catch (ex) {
            log.error('Error retrieve filters state info, cause {0}', ex);
        }
        return filters;
    }

    /**
      * Gets groups state from the local storage
      */
    static getGroupsState(): StorageData<GroupState> {
        let groups = Object.create(null);
        try {
            const json = settingsStorage.get(SettingOption.GROUPS_STATE_PROP);
            if (json) {
                groups = JSON.parse(json);
            }
        } catch (e) {
            log.error('Error retrieve groups state info, cause {0}', e);
        }
        return groups;
    }

    /**
      * Updates filter version in the local storage
      *
      * @param filter Filter version metadata
      */
    static updateFilterVersion(filter: FilterVersion & { filterId: number }) {
        const filters = FiltersState.getFiltersVersion();
        filters[filter.filterId] = {
            version: filter.version,
            lastCheckTime: filter.lastCheckTime,
            lastUpdateTime: filter.lastUpdateTime,
            expires: filter.expires,
        };

        settingsStorage.set(SettingOption.FILTERS_VERSION_PROP, JSON.stringify(filters));
    }

    /**
      * Updates filter state in the local storage
      *
      * @param filter Filter state object
      */
    static updateFilterState(filter: FilterState & { filterId: number }) {
        const filters = FiltersState.getFiltersState();
        filters[filter.filterId] = {
            loaded: filter.loaded,
            enabled: filter.enabled,
            installed: filter.installed,
        };
        settingsStorage.set(SettingOption.FILTERS_STATE_PROP, JSON.stringify(filters));
    }

    static removeFilter(filterId: number) {
        const filters = FiltersState.getFiltersState();
        delete filters[filterId];
        settingsStorage.set(SettingOption.FILTERS_STATE_PROP, JSON.stringify(filters));
    }

    /**
      * Updates group enable state in the local storage
      *
      * @param group - SubscriptionGroup object
      */
    static updateGroupState(group: GroupState & { groupId: number }) {
        const groups = FiltersState.getGroupsState();

        if (typeof group.enabled === 'undefined') {
            delete groups[group.groupId].enabled;
        } else {
            groups[group.groupId] = {
                enabled: group.enabled,
            };
        }

        settingsStorage.set(SettingOption.GROUPS_STATE_PROP, JSON.stringify(groups));
    }
}

export const fitlersState = new FiltersState();
