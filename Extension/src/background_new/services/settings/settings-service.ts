/* eslint-disable no-console */
import browser from 'webextension-polyfill';
import { MessageType } from '../../../common/messages';
import { messageHandler } from '../../message-handler';
import { SettingsStorage } from './settings-storage';
import { UserAgent } from '../../../common/user-agent';
import { AntiBannerFiltersId } from '../../../common/constants';

import stubData from './settings-stub-data.json';
// import { metadata } from '../filters/metadata';
import { TsWebExtension, tsWebExtension } from '../../tswebextension';
import { FiltersService } from '../filters/fitlers-service';

export class SettingsService {
    static async init() {
        await SettingsStorage.init();
        messageHandler.addListener(MessageType.GET_OPTIONS_DATA, SettingsService.getOptionsData);
        messageHandler.addListener(MessageType.RESET_SETTINGS, SettingsService.resetSettings);
        messageHandler.addListener(MessageType.CHANGE_USER_SETTING, SettingsService.changeUserSettings);
    }

    static getOptionsData() {
        return Promise.resolve({
            // TODO: implement filter data extraction
            ...stubData,
            settings: SettingsStorage.getData(),
            appVersion: browser.runtime.getManifest().version,
            environmentOptions: {
                isChrome: UserAgent.isChrome,
            },
            constants: {
                AntiBannerFiltersId,
            },
            filtersInfo: {
                rulesCount: tsWebExtension.getRulesCount(),
            },
            // filtersMetadata: metadata.data,
            // TODO: implement
            fullscreenUserRulesEditorIsOpen: false,
        });
    }

    static getConfiguration() {
        return SettingsStorage.getConfiguration();
    }

    static async resetSettings() {
        await SettingsStorage.reset();
        return true;
    }

    static async changeUserSettings(message) {
        const { key, value } = message.data;
        await SettingsStorage.set(key, value);
        await FiltersService.updateEngineConfig();
    }
}
