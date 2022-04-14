import { messageHandler } from './message-handler';
import { UiService } from './services/ui-service';
import { PopupService } from './services/popup-service';
import { SettingsService } from './services/settings/settings-service';
import { application } from './application';

(async () => {
    await SettingsService.init();
    UiService.init();
    PopupService.init();
    await application.start();
    messageHandler.init();
})();
