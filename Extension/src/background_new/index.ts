/* eslint-disable no-console */
import browser from 'webextension-polyfill';
import { messageHandler } from './message-handler';
import { UiService } from './services/ui-service';
import { PopupService } from './services/popup-service';
import { SettingsService } from './services/settings/settings-service';
import { FiltersService } from './services/filters/fitlers-service';
import { storage } from './storage';
import { Engine } from './engine';

(async () => {
    // TODO: delete
    await browser.storage.local.clear();
    await storage.init();
    await SettingsService.init();
    UiService.init();
    PopupService.init();

    await FiltersService.init();

    await Engine.start();

    messageHandler.init();
})();
