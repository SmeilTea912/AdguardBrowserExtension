import browser from 'webextension-polyfill';
import { ChangeUserSettingMessage, MessageType } from '../../../common/messages';
import { messageHandler } from '../../message-handler';
import { settingsStorage } from './settings-storage';
import { UserAgent } from '../../../common/user-agent';
import { AntiBannerFiltersId } from '../../../common/constants';
import { antiBannerService } from '../../filter/antibanner';

import stubData from './settings-stub-data.json';
import { SettingOption } from '../../../common/settings';

export class SettingsService {
    static async init() {
        await settingsStorage.init();
        messageHandler.addListener(MessageType.GET_OPTIONS_DATA, SettingsService.getOptionsData);
        messageHandler.addListener(MessageType.CHANGE_USER_SETTING, SettingsService.changeUserSettings);
        messageHandler.addListener(MessageType.RESET_SETTINGS, SettingsService.resetSettings);
    }

    static getOptionsData() {
        return Promise.resolve({
            // TODO: implement filter data extraction
            ...stubData,
            settings: settingsStorage.getData(),
            appVersion: browser.runtime.getManifest().version,
            environmentOptions: {
                isChrome: UserAgent.isChrome,
            },
            constants: {
                AntiBannerFiltersId,
            },
            // TODO: implement
            fullscreenUserRulesEditorIsOpen: false,
        });
    }

    static async changeUserSettings({ data }: ChangeUserSettingMessage) {
        const { key, value } = data;
        /* TODO
        // on USE_OPTIMIZED_FILTERS setting change we need to reload filters
        const onUsedOptimizedFiltersChange = utils.concurrent.debounce(
            reloadAntiBannerFilters,
            RELOAD_FILTERS_DEBOUNCE_PERIOD,
        );
        */
        await settingsStorage.set(key, value);

        switch (key) {
            case SettingOption.USER_FILTER_ENABLED:
                await antiBannerService.createRequestFilter();
                break;
            default:
                break;
        }
    }

    static async resetSettings() {
        await settingsStorage.reset();
        return true;
    }
}
