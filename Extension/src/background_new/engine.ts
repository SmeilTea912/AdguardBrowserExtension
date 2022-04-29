import { TsWebExtension, Configuration, MESSAGE_HANDLER_NAME } from '@adguard/tswebextension';
import { AntiBannerFiltersId } from '../common/constants';
import { SettingOption } from '../common/settings';
import { filtersState } from './services/filters/filters-state';
import { FiltersStorage } from './services/filters/filters-storage';
import { groupsState } from './services/filters/groups-state';
import { metadata } from './services/filters/metadata';
import { SettingsService } from './services/settings/settings-service';
import { SettingsStorage } from './services/settings/settings-storage';
import { log } from '../common/log';
import { listeners } from './notifier';

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
        log.info(`tswebextension configuration is updatetd. Rules count: ${rulesCount}`);
        listeners.notifyListeners(listeners.REQUEST_FILTER_UPDATED, {
            rulesCount,
        });
    }

    /**
     * Creates tswebextension configuration based on current app state
     */
    private static async getConfiguration(): Promise<Configuration> {
        const enabledFilters = filtersState.getEnabledFilters();
        const enabledGroups = groupsState.getEnabledGroups();

        const filters = [];
        let userrules = [];
        let allowlist = [];

        for (let i = 0; i < enabledFilters.length; i += 1) {
            const filterId = enabledFilters[i];

            const rules = FiltersStorage.get(filterId);

            if (filterId === AntiBannerFiltersId.USER_FILTER_ID) {
                if (SettingsStorage.get(SettingOption.USER_FILTER_ENABLED)) {
                    userrules = rules;
                }
                continue;
            }

            if (filterId === AntiBannerFiltersId.ALLOWLIST_FILTER_ID) {
                if (SettingsStorage.get(SettingOption.ALLOWLIST_ENABLED)) {
                    allowlist = rules;
                }
                continue;
            }

            const filterMetadata = metadata.getFilter(filterId);

            if (!enabledGroups.some((groupId) => groupId === filterMetadata.groupId)) {
                continue;
            }

            const rulesTexts = rules.join('\n');

            filters.push({
                filterId,
                content: rulesTexts,
            });
        }

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
