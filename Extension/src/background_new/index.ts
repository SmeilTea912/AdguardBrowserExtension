import { messageHandler } from './message-handler';
import { UiService } from './services/ui-service';
import { PopupService } from './services/popup-service';
import { SettingsService } from './services/settings/settings-service';
import { application } from './application';
import { ANTIBANNER_GROUPS_ID } from '../common/constants';

(async () => {
    await SettingsService.init();
    UiService.init();
    PopupService.init();

    await application.start({
        async onInstall() {
            // Process installation
            /**
             * Show UI installation page
             */
            // UiService.openFiltersDownloadPage();

            // Retrieve filters and install them
            const filterIds = application.offerFilters();
            await application.addAndEnableFilters(filterIds);
            // enable language-specific group by default
            await application.enableGroup(ANTIBANNER_GROUPS_ID.LANGUAGE_FILTERS_GROUP_ID);
        },
    });

    messageHandler.init();
})();
