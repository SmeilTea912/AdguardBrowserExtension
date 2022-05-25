import { MessageType } from '../../common/messages';
import { messageHandler } from '../message-handler';
import { settingsStorage } from './settings/settings-storage';
import stubData from './popup-stub-data.json';

export class PopupService {
    static init() {
        messageHandler.addListener(MessageType.GET_TAB_INFO_FOR_POPUP, PopupService.getTabInfoForPopup);
    }

    // TODO: implement
    static getTabInfoForPopup() {
        return Promise.resolve({
            ...stubData,
            settings: settingsStorage.getData(),
        });
    }
}
