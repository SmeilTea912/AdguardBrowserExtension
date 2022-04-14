import browser from 'webextension-polyfill';
import { ChangeUserSettingMessage, MessageType } from '../../../common/messages';
import { messageHandler } from '../../message-handler';
import { settingsStorage } from './settings-storage';
import { UserAgent } from '../../../common/user-agent';
import { AntiBannerFiltersId } from '../../../common/constants';

import stubData from './settings-stub-data.json';

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
        await settingsStorage.set(key, value);
    }

    static async resetSettings() {
        await settingsStorage.reset();
        return true;
    }
}
