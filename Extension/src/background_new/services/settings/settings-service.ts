/* eslint-disable no-console */
import browser from 'webextension-polyfill';
import { MessageType } from '../../../common/messages';
import { messageHandler } from '../../message-handler';
import { settingsStorage } from './settings-storage';
import { UserAgent } from '../../../common/user-agent';
import { AntiBannerFiltersId } from '../../../common/constants';

import { Engine } from '../../engine';
import { Categories } from '../filters/filters-categories';
import { listeners } from '../../notifier';
import { SettingOption } from '../../../common/settings';
import { FiltersService } from '../filters/service';
import { FiltersApi } from '../filters/api';

export class SettingsService {
    static async init() {
        await settingsStorage.init();
        messageHandler.addListener(MessageType.GET_OPTIONS_DATA, SettingsService.getOptionsData);
        messageHandler.addListener(MessageType.RESET_SETTINGS, SettingsService.resetSettings);
        messageHandler.addListener(MessageType.CHANGE_USER_SETTING, SettingsService.changeUserSettings);
    }

    static getOptionsData() {
        return Promise.resolve({
            settings: settingsStorage.getData(),
            appVersion: browser.runtime.getManifest().version,
            environmentOptions: {
                isChrome: UserAgent.isChrome,
            },
            constants: {
                AntiBannerFiltersId,
            },
            filtersInfo: {
                rulesCount: Engine.api.getRulesCount(),
            },
            filtersMetadata: Categories.getFiltersMetadata(),
            fullscreenUserRulesEditorIsOpen: false,
        });
    }

    static getConfiguration() {
        return settingsStorage.getConfiguration();
    }

    static async resetSettings() {
        await settingsStorage.reset();
        return true;
    }

    static async changeUserSettings(message) {
        const { key, value } = message.data;
        await settingsStorage.set(key, value);

        if (key === SettingOption.USE_OPTIMIZED_FILTERS) {
            await FiltersApi.reloadEnabledFilters();
            await Engine.update();
        }

        listeners.notifyListeners(listeners.SETTING_UPDATED, {
            propertyName: key,
            propertyValue: value,
        });
    }
}
