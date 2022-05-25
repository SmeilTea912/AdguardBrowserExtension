import { TsWebExtension, Configuration, MESSAGE_HANDLER_NAME } from '@adguard/tswebextension';
import { AntiBannerFiltersId } from '../common/constants';
import { SettingOption } from '../common/settings';
import { FiltersStorage } from './services/filters/filters-storage';
import { SettingsService } from './services/settings/settings-service';
import { settingsStorage } from './services/settings/settings-storage';
import { log } from '../common/log';
import { listeners } from './notifier';
import { FiltersApi } from './services/filters/api';

export type { Message as EngineMessage } from '@adguard/tswebextension';

export class Engine {
    static api = new TsWebExtension('web-accessible-resources');

    static messageHandlerName = MESSAGE_HANDLER_NAME;

    static messageHandler = Engine.api.getMessageHandler();

    static async start() {
        const configuration = await Engine.getConfiguration();

        log.info('Start tswebextension...');
        await Engine.api.start(configuration);

        const rulesCount = Engine.api.getRulesCount();
        log.info(`tswebextension is started. Rules count: ${rulesCount}`);
        listeners.notifyListeners(listeners.REQUEST_FILTER_UPDATED, {
            rulesCount,
        });
    }

    static async update() {
        const configuration = await Engine.getConfiguration();

        log.info('Update tswebextension configuration...');
        await Engine.api.configure(configuration);

        const rulesCount = Engine.api.getRulesCount();
        log.info(`tswebextension configuration is updated. Rules count: ${rulesCount}`);
        listeners.notifyListeners(listeners.REQUEST_FILTER_UPDATED, {
            rulesCount,
        });
    }

    /**
     * Creates tswebextension configuration based on current app state
     */
    private static async getConfiguration(): Promise<Configuration> {
        const enabledFilters = FiltersApi.getEnabledFilters();

        const filters = [];
        let userrules = [];
        let allowlist = [];

        const tasks = enabledFilters.map(async (filterId) => {
            const rules = await FiltersStorage.get(filterId);

            if (filterId === AntiBannerFiltersId.USER_FILTER_ID) {
                if (settingsStorage.get(SettingOption.USER_FILTER_ENABLED)) {
                    userrules = rules;
                }
                return;
            }

            if (filterId === AntiBannerFiltersId.ALLOWLIST_FILTER_ID) {
                if (settingsStorage.get(SettingOption.ALLOWLIST_ENABLED)) {
                    allowlist = rules;
                }
                return;
            }

            const rulesTexts = rules.join('\n');

            filters.push({
                filterId,
                content: rulesTexts,
            });
        });

        await Promise.all(tasks);

        const settings = SettingsService.getConfiguration();

        return {
            verbose: false,
            filters,
            userrules,
            allowlist,
            settings,
        };
    }
}
