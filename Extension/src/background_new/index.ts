/* eslint-disable no-console */
import browser from 'webextension-polyfill';
import { Configuration } from '@adguard/tswebextension';
import { messageHandler } from './message-handler';
import { UiService } from './services/ui-service';
import { PopupService } from './services/popup-service';
import { SettingsService } from './services/settings/settings-service';
import { FiltersService } from './services/filters/fitlers-service';
import { storage } from './storage';
import { tsWebExtension } from './tswebextension';

(async () => {
    // TODO: delete
    await browser.storage.local.clear();
    await storage.init();
    await SettingsService.init();
    UiService.init();
    PopupService.init();

    await FiltersService.init();

    const settingsConfig = SettingsService.getConfiguration();

    console.log('Start tswebextension...');

    await tsWebExtension.start({
        filters: [],
        allowlist: [],
        userrules: [],
        verbose: false,
        ...settingsConfig,
    } as Configuration);

    console.log('Rules count:', tsWebExtension.getRulesCount());

    messageHandler.init();
})();
