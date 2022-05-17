/* eslint-disable no-console */
import { messageHandler } from './message-handler';
import { UiService } from './services/ui-service';
import { PopupService } from './services/popup-service';
import { SettingsService } from './services/settings/settings-service';
import { FiltersService } from './services/filters/fitlers-service';
import { eventService } from './services/event-service';
import { storage } from './storage';
import { Engine } from './engine';
import { safebrowsingService } from './services/safebrowsing-service';
import { Allowlist } from './services/filters/allowlist';
import { Userrules } from './services/filters/userrules';
import { CustomFilterService } from './services/filters/custom/service';

(async () => {
    await storage.init();
    await SettingsService.init();
    UiService.init();
    PopupService.init();
    await FiltersService.init();
    await Allowlist.init();
    await Userrules.init();
    await CustomFilterService.init();
    await Engine.start();

    messageHandler.init();
    eventService.init();
    safebrowsingService.init();
})();
