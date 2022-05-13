import { FiltersStorage } from './filters-storage';
import {
    AntiBannerFiltersId,
    MessageType,
    SaveUserRulesMessage,
} from '../../../common/constants';
import { messageHandler } from '../../message-handler';
import { filtersState } from './filters-state';
import { Engine } from '../../engine';
import { listeners } from '../../notifier';

export class Userrules {
    static async init() {
        const userRules = FiltersStorage.get(AntiBannerFiltersId.USER_FILTER_ID);

        if (!userRules) {
            await FiltersStorage.set(AntiBannerFiltersId.USER_FILTER_ID, []);
        }

        messageHandler.addListener(MessageType.GET_USER_RULES, Userrules.getUserRules);
        messageHandler.addListener(MessageType.GET_USER_RULES_EDITOR_DATA, Userrules.getUserRulesEditorData);
        messageHandler.addListener(MessageType.SAVE_USER_RULES, Userrules.setUserRules);
    }

    static async getUserRules() {
        const rulesText = FiltersStorage.get(AntiBannerFiltersId.USER_FILTER_ID);
        const content = (rulesText || []).join('\n');
        return { content, appVersion: browser.runtime.getManifest().version };
    }

    static async getUserRulesEditorData() {
        const rulesText = FiltersStorage.get(AntiBannerFiltersId.USER_FILTER_ID);
        const content = (rulesText || []).join('\n');
        return {
            userRules: content,
            // TODO
            // settings: settings.getAllSettings(),
        };
    }

    static async setUserRules(message: SaveUserRulesMessage) {
        const { value } = message.data;

        await FiltersStorage.set(AntiBannerFiltersId.USER_FILTER_ID, value.split('\n'));

        filtersState.set(AntiBannerFiltersId.USER_FILTER_ID, {
            enabled: true,
            installed: true,
            loaded: true,
        });

        await Engine.update();

        listeners.notifyListeners(listeners.UPDATE_ALLOWLIST_FILTER_RULES);
    }
}
